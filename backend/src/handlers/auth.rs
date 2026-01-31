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

    // Check if username is already taken
    let existing_username = Users::find()
        .filter(users::Column::Username.eq(&payload.username))
        .one(&state.db)
        .await?;

    if existing_username.is_some() {
        return Err(ApiError::Conflict(
            "Username has already been used".to_string(),
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
        (status = 403, description = "Email verification required or account inactive"),
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

    // Only block inactive users, allow pending verification users to login
    // Frontend will handle redirect to verify page based on status
    if user.status == users::UserStatus::Inactive {
        return Err(ApiError::Forbidden("Account has been deactivated".to_string()));
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
            status: format!("{:?}", user.status).to_lowercase().replace('_', "_"),
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

/// Verify password reset token
#[utoipa::path(
    post,
    path = "/api/v1/auth/verify-reset-token",
    tag = "Authentication",
    request_body = VerifyResetTokenRequest,
    responses(
        (status = 200, description = "Token is valid", body = VerifyResetTokenResponse),
        (status = 400, description = "Invalid or expired token"),
        (status = 404, description = "User not found"),
    )
)]
pub async fn verify_reset_token(
    State(state): State<AppState>,
    Json(payload): Json<VerifyResetTokenRequest>,
) -> ApiResult<Json<VerifyResetTokenResponse>> {
    payload
        .validate()
        .map_err(|e| ApiError::ValidationError(e.to_string()))?;

    // Find user by email
    let user = Users::find()
        .filter(users::Column::Email.eq(&payload.email))
        .one(&state.db)
        .await?
        .ok_or_else(|| ApiError::NotFound("User not found".to_string()))?;

    // Check if user has a reset token
    let reset_token = user.reset_token.as_ref()
        .ok_or_else(|| ApiError::BadRequest("No password reset request found".to_string()))?;

    // Verify token matches
    if reset_token != &payload.token {
        return Err(ApiError::BadRequest("Invalid reset token".to_string()));
    }

    // Check if token is expired
    if let Some(expires_at) = user.reset_token_expires_at {
        if expires_at < now_naive() {
            return Err(ApiError::BadRequest("Reset token has expired".to_string()));
        }
    } else {
        return Err(ApiError::BadRequest("Invalid reset token".to_string()));
    }

    Ok(Json(VerifyResetTokenResponse {
        message: "Token verified successfully".to_string(),
        valid: true,
    }))
}


// ============================================================================
// Google OAuth Handlers
// ============================================================================

use axum::response::Redirect;
use rand::Rng;

/// Initiate Google OAuth flow
///
/// Generates a secure state token, stores it in the database, and redirects
/// the user to Google's OAuth consent page.
#[utoipa::path(
    get,
    path = "/api/v1/auth/oauth/google",
    tag = "Authentication",
    responses(
        (status = 302, description = "Redirect to Google OAuth consent page"),
        (status = 500, description = "Internal server error"),
    )
)]
pub async fn oauth_google_init(
    State(state): State<AppState>,
) -> ApiResult<Redirect> {
    // Generate cryptographically secure random state (32 bytes, hex encoded)
    let state_value: String = rand::thread_rng()
        .sample_iter(&rand::distributions::Alphanumeric)
        .take(32)
        .map(char::from)
        .collect();

    // Store state in database with 10-minute expiry
    let expires_at = chrono::Utc::now().naive_utc() + chrono::Duration::minutes(10);
    
    use crate::models::oauth_states;
    let oauth_state = oauth_states::ActiveModel {
        id: Set(Uuid::new_v4()),
        state: Set(state_value.clone()),
        provider: Set("google".to_string()),
        created_at: Set(chrono::Utc::now().naive_utc()),
        expires_at: Set(expires_at),
    };
    
    oauth_state.insert(&state.db).await?;

    // Build Google OAuth URL using config
    let auth_url = format!(
        "https://accounts.google.com/o/oauth2/v2/auth?client_id={}&redirect_uri={}&response_type=code&scope=openid%20email%20profile&state={}&access_type=offline&prompt=consent",
        urlencoding::encode(&state.google_client_id),
        urlencoding::encode(&state.google_redirect_url),
        urlencoding::encode(&state_value)
    );

    Ok(Redirect::to(&auth_url))
}

