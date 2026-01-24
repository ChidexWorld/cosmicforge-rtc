//! API Key DTOs
//!
//! Data Transfer Objects for API key management endpoints.

use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use utoipa::ToSchema;
use uuid::Uuid;
use validator::Validate;

/// Request to create a new API key
#[derive(Debug, Deserialize, Validate, ToSchema)]
pub struct CreateApiKeyRequest {
    /// Usage limit for the API key (default: 1000)
    #[validate(range(min = 1, max = 1000000, message = "Usage limit must be between 1 and 1,000,000"))]
    pub usage_limit: Option<i32>,

    /// Expiration date for the API key
    pub expires_at: DateTime<Utc>,
}

/// Response when creating an API key (includes the full key - only shown once)
#[derive(Debug, Serialize, ToSchema)]
pub struct CreateApiKeyResponse {
    pub id: Uuid,
    /// The full API key - only returned on creation, never retrievable again
    pub api_key: String,
    pub usage_limit: i32,
    pub used_count: i32,
    pub expires_at: DateTime<Utc>,
    pub status: String,
    pub created_at: DateTime<Utc>,
}

/// Response for API key info (masked key)
#[derive(Debug, Serialize, ToSchema)]
pub struct ApiKeyResponse {
    pub id: Uuid,
    /// Masked API key (shows last 4 characters only)
    pub api_key_masked: String,
    pub usage_limit: i32,
    pub used_count: i32,
    pub expires_at: DateTime<Utc>,
    pub status: String,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

/// Response for listing API keys
#[derive(Debug, Serialize, ToSchema)]
pub struct ListApiKeysResponse {
    pub success: bool,
    pub data: Vec<ApiKeyResponse>,
}

/// API response wrapper for create API key
#[derive(Debug, Serialize, ToSchema)]
pub struct CreateApiKeyApiResponse {
    pub success: bool,
    pub data: CreateApiKeyResponse,
}

/// API response wrapper for single API key
#[derive(Debug, Serialize, ToSchema)]
pub struct ApiKeyApiResponse {
    pub success: bool,
    pub data: ApiKeyResponse,
}

/// Response for API key revocation
#[derive(Debug, Serialize, ToSchema)]
pub struct RevokeApiKeyResponse {
    pub success: bool,
    pub message: String,
}

/// Claims extracted from API key authentication
#[derive(Debug, Clone)]
pub struct ApiKeyClaims {
    pub user_id: Uuid,
    pub api_key_id: Uuid,
}
