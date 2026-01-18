//! Application Configuration
//!
//! Core application settings loaded from environment variables.

use crate::error::{ApiError, ApiResult};

/// Application configuration
#[derive(Clone)]
pub struct AppConfig {
    /// Database connection URL
    pub database_url: String,

    /// JWT signing secret
    pub jwt_secret: String,

    /// Server host address
    pub host: String,

    /// Server port
    pub port: u16,
}

impl AppConfig {
    /// Load configuration from environment variables
    pub fn from_env() -> ApiResult<Self> {
        Ok(Self {
            database_url: std::env::var("DATABASE_URL")
                .map_err(|_| ApiError::InternalError("DATABASE_URL must be set".to_string()))?,

            jwt_secret: std::env::var("JWT_SECRET")
                .unwrap_or_else(|_| "your-secret-key-change-this-in-production".to_string()),

            host: std::env::var("HOST").unwrap_or_else(|_| "127.0.0.1".to_string()),

            port: std::env::var("PORT")
                .unwrap_or_else(|_| "8080".to_string())
                .parse()
                .map_err(|_| ApiError::InternalError("Invalid PORT".to_string()))?,
        })
    }

    /// Get the server address (host:port)
    pub fn server_addr(&self) -> String {
        format!("{}:{}", self.host, self.port)
    }
}
