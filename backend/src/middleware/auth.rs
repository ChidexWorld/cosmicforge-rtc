use crate::{
    error::{ApiError, ApiResult},
    models::users::{self, UserRole, UserStatus},
    state::AppState,
};
use axum::{
    extract::{Request, State},
    http::header::AUTHORIZATION,
    middleware::Next,
    response::Response,
};
use sea_orm::EntityTrait;
use uuid::Uuid;

/// Authentication context extracted from JWT and validated against database
#[derive(Debug, Clone)]
pub struct AuthContext {
    pub user_id: Uuid,
    pub role: UserRole,
    pub status: UserStatus,
}

pub async fn auth_middleware(
    State(state): State<AppState>,
    mut request: Request,
    next: Next,
) -> ApiResult<Response> {
    let auth_header = request
        .headers()
        .get(AUTHORIZATION)
        .and_then(|h| h.to_str().ok())
        .ok_or_else(|| ApiError::Unauthorized("Missing authorization header".to_string()))?;

    let token = auth_header
        .strip_prefix("Bearer ")
        .ok_or_else(|| ApiError::Unauthorized("Invalid authorization format".to_string()))?;

    let claims = state.jwt_service.verify_token(token)?;

    // Parse user ID from claims
    let user_id = Uuid::parse_str(&claims.sub).map_err(|_| {
        ApiError::Unauthorized("Invalid user identifier in token".to_string())
    })?;

    // Query user from database
    let user = users::Entity::find_by_id(user_id)
        .one(&state.db)
        .await?
        .ok_or_else(|| ApiError::Unauthorized("User not found".to_string()))?;

    // Check if user account is active
    if user.status == UserStatus::Inactive {
        return Err(ApiError::Forbidden(
            "Account has been deactivated".to_string(),
        ));
    }

    // Create auth context
    let auth_context = AuthContext {
        user_id: user.id,
        role: user.role.clone(),
        status: user.status.clone(),
    };

    // Add both claims (for backward compatibility) and auth context to request extensions
    request.extensions_mut().insert(claims);
    request.extensions_mut().insert(auth_context);

    Ok(next.run(request).await)
}
