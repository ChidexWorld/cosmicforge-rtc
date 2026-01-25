use axum::{extract::State, http::StatusCode, Json};
use sea_orm::{ActiveModelTrait, ColumnTrait, EntityTrait, QueryFilter, Set};
use uuid::Uuid;
use validator::Validate;

use crate::{
    dto::*,
    error::{ApiError, ApiResult},
    models::users::{self, Entity as Users},
    services::auth::{generate_verification_code, hash_password, verify_password},
    state::AppState,
    utils::now_naive,
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
    payload
        .validate()
        .map_err(|e| ApiError::ValidationError(e.to_string()))?;

    // Check if user already exists
    let existing_user = Users::find()
        .filter(users::Column::Email.eq(&payload.email))
        .one(&state.db)
        .await?;

    if existing_user.is_some() {
        return Err(ApiError::Conflict(
            "A user with this email already exists".to_string(),
        ));
    }

    // Hash password
    let password_hash = hash_password(&payload.password)?;

    // Generate verification token
    let verification_token = generate_verification_code();
    let token_expires_at = now_naive() + chrono::Duration::hours(24);

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
        created_at: Set(now_naive()),
        updated_at: Set(now_naive()),
        last_login: Set(None),
        reset_token: Set(None),
        reset_token_expires_at: Set(None),
    };

    let user = user.insert(&state.db).await?;

    // Queue verification email
    match state
        .email_service
        .send_verification_email(&user.email, &user.username, &verification_token)
        .await
    {
        Ok(job_id) => {
            tracing::info!(
                "Verification email queued for {}: job_id={}",
                user.email,
                job_id
            );
        }
        Err(e) => {
            tracing::error!(
                "Failed to queue verification email for {}: {}",
                user.email,
                e
            );
            // Don't fail registration if email queueing fails - user can request resend
        }
    }

    let response = RegisterResponse {
        user_id: user.id,
        email: user.email,
        role: format!("{:?}", user.role).to_lowercase(),
        status: format!("{:?}", user.status)
            .to_lowercase()
            .replace('_', "_"),
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
    // Validate request
    payload
        .validate()
        .map_err(|e| ApiError::ValidationError(e.to_string()))?;

    // Find user with verification token
    let user = Users::find()
        .filter(users::Column::VerificationToken.eq(&payload.token))
        .one(&state.db)
        .await?
        .ok_or_else(|| ApiError::BadRequest("Invalid or expired verification token".to_string()))?;

    // Check if token is expired
    if let Some(expires_at) = user.token_expires_at {
        if expires_at < now_naive() {
            return Err(ApiError::BadRequest(
                "Verification token has expired".to_string(),
            ));
        }
    }

    // Update user status
    let mut user: users::ActiveModel = user.into();
    user.status = Set(users::UserStatus::Active);
    user.verification_token = Set(None);
    user.token_expires_at = Set(None);
    user.updated_at = Set(now_naive());

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
    payload
        .validate()
        .map_err(|e| ApiError::ValidationError(e.to_string()))?;

    // Find user by email
    let user = Users::find()
        .filter(users::Column::Email.eq(&payload.email))
        .one(&state.db)
        .await?
        .ok_or_else(|| ApiError::Unauthorized("Invalid email or password".to_string()))?;

    // Verify password
    let password_hash = user
        .password_hash
        .as_ref()
        .ok_or_else(|| ApiError::Unauthorized("Invalid email or password".to_string()))?;

    let is_valid = verify_password(&payload.password, password_hash)?;
    if !is_valid {
        return Err(ApiError::Unauthorized(
            "Invalid email or password".to_string(),
        ));
    }

    // Check if user is verified
    if user.status == users::UserStatus::PendingVerification {
        return Err(ApiError::Forbidden(
            "Please verify your email before logging in".to_string(),
        ));
    }

    // Check if user is active
    if user.status != users::UserStatus::Active {
        return Err(ApiError::Forbidden("Account is inactive".to_string()));
    }

    // Generate tokens
    let role_str = format!("{:?}", user.role).to_lowercase();
    let access_token = state
        .jwt_service
        .generate_access_token(user.id, &role_str)?;
    let refresh_token = state
        .jwt_service
        .generate_refresh_token(user.id, &role_str)?;

    // Update last login
    let mut user_active: users::ActiveModel = user.clone().into();
    user_active.last_login = Set(Some(now_naive()));
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
    // Validate request
    payload
        .validate()
        .map_err(|e| ApiError::ValidationError(e.to_string()))?;

    // Verify refresh token
    let claims = state.jwt_service.verify_token(&payload.refresh_token)?;

    // Generate new tokens
    let user_id = Uuid::parse_str(&claims.sub)
        .map_err(|_| ApiError::Unauthorized("Invalid token".to_string()))?;

    let access_token = state
        .jwt_service
        .generate_access_token(user_id, &claims.role)?;
    let refresh_token = state
        .jwt_service
        .generate_refresh_token(user_id, &claims.role)?;

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

/// Resend verification email
#[utoipa::path(
    post,
    path = "/api/v1/auth/resend-verification",
    tag = "Authentication",
    request_body = ResendVerificationRequest,
    responses(
        (status = 200, description = "Verification email sent", body = MessageResponse),
        (status = 400, description = "Validation error"),
        (status = 404, description = "User not found"),
    )
)]
pub async fn resend_verification_email(
    State(state): State<AppState>,
    Json(payload): Json<ResendVerificationRequest>,
) -> ApiResult<Json<MessageResponse>> {
    payload
        .validate()
        .map_err(|e| ApiError::ValidationError(e.to_string()))?;

    let user = Users::find()
        .filter(users::Column::Email.eq(&payload.email))
        .one(&state.db)
        .await?
        .ok_or_else(|| ApiError::NotFound("User not found".to_string()))?;

    if user.status == users::UserStatus::Active {
        return Err(ApiError::BadRequest("User is already verified".to_string()));
    }

    // Generate new token
    let verification_token = generate_verification_code();
    let token_expires_at = now_naive() + chrono::Duration::hours(24);

    let mut active_user: users::ActiveModel = user.clone().into();
    active_user.verification_token = Set(Some(verification_token.clone()));
    active_user.token_expires_at = Set(Some(token_expires_at));
    active_user.update(&state.db).await?;

    // Send email
    if let Err(e) = state
        .email_service
        .send_verification_email(&payload.email, &user.username, &verification_token)
        .await
    {
        tracing::error!("Failed to resend verification email: {}", e);
    }

    Ok(Json(MessageResponse {
        message: "Verification email sent".to_string(),
    }))
}

