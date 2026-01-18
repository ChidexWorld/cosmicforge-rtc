//! Email Service
//!
//! High-level email service that enqueues emails for async delivery.
//! All emails are queued and processed by the background worker.
//!
//! ## Usage
//!
//! ```rust
//! // Enqueue a verification email
//! email_service.send_verification_email(&email, &username, &token).await?;
//! ```
//!
//! ## Adding New Email Types
//!
//! 1. Create a template in `templates/email/`
//! 2. Add a method here that calls `enqueue_email()`
//! 3. Generate an idempotency key to prevent duplicates
//!
//! See /docs/EMAIL_QUEUE.md for full documentation.

use sea_orm::DatabaseConnection;
use uuid::Uuid;

use crate::config::EmailConfig;
use crate::error::ApiResult;
use crate::queues::EmailQueue;
use crate::templates::email::{
    notification_email, password_reset_email, verification_email, welcome_email,
};

// ============================================================================
// EMAIL SERVICE
// ============================================================================

/// High-level email service for the application.
///
/// Provides methods for common email types (verification, password reset, etc.).
/// All emails are enqueued for async delivery by the background worker.
#[derive(Clone)]
pub struct EmailService {
    queue: EmailQueue,
    app_url: String,
}

impl EmailService {
    /// Create a new EmailService
    pub fn new(db: DatabaseConnection, config: &EmailConfig) -> Self {
        Self {
            queue: EmailQueue::new(db),
            app_url: config.app_url.clone(),
        }
    }

    /// Get the app URL for building links
    pub fn app_url(&self) -> &str {
        &self.app_url
    }

    // ========================================================================
    // EMAIL METHODS
    // ========================================================================
    // To add a new email type:
    // 1. Create template in templates/email/
    // 2. Add method here following the pattern below
    // 3. Generate unique idempotency_key to prevent duplicates
    // ========================================================================

    /// Send verification email with a verification code
    ///
    /// Idempotency: Uses "verification:{user_email}:{code}" to prevent
    /// sending duplicate verification emails for the same code.
    pub async fn send_verification_email(
        &self,
        to_email: &str,
        username: &str,
        verification_code: &str,
    ) -> ApiResult<Uuid> {
        let template = verification_email(username, verification_code);

        // Idempotency key includes code to allow re-sending with new code
        let idempotency_key = format!("verification:{}:{}", to_email, verification_code);

        self.queue
            .enqueue(
                &idempotency_key,
                to_email,
                Some(username),
                "Verify Your Email - CosmicForge HealthNet",
                &template.html,
                &template.text,
            )
            .await
    }

    /// Send password reset email
    /// Send password reset email with a 6-digit reset code
    ///
    /// Idempotency: Uses "password_reset:{user_email}:{code}" to prevent
    /// sending duplicate reset emails for the same code.
    pub async fn send_password_reset_email(
        &self,
        to_email: &str,
        username: &str,
        reset_code: &str,
    ) -> ApiResult<Uuid> {
        let template = password_reset_email(username, reset_code);

        let idempotency_key = format!("password_reset:{}:{}", to_email, reset_code);

        self.queue
            .enqueue(
                &idempotency_key,
                to_email,
                Some(username),
                "Reset Your Password - CosmicForge HealthNet",
                &template.html,
                &template.text,
            )
            .await
    }

    /// Send welcome email after successful verification
    ///
    /// Idempotency: Uses "welcome:{user_email}" to ensure only one
    /// welcome email per user.
    pub async fn send_welcome_email(&self, to_email: &str, username: &str) -> ApiResult<Uuid> {
        let template = welcome_email(username, &self.app_url);

        // Only one welcome email per user ever
        let idempotency_key = format!("welcome:{}", to_email);

        self.queue
            .enqueue(
                &idempotency_key,
                to_email,
                Some(username),
                "Welcome to CosmicForge HealthNet!",
                &template.html,
                &template.text,
            )
            .await
    }

    /// Send a generic notification email
    ///
    /// Idempotency: Uses provided notification_id to prevent duplicates.
    /// The caller must provide a unique notification_id for each notification.
    pub async fn send_notification_email(
        &self,
        to_email: &str,
        username: &str,
        subject: &str,
        message: &str,
        notification_id: &str, // Unique ID for this notification
    ) -> ApiResult<Uuid> {
        let template = notification_email(username, subject, message);

        let idempotency_key = format!("notification:{}:{}", to_email, notification_id);

        self.queue
            .enqueue(
                &idempotency_key,
                to_email,
                Some(username),
                subject,
                &template.html,
                &template.text,
            )
            .await
    }
}
