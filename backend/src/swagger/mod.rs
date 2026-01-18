use utoipa::OpenApi;
use utoipa_swagger_ui::SwaggerUi;
use axum::Router;

#[derive(OpenApi)]
#[openapi(
    paths(
        crate::handlers::auth::register,
        crate::handlers::auth::verify_email,
        crate::handlers::auth::login,
        crate::handlers::auth::refresh_token,
        crate::handlers::auth::logout,
        crate::handlers::auth::resend_verification_email,
        crate::handlers::auth::forgot_password,
        crate::handlers::auth::reset_password,
    ),
    components(
        schemas(
            crate::dto::RegisterRequest,
            crate::dto::RegisterResponse,
            crate::dto::LoginRequest,
            crate::dto::LoginResponse,
            crate::dto::UserInfo,
            crate::dto::VerifyEmailRequest,
            crate::dto::RefreshTokenRequest,
            crate::dto::RefreshTokenResponse,
            crate::dto::MessageResponse,
            crate::dto::ResendVerificationRequest,
            crate::dto::ForgotPasswordRequest,
            crate::dto::ResetPasswordRequest,
        )
    ),
    tags(
        (name = "Authentication", description = "User authentication endpoints")
    ),
    info(
        title = "CosmicForge RTC API",
        version = "1.0.0",
        description = "Real-Time Communication API for video conferencing",
        contact(
            name = "CosmicForge Team",
            email = "support@cosmicforge.com"
        )
    ),
    servers(
        (url = "http://127.0.0.1:8080", description = "Development server"),
        (url = "https://api.cosmicforge.com", description = "Production server")
    )
)]
pub struct ApiDoc;

pub fn swagger_router() -> Router {
    SwaggerUi::new("/swagger-ui")
        .url("/api-docs/openapi.json", ApiDoc::openapi())
        .into()
}
