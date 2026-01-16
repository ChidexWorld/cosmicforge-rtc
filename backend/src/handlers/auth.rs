use axum::{
    extract::State,
    http::StatusCode,
    Json,
};
use sea_orm::{ActiveModelTrait, ColumnTrait, EntityTrait, QueryFilter, Set};
use uuid::Uuid;
use validator::Validate;

use crate::{
    services::auth::{generate_verification_token, hash_password, verify_password},
    dto::*,
    error::{ApiError, ApiResult},
    models::{
        users::{self, Entity as Users},
    },
    state::AppState,
};

/// Register a new user
#[utoipa::path(
    post,
    path = "/api/v1/auth/register",
    tag = "Authentication",
    request_body = RegisterRequest,
    responses(
        (status = 201, description = "User registered successfully", body = RegisterResponse),
        (status = 400, description = "Validation error"),
        (status = 409, description = "User already exists"),
    )
)]
pub async fn register(
    State(state): State<AppState>,
    Json(payload): Json<RegisterRequest>,
) -> ApiResult<(StatusCode, Json<RegisterResponse>)> {
    // Validate request
    payload.validate()
        .map_err(|e| ApiError::ValidationError(e.to_string()))?;

    // Check if user already exists
    let existing_user = Users::find()
        .filter(users::Column::Email.eq(&payload.email))
        .one(&state.db)
        .await?;

    if existing_user.is_some() {
        return Err(ApiError::Conflict("A user with this email already exists".to_string()));
    }

    // Hash password
    let password_hash = hash_password(&payload.password)?;

    // Generate verification token
    let verification_token = generate_verification_token();
    let token_expires_at = chrono::Utc::now().naive_utc() + chrono::Duration::hours(24);

    // Create user
    let user = users::ActiveModel {
        id: Set(Uuid::new_v4()),
        username: Set(payload.username),
        email: Set(payload.email.clone()),
        password_hash: Set(Some(password_hash)),
        auth_type: Set(users::AuthType::Local),
        role: Set(users::UserRole::User),
        status: Set(users::UserStatus::PendingVerification),
        verification_token: Set(Some(verification_token.clone())),
        token_expires_at: Set(Some(token_expires_at)),
        created_at: Set(chrono::Utc::now().naive_utc()),
        updated_at: Set(chrono::Utc::now().naive_utc()),
        last_login: Set(None),
    };

    let user = user.insert(&state.db).await?;

    // TODO: Send verification email
    tracing::info!("Verification token for {}: {}", user.email, verification_token);

    let response = RegisterResponse {
        user_id: user.id,
        email: user.email,
        role: format!("{:?}", user.role).to_lowercase(),
        status: format!("{:?}", user.status).to_lowercase().replace('_', "_"),
    };

    Ok((StatusCode::CREATED, Json(response)))
}

/// Verify email with token
#[utoipa::path(
    post,
    path = "/api/v1/auth/verify-email",
    tag = "Authentication",
    request_body = VerifyEmailRequest,
    responses(
        (status = 200, description = "Email verified successfully", body = MessageResponse),
        (status = 400, description = "Invalid or expired token"),
    )
)]
pub async fn verify_email(
    State(state): State<AppState>,
    Json(payload): Json<VerifyEmailRequest>,
) -> ApiResult<Json<MessageResponse>> {
    // Find user with verification token
    let user = Users::find()
        .filter(users::Column::VerificationToken.eq(&payload.token))
        .one(&state.db)
        .await?
        .ok_or_else(|| ApiError::BadRequest("Invalid or expired verification token".to_string()))?;

    // Check if token is expired
    if let Some(expires_at) = user.token_expires_at {
        if expires_at < chrono::Utc::now().naive_utc() {
            return Err(ApiError::BadRequest("Verification token has expired".to_string()));
        }
    }

    // Update user status
    let mut user: users::ActiveModel = user.into();
    user.status = Set(users::UserStatus::Active);
    user.verification_token = Set(None);
    user.token_expires_at = Set(None);
    user.updated_at = Set(chrono::Utc::now().naive_utc());
    
    user.update(&state.db).await?;

    Ok(Json(MessageResponse {
        message: "Email verified successfully".to_string(),
    }))
}

