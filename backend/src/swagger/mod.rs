use axum::Router;
use utoipa::OpenApi;
use utoipa_swagger_ui::SwaggerUi;

#[derive(OpenApi)]
#[openapi(
    paths(
        // Authentication endpoints
        crate::handlers::auth::register,
        crate::handlers::auth::verify_email,
        crate::handlers::auth::login,
        crate::handlers::auth::refresh_token,
        crate::handlers::auth::logout,
        crate::handlers::auth::resend_verification_email,
        crate::handlers::auth::forgot_password,
        crate::handlers::auth::reset_password,
        // Meeting endpoints
        crate::handlers::meetings::list_meetings,
        crate::handlers::meetings::create_meeting,
        crate::handlers::meetings::get_meeting,
        crate::handlers::meetings::update_meeting,
        crate::handlers::meetings::delete_meeting,
        crate::handlers::meetings::join_meeting,
        crate::handlers::meetings::join_meeting_by_identifier,
        crate::handlers::meetings::end_meeting,
        // Participant endpoints
        crate::handlers::participants::list_participants,
        crate::handlers::participants::kick_participant,
        crate::handlers::participants::list_waiting_participants,
        crate::handlers::participants::admit_participant,
        crate::handlers::participants::deny_participant,
        crate::handlers::participants::update_audio,
        crate::handlers::participants::update_video,
        crate::handlers::participants::start_screen_share,
        crate::handlers::participants::stop_screen_share,
    ),
    components(
        schemas(
            // Auth schemas
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
            // Meeting schemas
            crate::dto::CreateMeetingRequest,
            crate::dto::UpdateMeetingRequest,
            crate::dto::JoinMeetingRequest,
            crate::dto::MeetingResponse,
            crate::dto::JoinMeetingResponse,
            crate::dto::EndMeetingResponse,
            crate::dto::MeetingApiResponse,
            crate::dto::JoinMeetingApiResponse,
            crate::dto::EndMeetingApiResponse,
            crate::dto::PaginatedMeetingResponse,
            crate::dto::MeetingPaginationMeta,
            // Participant schemas
            crate::dto::DetailedParticipantResponse,
            crate::dto::ParticipantsListResponse,
            crate::dto::ParticipantActionResponse,
            crate::dto::WaitingParticipantResponse,
            crate::dto::WaitingListResponse,
            crate::dto::UpdateAudioRequest,
            crate::dto::UpdateVideoRequest,
            crate::dto::MediaStateResponse,
            crate::dto::ScreenShareResponse,
        )
    ),
    modifiers(&SecurityAddon),
    tags(
        (name = "Authentication", description = "User authentication endpoints"),
        (name = "Meetings", description = "Meeting lifecycle management with LiveKit integration"),
        (name = "Participants", description = "Participant management (kick, list)"),
        (name = "Waiting Room", description = "Admit/Deny participants from waiting room"),
        (name = "Media Control", description = "Control audio, video, and screen sharing")
    ),
    info(
        title = "CosmicForge RTC API",
        version = "1.0.0",
        description = "Real-Time Communication API for video conferencing with LiveKit integration",
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

struct SecurityAddon;

impl utoipa::Modify for SecurityAddon {
    fn modify(&self, openapi: &mut utoipa::openapi::OpenApi) {
        if let Some(components) = openapi.components.as_mut() {
            components.add_security_scheme(
                "bearer_auth",
                utoipa::openapi::security::SecurityScheme::Http(
                    utoipa::openapi::security::Http::new(
                        utoipa::openapi::security::HttpAuthScheme::Bearer,
                    ),
                ),
            );
        }
    }
}

pub fn swagger_router() -> Router {
    SwaggerUi::new("/swagger-ui")
        .url("/api-docs/openapi.json", ApiDoc::openapi())
        .into()
}
