use axum::{
    extract::{Path, Query, State},
    http::StatusCode,
    Extension, Json,
};
use sea_orm::{ActiveModelTrait, ColumnTrait, EntityTrait, PaginatorTrait, QueryFilter, QueryOrder, Set};
use serde::Deserialize;
use uuid::Uuid;
use validator::Validate;

use crate::{
    auth::Claims,
    dto::*,
    error::{ApiError, ApiResult},
    models::{
        meetings::{self, Entity as Meetings},
        participants::{self, Entity as Participants},
    },
    state::AppState,
};

#[derive(Debug, Deserialize)]
pub struct ListMeetingsQuery {
    pub page: Option<u64>,
    pub limit: Option<u64>,
    pub status: Option<String>,
}

/// List meetings
pub async fn list_meetings(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Query(query): Query<ListMeetingsQuery>,
) -> ApiResult<Json<PaginatedResponse<MeetingResponse>>> {
    let tenant_id = Uuid::parse_str(&claims.tenant_id)
        .map_err(|_| ApiError::Unauthorized("Invalid token".to_string()))?;

    let page = query.page.unwrap_or(1).max(1);
    let limit = query.limit.unwrap_or(20).min(100);

    let mut select = Meetings::find()
        .filter(meetings::Column::TenantId.eq(tenant_id));

    // Filter by status if provided
    if let Some(status) = query.status {
        let meeting_status = match status.as_str() {
            "scheduled" => meetings::MeetingStatus::Scheduled,
            "ongoing" => meetings::MeetingStatus::Ongoing,
            "ended" => meetings::MeetingStatus::Ended,
            "cancelled" => meetings::MeetingStatus::Cancelled,
            _ => return Err(ApiError::ValidationError("Invalid status".to_string())),
        };
        select = select.filter(meetings::Column::Status.eq(meeting_status));
    }

    // Get total count
    let total = select.clone().count(&state.db).await?;

    // Get paginated results
    let meetings = select
        .order_by_desc(meetings::Column::CreatedAt)
        .paginate(&state.db, limit)
        .fetch_page(page - 1)
        .await?;

    let data: Vec<MeetingResponse> = meetings
        .into_iter()
        .map(|m| MeetingResponse {
            id: m.id,
            meeting_identifier: m.meeting_identifier,
            tenant_id: m.tenant_id,
            host_id: m.host_id,
            title: m.title,
            metadata: m.metadata,
            is_private: m.is_private,
            start_time: m.start_time,
            end_time: m.end_time,
            status: format!("{:?}", m.status).to_lowercase(),
            created_at: m.created_at,
            updated_at: m.updated_at,
        })
        .collect();

    let total_pages = (total as f64 / limit as f64).ceil() as u64;

    Ok(Json(PaginatedResponse {
        success: true,
        data,
        meta: PaginationMeta {
            page,
            limit,
            total,
            total_pages,
        },
    }))
}

/// Create meeting
pub async fn create_meeting(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Json(payload): Json<CreateMeetingRequest>,
) -> ApiResult<(StatusCode, Json<ApiResponse<MeetingResponse>>)> {
    // Validate request
    payload.validate()
        .map_err(|e| ApiError::ValidationError(e.to_string()))?;

    let user_id = Uuid::parse_str(&claims.sub)
        .map_err(|_| ApiError::Unauthorized("Invalid token".to_string()))?;
    let tenant_id = Uuid::parse_str(&claims.tenant_id)
        .map_err(|_| ApiError::Unauthorized("Invalid token".to_string()))?;

    // Generate meeting identifier
    let meeting_identifier = format!("MTG-{}", Uuid::new_v4().to_string()[..8].to_uppercase());

    // Create meeting
    let meeting = meetings::ActiveModel {
        id: Set(Uuid::new_v4()),
        meeting_identifier: Set(meeting_identifier),
        tenant_id: Set(tenant_id),
        host_id: Set(user_id),
        title: Set(payload.title),
        metadata: Set(payload.metadata),
        is_private: Set(payload.is_private.unwrap_or(false)),
        start_time: Set(payload.start_time),
        end_time: Set(payload.end_time),
        status: Set(meetings::MeetingStatus::Scheduled),
        created_at: Set(chrono::Utc::now()),
        updated_at: Set(chrono::Utc::now()),
    };

    let meeting = meeting.insert(&state.db).await?;

    let response = MeetingResponse {
        id: meeting.id,
        meeting_identifier: meeting.meeting_identifier,
        tenant_id: meeting.tenant_id,
        host_id: meeting.host_id,
        title: meeting.title,
        metadata: meeting.metadata,
        is_private: meeting.is_private,
        start_time: meeting.start_time,
        end_time: meeting.end_time,
        status: format!("{:?}", meeting.status).to_lowercase(),
        created_at: meeting.created_at,
        updated_at: meeting.updated_at,
    };

    Ok((StatusCode::CREATED, Json(ApiResponse {
        success: true,
        data: response,
    })))
}