/// Login user
#[utoipa::path(
    post,
    path = "/api/v1/auth/login",
    tag = "Authentication",
    request_body = LoginRequest,
    responses(
        (status = 200, description = "Login successful", body = LoginResponse),
        (status = 401, description = "Invalid credentials"),
        (status = 403, description = "Account not verified"),
    )
)]
pub async fn login(
    State(state): State<AppState>,
    Json(payload): Json<LoginRequest>,
) -> ApiResult<Json<LoginResponse>> {
    // Validate request
    payload.validate()
        .map_err(|e| ApiError::ValidationError(e.to_string()))?;

    // Find user by email
    let user = Users::find()
        .filter(users::Column::Email.eq(&payload.email))
        .one(&state.db)
        .await?
        .ok_or_else(|| ApiError::Unauthorized("Invalid email or password".to_string()))?;

    // Verify password
    let password_hash = user.password_hash
        .as_ref()
        .ok_or_else(|| ApiError::Unauthorized("Invalid email or password".to_string()))?;

    let is_valid = verify_password(&payload.password, password_hash)?;
    if !is_valid {
        return Err(ApiError::Unauthorized("Invalid email or password".to_string()));
    }

    // Check if user is verified
    if user.status == users::UserStatus::PendingVerification {
        return Err(ApiError::Forbidden("Please verify your email before logging in".to_string()));
    }

    // Check if user is active
    if user.status != users::UserStatus::Active {
        return Err(ApiError::Forbidden("Account is inactive".to_string()));
    }

    // Generate tokens
    let role_str = format!("{:?}", user.role).to_lowercase();
    let access_token = state.jwt_service.generate_access_token(
        user.id,
        &role_str,
    )?;
    let refresh_token = state.jwt_service.generate_refresh_token(
        user.id,
        &role_str,
    )?;

    // Update last login
    let mut user_active: users::ActiveModel = user.clone().into();
    user_active.last_login = Set(Some(chrono::Utc::now().naive_utc()));
    user_active.update(&state.db).await?;

    let response = LoginResponse {
        access_token,
        refresh_token,
        user: UserInfo {
            id: user.id,
            username: user.username,
            role: role_str,
        },
    };

    Ok(Json(response))
}

/// Refresh access token
#[utoipa::path(
    post,
    path = "/api/v1/auth/refresh",
    tag = "Authentication",
    request_body = RefreshTokenRequest,
    responses(
        (status = 200, description = "Token refreshed successfully", body = RefreshTokenResponse),
        (status = 401, description = "Invalid refresh token"),
    )
)]
pub async fn refresh_token(
    State(state): State<AppState>,
    Json(payload): Json<RefreshTokenRequest>,
) -> ApiResult<Json<RefreshTokenResponse>> {
    // Verify refresh token
    let claims = state.jwt_service.verify_token(&payload.refresh_token)?;

    // Generate new tokens
    let user_id = Uuid::parse_str(&claims.sub)
        .map_err(|_| ApiError::Unauthorized("Invalid token".to_string()))?;

    let access_token = state.jwt_service.generate_access_token(
        user_id,
        &claims.role,
    )?;
    let refresh_token = state.jwt_service.generate_refresh_token(
        user_id,
        &claims.role,
    )?;

    Ok(Json(RefreshTokenResponse {
        access_token,
        refresh_token,
    }))
}

/// Logout user
#[utoipa::path(
    post,
    path = "/api/v1/auth/logout",
    tag = "Authentication",
    responses(
        (status = 200, description = "Logout successful", body = MessageResponse),
    )
)]
pub async fn logout() -> ApiResult<Json<MessageResponse>> {
    // In a real implementation, you would:
    // 1. Add token to blacklist
    // 2. Remove from Redis/cache
    // For now, just return success
    Ok(Json(MessageResponse {
        message: "Logged out successfully".to_string(),
    }))
}
