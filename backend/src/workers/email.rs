//! Email Worker
//!
//! Background worker that processes queued email jobs.
//! Implements retry with exponential backoff and dead-letter queue.
//!
//! ## Configuration
//!
//! - `POLL_INTERVAL_SECS` - How often to check for new jobs
//! - `BATCH_SIZE` - Max jobs to process per poll
//! - `BASE_BACKOFF_SECS` - Base delay for exponential backoff
//!
//! See `/docs/EMAIL_QUEUE.md` for full documentation.

use lettre::{
    message::{header::ContentType, Mailbox},
    transport::smtp::authentication::Credentials,
    AsyncSmtpTransport, AsyncTransport, Message, Tokio1Executor,
};
use sea_orm::{
    ActiveModelTrait, ColumnTrait, DatabaseConnection, EntityTrait, QueryFilter, QueryOrder,
    QuerySelect, Set,
};
use std::sync::Arc;
use tokio::sync::watch;
use tokio::time::{sleep, Duration};
use uuid::Uuid;

// ✅ Concurrency and stream helpers
use futures_util::stream::StreamExt; // Provides `for_each_concurrent`

use crate::config::EmailConfig;
use crate::models::email_jobs::{self, ActiveModel, EmailJobStatus, Entity as EmailJobs, Model};

// ============================================================================
// CONFIGURATION
// ============================================================================

/// How often to poll for new jobs (seconds)
const POLL_INTERVAL_SECS: u64 = 5;

/// Maximum jobs to process per batch
const BATCH_SIZE: u64 = 10;

/// Base delay for exponential backoff (seconds)
const BASE_BACKOFF_SECS: i64 = 60;

// ============================================================================
// EMAIL WORKER
// ============================================================================

/// Background worker for processing email jobs
pub struct EmailWorker {
    db: DatabaseConnection,
    mailer: Arc<AsyncSmtpTransport<Tokio1Executor>>,
    from_email: String,
    from_name: String,
}

impl EmailWorker {
    /// Create a new EmailWorker
    pub fn new(db: DatabaseConnection, config: &EmailConfig) -> Result<Self, String> {
        let credentials =
            Credentials::new(config.smtp_username.clone(), config.smtp_password.clone());

        // Use STARTTLS for port 587 (Gmail, most providers), or implicit TLS for port 465
        let mailer = if config.smtp_port == 465 {
            AsyncSmtpTransport::<Tokio1Executor>::relay(&config.smtp_host)
                .map_err(|e| format!("Failed to create SMTP transport: {}", e))?
                .port(config.smtp_port)
                .credentials(credentials)
                .build()
        } else {
            // Port 587 uses STARTTLS
            AsyncSmtpTransport::<Tokio1Executor>::starttls_relay(&config.smtp_host)
                .map_err(|e| format!("Failed to create SMTP transport: {}", e))?
                .port(config.smtp_port)
                .credentials(credentials)
                .build()
        };

        Ok(Self {
            db,
            mailer: Arc::new(mailer),
            from_email: config.from_email.clone(),
            from_name: config.from_name.clone(),
        })
    }

    /// Start the worker loop
    ///
    /// Runs until shutdown signal is received.
    pub async fn run(&self, mut shutdown_rx: watch::Receiver<bool>) {
        tracing::info!(
            "Email worker started (from: {} <{}>, polling every {}s)",
            self.from_name,
            self.from_email,
            POLL_INTERVAL_SECS
        );

        loop {
            // Check for shutdown
            if *shutdown_rx.borrow() {
                tracing::info!("Email worker shutting down");
                break;
            }

            // Process pending jobs
            if let Err(e) = self.process_batch().await {
                tracing::error!("Error processing email batch: {}", e);
            }

            // Wait before next poll
            tokio::select! {
                _ = sleep(Duration::from_secs(POLL_INTERVAL_SECS)) => {}
                _ = shutdown_rx.changed() => {
                    if *shutdown_rx.borrow() {
                        tracing::info!("Email worker shutting down");
                        break;
                    }
                }
            }
        }
    }

