//! Meeting DTOs
//!
//! Data Transfer Objects for meeting-related API endpoints.

use chrono::{DateTime, NaiveDateTime, Utc};
use serde::{Deserialize, Serialize};
use serde_json::Value as JsonValue;
use utoipa::ToSchema;
use uuid::Uuid;
use validator::Validate;

/// Request to create a new meeting
#[derive(Debug, Deserialize, Validate, ToSchema)]
pub struct CreateMeetingRequest {
    #[validate(length(
        min = 1,
        max = 200,
        message = "Title must be between 1 and 200 characters"
    ))]
    pub title: String,

    pub start_time: DateTime<Utc>,

    pub end_time: Option<DateTime<Utc>>,

    #[serde(default)]
    pub is_private: Option<bool>,

    pub metadata: Option<JsonValue>,
}

/// Request to update an existing meeting
#[derive(Debug, Deserialize, Validate, ToSchema)]
pub struct UpdateMeetingRequest {
    #[validate(length(
        min = 1,
        max = 200,
        message = "Title must be between 1 and 200 characters"
    ))]
    pub title: Option<String>,

    pub start_time: Option<DateTime<Utc>>,

    pub end_time: Option<DateTime<Utc>>,

    pub is_private: Option<bool>,

    pub metadata: Option<JsonValue>,
}


// Re-export datetime helpers from utils module for backward compatibility
pub use crate::utils::datetime::{naive_to_utc, utc_to_naive};

/// Request to join a meeting
#[derive(Debug, Deserialize, Validate, ToSchema)]
pub struct JoinMeetingRequest {
    /// Optional user ID for authenticated users (null for guests)
    pub user_id: Option<Uuid>,

    #[validate(length(
        min = 1,
        max = 100,
        message = "Display name must be between 1 and 100 characters"
    ))]
    pub display_name: String,
}

/// Meeting response structure
#[derive(Debug, Serialize, ToSchema)]
pub struct MeetingResponse {
    pub id: Uuid,
    pub meeting_identifier: String,
    pub host_id: Uuid,
    pub title: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub metadata: Option<JsonValue>,
    pub is_private: bool,
    pub start_time: DateTime<Utc>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub end_time: Option<DateTime<Utc>>,
    pub status: String,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

/// Participant response structure
#[derive(Debug, Serialize, ToSchema)]
pub struct ParticipantResponse {
    pub participant_id: Uuid,
    pub meeting_id: Uuid,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub user_id: Option<Uuid>,
    pub role: String,
    pub display_name: String,
    pub status: String,
    pub join_time: DateTime<Utc>,
}

/// Response for joining a meeting (includes join token)
#[derive(Debug, Serialize, ToSchema)]
pub struct JoinMeetingResponse {
    pub participant_id: Uuid,
    pub role: String,
    /// Short-lived token for WebSocket/RTC session
    pub join_token: String,
    /// LiveKit server URL
    pub livekit_url: String,
    /// Room name for LiveKit
    pub room_name: String,
}

/// Response for ending a meeting
#[derive(Debug, Serialize, ToSchema)]
pub struct EndMeetingResponse {
    pub status: String,
}

/// Query parameters for listing meetings
#[derive(Debug, Deserialize)]
pub struct ListMeetingsQuery {
    pub page: Option<u64>,
    pub limit: Option<u64>,
    pub status: Option<String>,
}

// Swagger response wrappers

/// API response wrapper for meeting
#[derive(Debug, Serialize, ToSchema)]
pub struct MeetingApiResponse {
    pub success: bool,
    pub data: MeetingResponse,
}

/// API response wrapper for join meeting
#[derive(Debug, Serialize, ToSchema)]
pub struct JoinMeetingApiResponse {
    pub success: bool,
    pub data: JoinMeetingResponse,
}

/// API response wrapper for end meeting
#[derive(Debug, Serialize, ToSchema)]
pub struct EndMeetingApiResponse {
    pub success: bool,
    pub data: EndMeetingResponse,
}

/// Pagination metadata
#[derive(Debug, Serialize, ToSchema)]
pub struct MeetingPaginationMeta {
    pub page: u64,
    pub limit: u64,
    pub total: u64,
    pub total_pages: u64,
}

/// Paginated response for meetings list
#[derive(Debug, Serialize, ToSchema)]
pub struct PaginatedMeetingResponse {
    pub success: bool,
    pub data: Vec<MeetingResponse>,
    pub meta: MeetingPaginationMeta,
}

// ============================================================================
// PARTICIPANT MANAGEMENT DTOs
// ============================================================================

/// Detailed participant response with media states
#[derive(Debug, Serialize, ToSchema)]
pub struct DetailedParticipantResponse {
    pub participant_id: Uuid,
    pub meeting_id: Uuid,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub user_id: Option<Uuid>,
    pub role: String,
    pub display_name: String,
    pub status: String,
    pub join_time: DateTime<Utc>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub leave_time: Option<DateTime<Utc>>,
    pub is_muted: bool,
    pub is_video_on: bool,
    pub is_screen_sharing: bool,
}

/// Response for listing participants
#[derive(Debug, Serialize, ToSchema)]
pub struct ParticipantsListResponse {
    pub success: bool,
    pub data: Vec<DetailedParticipantResponse>,
}

/// Response for participant action (kick, admit, deny)
#[derive(Debug, Serialize, ToSchema)]
pub struct ParticipantActionResponse {
    pub success: bool,
    pub message: String,
}

// ============================================================================
// WAITING ROOM DTOs
// ============================================================================

/// Waiting participant response
#[derive(Debug, Serialize, ToSchema)]
pub struct WaitingParticipantResponse {
    pub participant_id: Uuid,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub user_id: Option<Uuid>,
    pub display_name: String,
    pub join_time: DateTime<Utc>,
}

/// Response for listing waiting participants
#[derive(Debug, Serialize, ToSchema)]
pub struct WaitingListResponse {
    pub success: bool,
    pub data: Vec<WaitingParticipantResponse>,
}

// ============================================================================
// MEDIA CONTROL DTOs
// ============================================================================

/// Request to update audio state
#[derive(Debug, Deserialize, ToSchema)]
pub struct UpdateAudioRequest {
    pub is_muted: bool,
}

/// Request to update video state
#[derive(Debug, Deserialize, ToSchema)]
pub struct UpdateVideoRequest {
    pub is_video_on: bool,
}

/// Response for media state update
#[derive(Debug, Serialize, ToSchema)]
pub struct MediaStateResponse {
    pub success: bool,
    pub participant_id: Uuid,
    pub is_muted: bool,
    pub is_video_on: bool,
    pub is_screen_sharing: bool,
}

/// Response for screen share action
#[derive(Debug, Serialize, ToSchema)]
pub struct ScreenShareResponse {
    pub success: bool,
    pub participant_id: Uuid,
    pub is_screen_sharing: bool,
    pub message: String,
}