/// Request password reset
#[utoipa::path(
    post,
    path = "/api/v1/auth/forgot-password",
    tag = "Authentication",
    request_body = ForgotPasswordRequest,
    responses(
        (status = 200, description = "Password reset code sent", body = MessageResponse),
        (status = 400, description = "Validation error"),
        (status = 404, description = "User not found"),
    )
)]
pub async fn forgot_password(
    State(state): State<AppState>,
    Json(payload): Json<ForgotPasswordRequest>,
) -> ApiResult<Json<MessageResponse>> {
    payload
        .validate()
        .map_err(|e| ApiError::ValidationError(e.to_string()))?;

    // Find user
    let user = Users::find()
        .filter(users::Column::Email.eq(&payload.email))
        .one(&state.db)
        .await?
        .ok_or_else(|| {
            ApiError::NotFound("No account found with this email address".to_string())
        })?;

    // Only allow local auth users to reset password
    if user.auth_type != users::AuthType::Local {
        return Err(ApiError::BadRequest(
            "This account uses Google sign-in. Please use Google to access your account."
                .to_string(),
        ));
    }

    // Generate 6-digit reset code
    let reset_code = generate_verification_code();
    let expires_at = now_naive() + chrono::Duration::hours(1);

    let mut active_user: users::ActiveModel = user.clone().into();
    active_user.reset_token = Set(Some(reset_code.clone()));
    active_user.reset_token_expires_at = Set(Some(expires_at));
    active_user.updated_at = Set(now_naive());
    active_user.update(&state.db).await?;

    // Queue reset email
    match state
        .email_service
        .send_password_reset_email(&user.email, &user.username, &reset_code)
        .await
    {
        Ok(job_id) => {
            tracing::info!(
                "Password reset email queued for {}: job_id={}",
                user.email,
                job_id
            );
        }
        Err(e) => {
            tracing::error!(
                "Failed to queue password reset email for {}: {}",
                user.email,
                e
            );
        }
    }

    Ok(Json(MessageResponse {
        message: "Password reset code sent to your email".to_string(),
    }))
}

/// Reset password with token
#[utoipa::path(
    post,
    path = "/api/v1/auth/reset-password",
    tag = "Authentication",
    request_body = ResetPasswordRequest,
    responses(
        (status = 200, description = "Password reset successfully", body = MessageResponse),
        (status = 400, description = "Invalid or expired token"),
    )
)]
pub async fn reset_password(
    State(state): State<AppState>,
    Json(payload): Json<ResetPasswordRequest>,
) -> ApiResult<Json<MessageResponse>> {
    payload
        .validate()
        .map_err(|e| ApiError::ValidationError(e.to_string()))?;

    let user = Users::find()
        .filter(users::Column::ResetToken.eq(&payload.token))
        .one(&state.db)
        .await?
        .ok_or_else(|| ApiError::BadRequest("Invalid or expired reset token".to_string()))?;

    // Verify email matches the user
    if user.email != payload.email {
        return Err(ApiError::BadRequest(
            "Invalid email or reset token".to_string(),
        ));
    }

    if let Some(expires_at) = user.reset_token_expires_at {
        if expires_at < now_naive() {
            return Err(ApiError::BadRequest("Reset token has expired".to_string()));
        }
    } else {
        return Err(ApiError::BadRequest("Invalid reset token".to_string()));
    }

    let password_hash = hash_password(&payload.new_password)?;

    let mut user: users::ActiveModel = user.into();
    user.password_hash = Set(Some(password_hash));
    user.reset_token = Set(None);
    user.reset_token_expires_at = Set(None);
    user.updated_at = Set(now_naive());

    user.update(&state.db).await?;

    Ok(Json(MessageResponse {
        message: "Password reset successfully".to_string(),
    }))
}
