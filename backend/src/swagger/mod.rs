use axum::Router;
use utoipa::OpenApi;
use utoipa_swagger_ui::SwaggerUi;

#[derive(OpenApi)]
#[openapi(
    paths(
        // General endpoints
        crate::handlers::root::get_app_info,
        crate::handlers::root::health_check,
        // Authentication endpoints
        crate::handlers::auth::register,
        crate::handlers::auth::verify_email,
        crate::handlers::auth::login,
        crate::handlers::auth::refresh_token,
        crate::handlers::auth::logout,
        crate::handlers::auth::resend_verification_email,
        crate::handlers::auth::forgot_password,
        crate::handlers::auth::reset_password,
        // OAuth endpoints
        crate::handlers::auth::oauth_google_init,
        crate::handlers::auth::oauth_google_callback,
        // API Key endpoints
        crate::handlers::api_keys::create_api_key,
        crate::handlers::api_keys::list_api_keys,
        crate::handlers::api_keys::get_api_key,
        crate::handlers::api_keys::revoke_api_key,
        // API (third-party) endpoints
        crate::handlers::meetings::api_create_meeting,
        crate::handlers::meetings::api_join_meeting,
        // Meeting endpoints
        crate::handlers::meetings::list_meetings,
        crate::handlers::meetings::create_meeting,
        crate::handlers::meetings::get_meeting,
        crate::handlers::meetings::update_meeting,
        crate::handlers::meetings::delete_meeting,
        crate::handlers::meetings::join_meeting,
        crate::handlers::meetings::join_meeting_by_identifier,
        crate::handlers::meetings::end_meeting,
        crate::handlers::meetings::get_public_meeting_info,
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
        // Chat endpoints
        crate::handlers::chat::send_message,
        crate::handlers::chat::get_messages,
        // User endpoints
        crate::handlers::users::get_current_user,
        crate::handlers::users::update_current_user,
        crate::handlers::users::deactivate_account,
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
            // API Key schemas
            crate::dto::CreateApiKeyRequest,
            crate::dto::CreateApiKeyResponse,
            crate::dto::CreateApiKeyApiResponse,
            crate::dto::ApiKeyResponse,
            crate::dto::ApiKeyApiResponse,
            crate::dto::ListApiKeysResponse,
            crate::dto::RevokeApiKeyResponse,
            // API (third-party) schemas
            crate::handlers::meetings::ApiCreateMeetingRequest,
            crate::handlers::meetings::ApiJoinMeetingRequest,
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
            crate::dto::PublicMeetingInfoResponse,
            crate::dto::PublicMeetingInfoApiResponse,
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
            // Chat schemas
            crate::dto::SendChatMessageRequest,
            crate::dto::ChatMessageResponse,
            crate::dto::SendChatMessageApiResponse,
            crate::dto::ChatMessagesListResponse,
            // User schemas
            crate::dto::UserMeResponse,
            crate::dto::UpdateMeRequest,
        )
    ),
    modifiers(&SecurityAddon),
    tags(
        (name = "General", description = "Application information and health endpoints"),
        (name = "Authentication", description = "User authentication endpoints"),
        (name = "API Keys", description = "API key management for third-party integrations.\n\n## Usage\n- Create API keys via authenticated endpoints\n- Use `Api-Key: <key>` header for authentication\n- API keys have usage limits and expiration dates\n- Keys can be revoked at any time\n\n## Notes\n- Full API key is only shown on creation\n- Third-party devs cannot access internal media servers directly\n- Short-lived join tokens required for connecting to RTC infrastructure"),
        (name = "Meetings", description = "Meeting lifecycle management with LiveKit integration"),
        (name = "Participants", description = "Participant management (kick, list)"),
        (name = "Waiting Room", description = "Admit/Deny participants from waiting room"),
        (name = "Media Control", description = "Control audio, video, and screen sharing"),
        (name = "Chat", description = "In-meeting chat with hybrid real-time architecture.\n\n## Architecture\n- **LiveKit Data Channels**: Real-time message delivery via `publishData()` and `RoomEvent.DataReceived`\n- **REST API**: Message persistence and history loading for late joiners\n\n## Flow\n1. **Send**: POST /chat (persist) → LiveKit publishData() (broadcast)\n2. **Receive**: Listen to RoomEvent.DataReceived for instant delivery\n3. **Late Join**: GET /chat to load message history\n\n## Notes\n- Messages are **volatile** - automatically deleted when meeting ends\n- Only participants with 'joined' status can send/receive messages"),
        (name = "Users", description = "User profile management and account operations.\n\n## Endpoints\n- **GET /users/me**: Get current user profile\n- **PATCH /users/me**: Update profile (username only)\n- **POST /users/me/deactivate**: Deactivate account (soft delete)\n\n## Notes\n- All endpoints require JWT authentication\n- Deactivated users are blocked by auth middleware\n- Deactivation immediately invalidates all tokens")
    ),
    info(
        title = "CosmicForge RTC API",
        version = "1.0.0",
        description = "Real-Time Communication API for video conferencing with LiveKit integration",
        contact(
            name = "CosmicForge Team",
            email = "support@cosmicforge.com"
        )
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
            components.add_security_scheme(
                "api_key_auth",
                utoipa::openapi::security::SecurityScheme::ApiKey(
                    utoipa::openapi::security::ApiKey::Header(
                        utoipa::openapi::security::ApiKeyValue::new("Api-Key"),
                    ),
                ),
            );
        }
    }
}

/// Creates the Swagger UI router with dynamic server URL from environment
pub fn swagger_router(server_addr: &str) -> Router {
    let mut openapi = ApiDoc::openapi();

    // Set servers dynamically from environment
    let mut current_server = utoipa::openapi::Server::new(format!("http://{}", server_addr));
    current_server.description = Some("Current server".to_string());

    let mut prod_server = utoipa::openapi::Server::new("https://api.cosmicforge.com");
    prod_server.description = Some("Production server".to_string());

    openapi.servers = Some(vec![current_server, prod_server]);

    SwaggerUi::new("/swagger-ui")
        .url("/api-docs/openapi.json", openapi)
        .into()
}
