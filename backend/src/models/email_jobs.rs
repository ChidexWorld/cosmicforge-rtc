//! Email Jobs Model
//!
//! Represents queued email jobs for async processing.
//! See /docs/EMAIL_QUEUE.md for full documentation.

use sea_orm::entity::prelude::*;
use serde::{Deserialize, Serialize};

/// Email job database entity
#[derive(Clone, Debug, PartialEq, DeriveEntityModel, Serialize, Deserialize)]
#[sea_orm(table_name = "email_jobs")]
pub struct Model {
    #[sea_orm(primary_key, auto_increment = false)]
    pub id: Uuid,

    /// Unique key to prevent duplicate sends (e.g., "verification:user@example.com:abc123")
    pub idempotency_key: String,

    /// Recipient email address
    pub to_email: String,

    /// Recipient display name (optional)
    pub to_name: Option<String>,

    /// Email subject line
    pub subject: String,

    /// HTML version of the email body
    #[sea_orm(column_type = "Text")]
    pub html_body: String,

    /// Plain text version of the email body
    #[sea_orm(column_type = "Text")]
    pub text_body: String,

    /// Current job status
    pub status: EmailJobStatus,

    /// Number of send attempts
    pub retry_count: i32,

    /// Maximum retry attempts before moving to dead letter
    pub max_retries: i32,

    /// When to attempt next retry (null = ready now)
    pub next_retry_at: Option<DateTime>,

    /// Last error message if failed
    #[sea_orm(column_type = "Text", nullable)]
    pub last_error: Option<String>,

    pub created_at: DateTime,
    pub updated_at: DateTime,

    /// When the email was successfully sent
    pub sent_at: Option<DateTime>,
}

/// Email job processing status
#[derive(Debug, Clone, PartialEq, Eq, EnumIter, DeriveActiveEnum, Serialize, Deserialize)]
#[sea_orm(rs_type = "String", db_type = "Enum", enum_name = "email_job_status")]
pub enum EmailJobStatus {
    /// Waiting to be processed
    #[sea_orm(string_value = "pending")]
    Pending,

    /// Currently being processed by a worker
    #[sea_orm(string_value = "processing")]
    Processing,

    /// Successfully sent
    #[sea_orm(string_value = "sent")]
    Sent,

    /// Failed but may retry
    #[sea_orm(string_value = "failed")]
    Failed,

    /// Failed permanently, moved to dead letter queue
    #[sea_orm(string_value = "dead_letter")]
    DeadLetter,
}

#[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
pub enum Relation {}

impl ActiveModelBehavior for ActiveModel {}