/// Google OAuth callback handler
///
/// Validates the state token, exchanges the authorization code for tokens,
/// verifies the ID token, and creates/authenticates the user.
#[utoipa::path(
    get,
    path = "/api/v1/auth/oauth/google/callback",
    tag = "Authentication",
    params(
        ("code" = String, Query, description = "Authorization code from Google"),
        ("state" = String, Query, description = "State token for CSRF protection"),
    ),
    responses(
        (status = 200, description = "Login successful", body = LoginResponse),
        (status = 400, description = "Invalid state or code"),
        (status = 401, description = "Authentication failed"),
        (status = 403, description = "Email verification required or account deactivated"),
    )
)]
pub async fn oauth_google_callback(
    State(state): State<AppState>,
    axum::extract::Query(params): axum::extract::Query<std::collections::HashMap<String, String>>,
) -> Result<Redirect, Redirect> {
    let frontend_url = &state.app_url;

    // Helper to build error redirect
    let error_redirect = |msg: &str| -> Redirect {
        Redirect::to(&format!(
            "{}/google/callback?error={}",
            frontend_url,
            urlencoding::encode(msg)
        ))
    };

    // Extract code and state from query params
    let code = match params.get("code") {
        Some(c) => c,
        None => return Err(error_redirect("Missing authorization code")),
    };
    let state_value = match params.get("state") {
        Some(s) => s,
        None => return Err(error_redirect("Missing state parameter")),
    };

    // Handle error parameter if present
    if let Some(error) = params.get("error") {
        return Err(error_redirect(&format!("OAuth error: {}", error)));
    }

    // Run the async OAuth logic, mapping any ApiError to a redirect
    let result = oauth_google_callback_inner(&state, code, state_value).await;

    match result {
        Ok((access_token, refresh_token, user_id, username, role, status)) => {
            let redirect_url = format!(
                "{}/google/callback?access_token={}&refresh_token={}&user_id={}&username={}&role={}&status={}",
                frontend_url,
                urlencoding::encode(&access_token),
                urlencoding::encode(&refresh_token),
                urlencoding::encode(&user_id),
                urlencoding::encode(&username),
                urlencoding::encode(&role),
                urlencoding::encode(&status),
            );
            Ok(Redirect::to(&redirect_url))
        }
        Err(e) => Err(error_redirect(&e.to_string())),
    }
}

