//! API Key Handlers
//!
//! HTTP handlers for API key management.

use axum::{
    extract::{Path, State},
    http::StatusCode,
    Extension, Json,
};
use rand::Rng;
use sea_orm::{ActiveModelTrait, ColumnTrait, EntityTrait, QueryFilter, QueryOrder, Set};
use uuid::Uuid;
use validator::Validate;

use crate::{
    dto::{
        naive_to_utc, utc_to_naive, ApiKeyApiResponse, ApiKeyResponse, CreateApiKeyApiResponse,
        CreateApiKeyRequest, CreateApiKeyResponse, ListApiKeysResponse, RevokeApiKeyResponse,
    },
    error::{ApiError, ApiResult},
    models::api_keys::{self, ApiKeyStatus, Entity as ApiKeys},
    services::auth::Claims,
    state::AppState,
};

/// Generate a secure random API key
fn generate_api_key() -> String {
    const CHARSET: &[u8] = b"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let mut rng = rand::thread_rng();
    (0..64)
        .map(|_| {
            let idx = rng.gen_range(0..CHARSET.len());
            CHARSET[idx] as char
        })
        .collect()
}

/// Mask API key showing only last 4 characters
fn mask_api_key(key: &str) -> String {
    if key.len() <= 4 {
        return "*".repeat(key.len());
    }
    format!("{}...{}", "*".repeat(8), &key[key.len() - 4..])
}

/// Format API key status to string
fn format_status(status: &ApiKeyStatus) -> String {
    match status {
        ApiKeyStatus::Active => "active".to_string(),
        ApiKeyStatus::Revoked => "revoked".to_string(),
    }
}

/// Create a new API key
#[utoipa::path(
    post,
    path = "/api/v1/api-keys",
    tag = "API Keys",
    request_body = CreateApiKeyRequest,
    responses(
        (status = 201, description = "API key created successfully", body = CreateApiKeyApiResponse),
        (status = 400, description = "Validation error"),
        (status = 401, description = "Unauthorized")
    ),
    security(
        ("bearer_auth" = [])
    )
)]
pub async fn create_api_key(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Json(payload): Json<CreateApiKeyRequest>,
) -> ApiResult<(StatusCode, Json<CreateApiKeyApiResponse>)> {
    payload
        .validate()
        .map_err(|e| ApiError::ValidationError(e.to_string()))?;

    let user_id = Uuid::parse_str(&claims.sub)
        .map_err(|_| ApiError::Unauthorized("Invalid token".to_string()))?;

    // Validate expiration date is in the future
    let now = chrono::Utc::now();
    if payload.expires_at <= now {
        return Err(ApiError::ValidationError(
            "Expiration date must be in the future".to_string(),
        ));
    }

    // Generate API key
    let raw_api_key = generate_api_key();
    let api_key_id = Uuid::new_v4();
    let now_naive = utc_to_naive(now);

    let api_key = api_keys::ActiveModel {
        id: Set(api_key_id),
        user_id: Set(user_id),
        api_key: Set(raw_api_key.clone()),
        usage_limit: Set(payload.usage_limit.unwrap_or(1000)),
        used_count: Set(0),
        expires_at: Set(utc_to_naive(payload.expires_at)),
        status: Set(ApiKeyStatus::Active),
        created_at: Set(now_naive),
        updated_at: Set(now_naive),
    };

    let api_key = api_key.insert(&state.db).await?;

    let response = CreateApiKeyResponse {
        id: api_key.id,
        api_key: raw_api_key,
        usage_limit: api_key.usage_limit,
        used_count: api_key.used_count,
        expires_at: naive_to_utc(api_key.expires_at),
        status: format_status(&api_key.status),
        created_at: naive_to_utc(api_key.created_at),
    };

    Ok((
        StatusCode::CREATED,
        Json(CreateApiKeyApiResponse {
            success: true,
            data: response,
        }),
    ))
}

