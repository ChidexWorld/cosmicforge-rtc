//! Email Queue
//!
//! Handles enqueueing email jobs for async processing.
//! Jobs are stored in the database and processed by the email worker.
//!
//! ## Idempotency
//!
//! Each job has a unique `idempotency_key` to prevent duplicate sends.
//! If a job with the same key exists, `enqueue()` returns the existing job ID.
//!
//! See `/docs/EMAIL_QUEUE.md` for full documentation.

use sea_orm::{ActiveModelTrait, ColumnTrait, DatabaseConnection, EntityTrait, QueryFilter, Set};
use uuid::Uuid;

use crate::error::{ApiError, ApiResult};
use crate::models::email_jobs::{self, ActiveModel, EmailJobStatus, Entity as EmailJobs};
use crate::utils::now_utc;

/// Default maximum retry attempts
pub const DEFAULT_MAX_RETRIES: i32 = 3;

// ============================================================================
// EMAIL QUEUE
// ============================================================================

/// Service for enqueueing email jobs
#[derive(Clone)]
pub struct EmailQueue {
    db: DatabaseConnection,
}

impl EmailQueue {
    /// Create a new EmailQueue instance
    pub fn new(db: DatabaseConnection) -> Self {
        Self { db }
    }

    /// Enqueue an email job for async sending
    ///
    /// # Arguments
    ///
    /// * `idempotency_key` - Unique key to prevent duplicates
    /// * `to_email` - Recipient email address
    /// * `to_name` - Optional recipient display name
    /// * `subject` - Email subject
    /// * `html_body` - HTML content
    /// * `text_body` - Plain text content
    ///
    /// # Returns
    ///
    /// * `Ok(job_id)` - UUID of the created/existing job
    pub async fn enqueue(
        &self,
        idempotency_key: &str,
        to_email: &str,
        to_name: Option<&str>,
        subject: &str,
        html_body: &str,
        text_body: &str,
    ) -> ApiResult<Uuid> {
        self.enqueue_with_retries(
            idempotency_key,
            to_email,
            to_name,
            subject,
            html_body,
            text_body,
            DEFAULT_MAX_RETRIES,
        )
        .await
    }

    /// Enqueue with custom max retries
    pub async fn enqueue_with_retries(
        &self,
        idempotency_key: &str,
        to_email: &str,
        to_name: Option<&str>,
        subject: &str,
        html_body: &str,
        text_body: &str,
        max_retries: i32,
    ) -> ApiResult<Uuid> {
        // Check for existing job (idempotency)
        if let Some(existing) = EmailJobs::find()
            .filter(email_jobs::Column::IdempotencyKey.eq(idempotency_key))
            .one(&self.db)
            .await?
        {
            tracing::debug!("Email job exists: {}", idempotency_key);
            return Ok(existing.id);
        }

        let now = now_utc();
        let job_id = Uuid::new_v4();

        let job = ActiveModel {
            id: Set(job_id),
            idempotency_key: Set(idempotency_key.to_string()),
            to_email: Set(to_email.to_string()),
            to_name: Set(to_name.map(|s| s.to_string())),
            subject: Set(subject.to_string()),
            html_body: Set(html_body.to_string()),
            text_body: Set(text_body.to_string()),
            status: Set(EmailJobStatus::Pending),
            retry_count: Set(0),
            max_retries: Set(max_retries),
            next_retry_at: Set(Some(now)),
            last_error: Set(None),
            created_at: Set(now),
            updated_at: Set(now),
            sent_at: Set(None),
        };

        job.insert(&self.db).await.map_err(|e| {
            tracing::error!("Failed to enqueue email: {}", e);
            ApiError::InternalError(format!("Failed to enqueue email: {}", e))
        })?;

        tracing::info!("Email queued: {} -> {} ({})", job_id, to_email, subject);
        Ok(job_id)
    }
}