/// Inner logic for Google OAuth callback, returns tokens + user info or an ApiError
async fn oauth_google_callback_inner(
    state: &AppState,
    code: &str,
    state_value: &str,
) -> ApiResult<(String, String, String, String, String, String)> {
    // Validate state (must exist and not be expired)
    use crate::models::oauth_states::{self, Entity as OauthStates};

    let oauth_state = OauthStates::find()
        .filter(oauth_states::Column::State.eq(state_value))
        .one(&state.db)
        .await?
        .ok_or_else(|| ApiError::BadRequest("Invalid or expired state".to_string()))?;

    // Check if state has expired
    if oauth_state.expires_at < chrono::Utc::now().naive_utc() {
        OauthStates::delete_by_id(oauth_state.id)
            .exec(&state.db)
            .await?;
        return Err(ApiError::BadRequest("State has expired".to_string()));
    }

    // Delete state (single-use)
    OauthStates::delete_by_id(oauth_state.id)
        .exec(&state.db)
        .await?;

    // Exchange code for tokens
    let token_url = "https://oauth2.googleapis.com/token";
    let client = reqwest::Client::new();

    let token_response = client
        .post(token_url)
        .form(&[
            ("code", code),
            ("client_id", state.google_client_id.as_str()),
            ("client_secret", state.google_client_secret.as_str()),
            ("redirect_uri", state.google_redirect_url.as_str()),
            ("grant_type", "authorization_code"),
        ])
        .send()
        .await
        .map_err(|e| ApiError::InternalError(format!("Token exchange failed: {}", e)))?;

    if !token_response.status().is_success() {
        let error_text = token_response.text().await.unwrap_or_else(|_| "Unknown error".to_string());
        return Err(ApiError::InternalError(format!("Token exchange failed: {}", error_text)));
    }

    let token_data: serde_json::Value = token_response
        .json()
        .await
        .map_err(|e| ApiError::InternalError(format!("Failed to parse token response: {}", e)))?;

    let id_token = token_data["id_token"].as_str()
        .ok_or_else(|| ApiError::InternalError("No ID token in response".to_string()))?;

    // Decode ID token (basic decoding without signature verification for now)
    let token_parts: Vec<&str> = id_token.split('.').collect();
    if token_parts.len() != 3 {
        return Err(ApiError::InternalError("Invalid ID token format".to_string()));
    }

    use base64::{Engine as _, engine::general_purpose};
    let payload = general_purpose::URL_SAFE_NO_PAD.decode(token_parts[1])
        .map_err(|e| ApiError::InternalError(format!("Failed to decode ID token: {}", e)))?;

    let claims: serde_json::Value = serde_json::from_slice(&payload)
        .map_err(|e| ApiError::InternalError(format!("Failed to parse ID token claims: {}", e)))?;

    // Extract user info from claims
    let email = claims["email"].as_str()
        .ok_or_else(|| ApiError::InternalError("No email in ID token".to_string()))?
        .to_string();
    let name = claims["name"].as_str().unwrap_or("Google User").to_string();
    let _google_sub = claims["sub"].as_str()
        .ok_or_else(|| ApiError::InternalError("No sub in ID token".to_string()))?
        .to_string();

    // Verify issuer
    let iss = claims["iss"].as_str().unwrap_or("");
    if iss != "https://accounts.google.com" && iss != "accounts.google.com" {
        return Err(ApiError::Unauthorized("Invalid issuer".to_string()));
    }

    // Find or create user
    let existing_user = Users::find()
        .filter(users::Column::Email.eq(&email))
        .one(&state.db)
        .await?;

    let user = if let Some(mut user) = existing_user {
        if user.status == users::UserStatus::Inactive {
            return Err(ApiError::Forbidden("Account has been deactivated".to_string()));
        }

        if user.status == users::UserStatus::PendingVerification {
            let mut user_active: users::ActiveModel = user.clone().into();
            user_active.status = Set(users::UserStatus::Active);
            user_active.updated_at = Set(chrono::Utc::now().naive_utc());
            user = user_active.update(&state.db).await?;
        }

        user
    } else {
        let new_user = users::ActiveModel {
            id: Set(Uuid::new_v4()),
            username: Set(name.clone()),
            email: Set(email.clone()),
            password_hash: Set(None),
            auth_type: Set(users::AuthType::Google),
            role: Set(users::UserRole::User),
            status: Set(users::UserStatus::Active),
            verification_token: Set(None),
            token_expires_at: Set(None),
            reset_token: Set(None),
            reset_token_expires_at: Set(None),
            created_at: Set(chrono::Utc::now().naive_utc()),
            updated_at: Set(chrono::Utc::now().naive_utc()),
            last_login: Set(Some(chrono::Utc::now().naive_utc())),
        };

        new_user.insert(&state.db).await?
    };

    // Update last login
    let mut user_active: users::ActiveModel = user.clone().into();
    user_active.last_login = Set(Some(chrono::Utc::now().naive_utc()));
    user_active.update(&state.db).await?;

    // Generate JWT tokens
    let role_str = format!("{:?}", user.role).to_lowercase();
    let status_str = format!("{:?}", user.status).to_lowercase().replace('_', "_");
    let access_token = state
        .jwt_service
        .generate_access_token(user.id, &role_str)?;
    let refresh_token = state
        .jwt_service
        .generate_refresh_token(user.id, &role_str)?;

    Ok((
        access_token,
        refresh_token,
        user.id.to_string(),
        user.username,
        role_str,
        status_str,
    ))
}
