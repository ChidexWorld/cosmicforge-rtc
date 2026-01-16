use sea_orm::DatabaseConnection;
use std::sync::Arc;
use crate::services::auth::JwtService;

#[derive(Clone)]
pub struct AppState {
    pub db: DatabaseConnection,
    pub jwt_service: Arc<JwtService>,
}

impl AppState {
    pub fn new(db: DatabaseConnection, jwt_secret: String) -> Self {
        Self {
            db,
            jwt_service: Arc::new(JwtService::new(jwt_secret)),
        }
    }
}