/// Get meeting by ID
pub async fn get_meeting(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Path(id): Path<Uuid>,
) -> ApiResult<Json<ApiResponse<MeetingResponse>>> {
    let tenant_id = Uuid::parse_str(&claims.tenant_id)
        .map_err(|_| ApiError::Unauthorized("Invalid token".to_string()))?;

    let meeting = Meetings::find_by_id(id)
        .filter(meetings::Column::TenantId.eq(tenant_id))
        .one(&state.db)
        .await?
        .ok_or_else(|| ApiError::NotFound("Meeting not found".to_string()))?;

    let response = MeetingResponse {
        id: meeting.id,
        meeting_identifier: meeting.meeting_identifier,
        tenant_id: meeting.tenant_id,
        host_id: meeting.host_id,
        title: meeting.title,
        metadata: meeting.metadata,
        is_private: meeting.is_private,
        start_time: meeting.start_time,
        end_time: meeting.end_time,
        status: format!("{:?}", meeting.status).to_lowercase(),
        created_at: meeting.created_at,
        updated_at: meeting.updated_at,
    };

    Ok(Json(ApiResponse {
        success: true,
        data: response,
    }))
}

/// Update meeting
pub async fn update_meeting(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Path(id): Path<Uuid>,
    Json(payload): Json<UpdateMeetingRequest>,
) -> ApiResult<Json<ApiResponse<MeetingResponse>>> {
    // Validate request
    payload.validate()
        .map_err(|e| ApiError::ValidationError(e.to_string()))?;

    let user_id = Uuid::parse_str(&claims.sub)
        .map_err(|_| ApiError::Unauthorized("Invalid token".to_string()))?;
    let tenant_id = Uuid::parse_str(&claims.tenant_id)
        .map_err(|_| ApiError::Unauthorized("Invalid token".to_string()))?;

    // Find meeting
    let meeting = Meetings::find_by_id(id)
        .filter(meetings::Column::TenantId.eq(tenant_id))
        .one(&state.db)
        .await?
        .ok_or_else(|| ApiError::NotFound("Meeting not found".to_string()))?;

    // Check if user is host
    if meeting.host_id != user_id {
        return Err(ApiError::Forbidden("Only the host can update the meeting".to_string()));
    }

    // Update meeting
    let mut meeting: meetings::ActiveModel = meeting.into();
    
    if let Some(title) = payload.title {
        meeting.title = Set(title);
    }
    if let Some(is_private) = payload.is_private {
        meeting.is_private = Set(is_private);
    }
    if let Some(start_time) = payload.start_time {
        meeting.start_time = Set(start_time);
    }
    if let Some(end_time) = payload.end_time {
        meeting.end_time = Set(Some(end_time));
    }
    if let Some(metadata) = payload.metadata {
        meeting.metadata = Set(Some(metadata));
    }
    meeting.updated_at = Set(chrono::Utc::now());

    let meeting = meeting.update(&state.db).await?;

    let response = MeetingResponse {
        id: meeting.id,
        meeting_identifier: meeting.meeting_identifier,
        tenant_id: meeting.tenant_id,
        host_id: meeting.host_id,
        title: meeting.title,
        metadata: meeting.metadata,
        is_private: meeting.is_private,
        start_time: meeting.start_time,
        end_time: meeting.end_time,
        status: format!("{:?}", meeting.status).to_lowercase(),
        created_at: meeting.created_at,
        updated_at: meeting.updated_at,
    };

    Ok(Json(ApiResponse {
        success: true,
        data: response,
    }))
}

/// Delete meeting
pub async fn delete_meeting(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Path(id): Path<Uuid>,
) -> ApiResult<StatusCode> {
    let user_id = Uuid::parse_str(&claims.sub)
        .map_err(|_| ApiError::Unauthorized("Invalid token".to_string()))?;
    let tenant_id = Uuid::parse_str(&claims.tenant_id)
        .map_err(|_| ApiError::Unauthorized("Invalid token".to_string()))?;

    // Find meeting
    let meeting = Meetings::find_by_id(id)
        .filter(meetings::Column::TenantId.eq(tenant_id))
        .one(&state.db)
        .await?
        .ok_or_else(|| ApiError::NotFound("Meeting not found".to_string()))?;

    // Check if user is host
    if meeting.host_id != user_id {
        return Err(ApiError::Forbidden("Only the host can delete the meeting".to_string()));
    }

    // Delete meeting
    Meetings::delete_by_id(id).exec(&state.db).await?;

    Ok(StatusCode::NO_CONTENT)
}