/// List all API keys for the authenticated user
#[utoipa::path(
    get,
    path = "/api/v1/api-keys",
    tag = "API Keys",
    responses(
        (status = 200, description = "List of API keys", body = ListApiKeysResponse),
        (status = 401, description = "Unauthorized")
    ),
    security(
        ("bearer_auth" = [])
    )
)]
pub async fn list_api_keys(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
) -> ApiResult<Json<ListApiKeysResponse>> {
    let user_id = Uuid::parse_str(&claims.sub)
        .map_err(|_| ApiError::Unauthorized("Invalid token".to_string()))?;

    let api_keys_list = ApiKeys::find()
        .filter(api_keys::Column::UserId.eq(user_id))
        .order_by_desc(api_keys::Column::CreatedAt)
        .all(&state.db)
        .await?;

    let data: Vec<ApiKeyResponse> = api_keys_list
        .into_iter()
        .map(|key| ApiKeyResponse {
            id: key.id,
            api_key_masked: mask_api_key(&key.api_key),
            usage_limit: key.usage_limit,
            used_count: key.used_count,
            expires_at: naive_to_utc(key.expires_at),
            status: format_status(&key.status),
            created_at: naive_to_utc(key.created_at),
            updated_at: naive_to_utc(key.updated_at),
        })
        .collect();

    Ok(Json(ListApiKeysResponse {
        success: true,
        data,
    }))
}

/// Get a specific API key by ID
#[utoipa::path(
    get,
    path = "/api/v1/api-keys/{id}",
    tag = "API Keys",
    params(
        ("id" = Uuid, Path, description = "API Key UUID")
    ),
    responses(
        (status = 200, description = "API key details", body = ApiKeyApiResponse),
        (status = 401, description = "Unauthorized"),
        (status = 404, description = "API key not found")
    ),
    security(
        ("bearer_auth" = [])
    )
)]
pub async fn get_api_key(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Path(id): Path<Uuid>,
) -> ApiResult<Json<ApiKeyApiResponse>> {
    let user_id = Uuid::parse_str(&claims.sub)
        .map_err(|_| ApiError::Unauthorized("Invalid token".to_string()))?;

    let api_key = ApiKeys::find_by_id(id)
        .filter(api_keys::Column::UserId.eq(user_id))
        .one(&state.db)
        .await?
        .ok_or_else(|| ApiError::NotFound("API key not found".to_string()))?;

    let response = ApiKeyResponse {
        id: api_key.id,
        api_key_masked: mask_api_key(&api_key.api_key),
        usage_limit: api_key.usage_limit,
        used_count: api_key.used_count,
        expires_at: naive_to_utc(api_key.expires_at),
        status: format_status(&api_key.status),
        created_at: naive_to_utc(api_key.created_at),
        updated_at: naive_to_utc(api_key.updated_at),
    };

    Ok(Json(ApiKeyApiResponse {
        success: true,
        data: response,
    }))
}

/// Revoke an API key
#[utoipa::path(
    delete,
    path = "/api/v1/api-keys/{id}",
    tag = "API Keys",
    params(
        ("id" = Uuid, Path, description = "API Key UUID")
    ),
    responses(
        (status = 200, description = "API key revoked successfully", body = RevokeApiKeyResponse),
        (status = 401, description = "Unauthorized"),
        (status = 404, description = "API key not found"),
        (status = 409, description = "API key already revoked")
    ),
    security(
        ("bearer_auth" = [])
    )
)]
pub async fn revoke_api_key(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Path(id): Path<Uuid>,
) -> ApiResult<Json<RevokeApiKeyResponse>> {
    let user_id = Uuid::parse_str(&claims.sub)
        .map_err(|_| ApiError::Unauthorized("Invalid token".to_string()))?;

    let api_key = ApiKeys::find_by_id(id)
        .filter(api_keys::Column::UserId.eq(user_id))
        .one(&state.db)
        .await?
        .ok_or_else(|| ApiError::NotFound("API key not found".to_string()))?;

    if api_key.status == ApiKeyStatus::Revoked {
        return Err(ApiError::Conflict("API key already revoked".to_string()));
    }

    let mut api_key: api_keys::ActiveModel = api_key.into();
    api_key.status = Set(ApiKeyStatus::Revoked);
    api_key.updated_at = Set(utc_to_naive(chrono::Utc::now()));
    api_key.update(&state.db).await?;

    Ok(Json(RevokeApiKeyResponse {
        success: true,
        message: "API key revoked successfully".to_string(),
    }))
}