    /// Process a batch of pending email jobs
    async fn process_batch(&self) -> Result<(), String> {
        let now = chrono::Utc::now().naive_utc();

        // 1️⃣ Fetch jobs (pending or failed & eligible for retry)
        let jobs = EmailJobs::find()
            .filter(
                email_jobs::Column::Status.is_in([EmailJobStatus::Pending, EmailJobStatus::Failed]),
            )
            .filter(
                email_jobs::Column::NextRetryAt
                    .is_null()
                    .or(email_jobs::Column::NextRetryAt.lte(now)),
            )
            .order_by_asc(email_jobs::Column::CreatedAt)
            .limit(BATCH_SIZE)
            .all(&self.db)
            .await
            .map_err(|e| format!("Failed to fetch jobs: {}", e))?;

        if jobs.is_empty() {
            tracing::debug!("No email jobs to process");
            return Ok(());
        }

        tracing::info!("Claiming {} email job(s)", jobs.len());

        // 2️⃣ Mark all jobs as processing safely
        let mut claimed_jobs = Vec::with_capacity(jobs.len());
        for job in jobs {
            let mut active: ActiveModel = job.clone().into();
            active.status = Set(EmailJobStatus::Processing);
            active.updated_at = Set(now);

            match active.update(&self.db).await {
                Ok(updated) => claimed_jobs.push(updated),
                Err(e) => tracing::error!("Failed to claim job {}: {}", job.id, e),
            }
        }

        if claimed_jobs.is_empty() {
            tracing::warn!("No jobs could be claimed for processing");
            return Ok(());
        }

        // 3️⃣ Process emails concurrently (LIMIT 3)
        tokio_stream::iter(claimed_jobs)
            .for_each_concurrent(3, |job| {
                let this = self;
                async move {
                    this.process_job(job).await;
                }
            })
            .await;

        Ok(())
    }

    /// Process a single email job
    async fn process_job(&self, job: Model) {
        let job_id = job.id;

        match self.send_email(&job).await {
            Ok(()) => {
                if let Err(e) = self.mark_sent(job_id).await {
                    tracing::error!("Failed to mark job {} as sent: {}", job_id, e);
                }
            }
            Err(e) => {
                tracing::warn!("Email job {} failed: {}", job_id, e);

                if let Err(e2) = self
                    .handle_failure(job_id, job.retry_count, job.max_retries, &e)
                    .await
                {
                    tracing::error!("Failure handling job {}: {}", job_id, e2);
                }
            }
        }
    }

    /// Send email via SMTP
    async fn send_email(&self, job: &Model) -> Result<(), String> {
        let from_mailbox: Mailbox = format!("{} <{}>", self.from_name, self.from_email)
            .parse()
            .map_err(|e| format!("Invalid from email: {}", e))?;

        let to_display = job.to_name.as_deref().unwrap_or(&job.to_email);
        let to_mailbox: Mailbox = format!("{} <{}>", to_display, job.to_email)
            .parse()
            .map_err(|e| format!("Invalid recipient email: {}", e))?;

        let email = Message::builder()
            .from(from_mailbox)
            .to(to_mailbox)
            .subject(&job.subject)
            .multipart(
                lettre::message::MultiPart::alternative()
                    .singlepart(
                        lettre::message::SinglePart::builder()
                            .header(ContentType::TEXT_PLAIN)
                            .body(job.text_body.clone()),
                    )
                    .singlepart(
                        lettre::message::SinglePart::builder()
                            .header(ContentType::TEXT_HTML)
                            .body(job.html_body.clone()),
                    ),
            )
            .map_err(|e| format!("Failed to build email: {}", e))?;

        self.mailer.send(email).await.map_err(|e| {
            tracing::error!(
                "SMTP send failed for job {} to {}: {}",
                job.id,
                job.to_email,
                e
            );
            format!("SMTP error: {}", e)
        })?;

        tracing::info!("Email sent successfully: {} -> {}", job.id, job.to_email);
        Ok(())
    }