/// Start meeting
pub async fn start_meeting(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Path(id): Path<Uuid>,
) -> ApiResult<Json<ApiResponse<MeetingResponse>>> {
    let user_id = Uuid::parse_str(&claims.sub)
        .map_err(|_| ApiError::Unauthorized("Invalid token".to_string()))?;
    let tenant_id = Uuid::parse_str(&claims.tenant_id)
        .map_err(|_| ApiError::Unauthorized("Invalid token".to_string()))?;

    // Find meeting
    let meeting = Meetings::find_by_id(id)
        .filter(meetings::Column::TenantId.eq(tenant_id))
        .one(&state.db)
        .await?
        .ok_or_else(|| ApiError::NotFound("Meeting not found".to_string()))?;

    // Check if user is host
    if meeting.host_id != user_id {
        return Err(ApiError::Forbidden("Only the host can start the meeting".to_string()));
    }

    // Check if meeting can be started
    if meeting.status != meetings::MeetingStatus::Scheduled {
        return Err(ApiError::Conflict("Meeting has already started or ended".to_string()));
    }

    // Update meeting status
    let mut meeting: meetings::ActiveModel = meeting.into();
    meeting.status = Set(meetings::MeetingStatus::Ongoing);
    meeting.updated_at = Set(chrono::Utc::now());

    let meeting = meeting.update(&state.db).await?;

    let response = MeetingResponse {
        id: meeting.id,
        meeting_identifier: meeting.meeting_identifier,
        tenant_id: meeting.tenant_id,
        host_id: meeting.host_id,
        title: meeting.title,
        metadata: meeting.metadata,
        is_private: meeting.is_private,
        start_time: meeting.start_time,
        end_time: meeting.end_time,
        status: format!("{:?}", meeting.status).to_lowercase(),
        created_at: meeting.created_at,
        updated_at: meeting.updated_at,
    };

    Ok(Json(ApiResponse {
        success: true,
        data: response,
    }))
}

/// End meeting
pub async fn end_meeting(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Path(id): Path<Uuid>,
) -> ApiResult<Json<ApiResponse<MeetingResponse>>> {
    let user_id = Uuid::parse_str(&claims.sub)
        .map_err(|_| ApiError::Unauthorized("Invalid token".to_string()))?;
    let tenant_id = Uuid::parse_str(&claims.tenant_id)
        .map_err(|_| ApiError::Unauthorized("Invalid token".to_string()))?;

    // Find meeting
    let meeting = Meetings::find_by_id(id)
        .filter(meetings::Column::TenantId.eq(tenant_id))
        .one(&state.db)
        .await?
        .ok_or_else(|| ApiError::NotFound("Meeting not found".to_string()))?;

    // Check if user is host
    if meeting.host_id != user_id {
        return Err(ApiError::Forbidden("Only the host can end the meeting".to_string()));
    }

    // Update meeting status
    let mut meeting: meetings::ActiveModel = meeting.into();
    meeting.status = Set(meetings::MeetingStatus::Ended);
    meeting.end_time = Set(Some(chrono::Utc::now()));
    meeting.updated_at = Set(chrono::Utc::now());

    let meeting = meeting.update(&state.db).await?;

    let response = MeetingResponse {
        id: meeting.id,
        meeting_identifier: meeting.meeting_identifier,
        tenant_id: meeting.tenant_id,
        host_id: meeting.host_id,
        title: meeting.title,
        metadata: meeting.metadata,
        is_private: meeting.is_private,
        start_time: meeting.start_time,
        end_time: meeting.end_time,
        status: format!("{:?}", meeting.status).to_lowercase(),
        created_at: meeting.created_at,
        updated_at: meeting.updated_at,
    };

    Ok(Json(ApiResponse {
        success: true,
        data: response,
    }))
}

/// Join meeting
pub async fn join_meeting(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
    Json(payload): Json<JoinMeetingRequest>,
) -> ApiResult<Json<ApiResponse<ParticipantResponse>>> {
    // Find meeting
    let meeting = Meetings::find_by_id(id)
        .one(&state.db)
        .await?
        .ok_or_else(|| ApiError::NotFound("Meeting not found".to_string()))?;

    // Check if meeting is private
    if meeting.is_private {
        // In a real implementation, check if user has invitation
        return Err(ApiError::Forbidden("Meeting is private and requires invitation".to_string()));
    }

    // Create participant
    let participant = participants::ActiveModel {
        id: Set(Uuid::new_v4()),
        meeting_id: Set(meeting.id),
        user_id: Set(None), // NULL for guests
        role: Set(participants::ParticipantRole::Participant),
        join_time: Set(chrono::Utc::now()),
        leave_time: Set(None),
        status: Set(participants::ParticipantStatus::Joined),
        is_muted: Set(false),
        is_video_on: Set(true),
        is_screen_sharing: Set(false),
        display_name: Set(payload.display_name.clone()),
    };

    let participant = participant.insert(&state.db).await?;

    let response = ParticipantResponse {
        id: participant.id,
        meeting_id: participant.meeting_id,
        user_id: participant.user_id,
        role: format!("{:?}", participant.role).to_lowercase(),
        display_name: participant.display_name,
        status: format!("{:?}", participant.status).to_lowercase(),
        join_time: participant.join_time,
    };

    Ok(Json(ApiResponse {
        success: true,
        data: response,
    }))
}
