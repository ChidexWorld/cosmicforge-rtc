export interface Meeting {
  id: string;
  meeting_identifier: string;
  host_id: string;
  title: string;
  metadata: string;
  is_private: boolean;
  start_time: string;
  end_time: string;
  status: MeetingStatus;
  join_url: string;
  created_at: string;
  updated_at: string;
}

export type MeetingStatus = "scheduled" | "live" | "ended" | "cancelled";

export interface MeetingsParams {
  page?: number;
  limit?: number;
  status?: MeetingStatus;
}

export interface CreateMeetingRequest {
  title: string;
  start_time: string;
  end_time: string;
  timezone: string;
  is_private: boolean;
  metadata?: string;
}

export interface CreateMeetingResponse {
  success: boolean;
  data: Meeting;
}

export interface MeetingResponse {
  success: boolean;
  data: Meeting;
}

export interface UpdateMeetingRequest {
  title?: string;
  start_time?: string;
  end_time?: string;
  timezone?: string;
  is_private?: boolean;
  metadata?: string;
}

export interface JoinMeetingResponse {
  success: boolean;
  data: Meeting;
}

export interface MeetingsResponse {
  success: boolean;
  data: Meeting[];
  meta: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
}
