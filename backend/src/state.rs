use sea_orm::DatabaseConnection;
use std::sync::Arc;

use crate::config::EmailConfig;
use crate::services::auth::JwtService;
use crate::services::email::EmailService;

#[derive(Clone)]
pub struct AppState {
    pub db: DatabaseConnection,
    pub jwt_service: Arc<JwtService>,
    pub email_service: Arc<EmailService>,
}

impl AppState {
    pub fn new(db: DatabaseConnection, jwt_secret: String, email_config: &EmailConfig) -> Self {
        Self {
            db: db.clone(),
            jwt_service: Arc::new(JwtService::new(jwt_secret)),
            email_service: Arc::new(EmailService::new(db, email_config)),
        }
    }
}