    /// Mark job as sent
    async fn mark_sent(&self, job_id: Uuid) -> Result<(), String> {
        let now = chrono::Utc::now().naive_utc();

        // Load the job first
        let job = EmailJobs::find_by_id(job_id)
            .one(&self.db)
            .await
            .map_err(|e| format!("DB error fetching job {}: {}", job_id, e))?
            .ok_or_else(|| format!("Job {} not found", job_id))?;

        let mut active: ActiveModel = job.into();
        active.status = Set(EmailJobStatus::Sent);
        active.sent_at = Set(Some(now));
        active.updated_at = Set(now);

        active
            .update(&self.db)
            .await
            .map_err(|e| format!("DB error updating job {}: {}", job_id, e))?;

        tracing::info!("Email job {} marked as sent", job_id);
        Ok(())
    }

    /// Handle send failure with retry logic
    async fn handle_failure(
        &self,
        job_id: Uuid,
        current_retry: i32,
        max_retries: i32,
        error: &str,
    ) -> Result<(), String> {
        let now = chrono::Utc::now().naive_utc();
        let new_retry_count = current_retry + 1;

        // Load the job
        let job = EmailJobs::find_by_id(job_id)
            .one(&self.db)
            .await
            .map_err(|e| format!("DB error fetching job {}: {}", job_id, e))?
            .ok_or_else(|| format!("Job {} not found", job_id))?;

        let mut active: ActiveModel = job.into();
        active.retry_count = Set(new_retry_count);
        active.last_error = Set(Some(error.to_string()));
        active.updated_at = Set(now);

        if new_retry_count >= max_retries {
            // Move to dead-letter queue
            active.status = Set(EmailJobStatus::DeadLetter);
            active
                .update(&self.db)
                .await
                .map_err(|e| format!("DB error updating job {}: {}", job_id, e))?;

            tracing::warn!(
                "Email job {} moved to dead letter after {} retries",
                job_id,
                new_retry_count
            );
        } else {
            // Schedule retry with exponential backoff
            let backoff_secs = BASE_BACKOFF_SECS * (1 << new_retry_count);
            let next_retry = now + chrono::Duration::seconds(backoff_secs);

            active.status = Set(EmailJobStatus::Failed);
            active.next_retry_at = Set(Some(next_retry));

            active
                .update(&self.db)
                .await
                .map_err(|e| format!("DB error updating job {}: {}", job_id, e))?;

            tracing::info!(
                "Email job {} retry {} scheduled for {:?}",
                job_id,
                new_retry_count,
                next_retry
            );
        }

        Ok(())
    }
}

// ============================================================================
// WORKER HANDLE
// ============================================================================

/// Handle for controlling the email worker
pub struct EmailWorkerHandle {
    shutdown_tx: watch::Sender<bool>,
}

impl EmailWorkerHandle {
    /// Signal the worker to shut down
    pub fn shutdown(&self) {
        let _ = self.shutdown_tx.send(true);
    }
}

/// Spawn the email worker as a background task
///
/// Returns a handle for shutdown, or None if creation failed.
pub fn spawn_email_worker(
    db: DatabaseConnection,
    config: &EmailConfig,
) -> Option<EmailWorkerHandle> {
    let worker = match EmailWorker::new(db, config) {
        Ok(w) => w,
        Err(e) => {
            tracing::error!("Failed to create email worker: {}", e);
            return None;
        }
    };

    let (shutdown_tx, shutdown_rx) = watch::channel(false);

    tokio::spawn(async move {
        worker.run(shutdown_rx).await;
    });

    Some(EmailWorkerHandle { shutdown_tx })
}
