use sea_orm::DatabaseConnection;
use std::sync::Arc;

use crate::config::{AppConfig, EmailConfig, LiveKitConfig};
use crate::services::auth::JwtService;
use crate::services::email::EmailService;
use crate::services::livekit::LiveKitService;

#[derive(Clone)]
pub struct AppState {
    pub db: DatabaseConnection,
    pub jwt_service: Arc<JwtService>,
    pub email_service: Arc<EmailService>,
    pub livekit_service: Arc<LiveKitService>,
    /// Frontend/Hosted UI URL for generating join links
    pub app_url: String,
}

impl AppState {
    pub fn new(
        db: DatabaseConnection,
        app_config: &AppConfig,
        email_config: &EmailConfig,
        livekit_config: &LiveKitConfig,
    ) -> Self {
        Self {
            db: db.clone(),
            jwt_service: Arc::new(JwtService::new(app_config.jwt_secret.clone())),
            email_service: Arc::new(EmailService::new(db, email_config)),
            livekit_service: Arc::new(LiveKitService::new(livekit_config)),
            app_url: app_config.app_url.clone(),
        }
    }

    /// Generate join URL for a meeting
    pub fn join_url(&self, meeting_identifier: &str) -> String {
        format!("{}/join/{}", self.app_url, meeting_identifier)
    }
}
