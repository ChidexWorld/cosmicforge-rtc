import api from "./api";
import type {
  MeetingsParams,
  MeetingsResponse,
  MeetingResponse,
  CreateMeetingRequest,
  CreateMeetingResponse,
  UpdateMeetingRequest,
  JoinMeetingResponse,
} from "@/types/meeting";

export const meetingService = {
  // GET /meetings — list meetings
  getMeetings: async (params?: MeetingsParams) => {
    const response = await api.get<MeetingsResponse>("/meetings", { params });
    return response.data;
  },

  // GET /meetings/:id — get meeting by ID
  getMeeting: async (id: string) => {
    const response = await api.get<MeetingResponse>(`/meetings/${id}`);
    return response.data;
  },

  // GET /meetings/public/:meeting_identifier — get public meeting info
  getPublicMeeting: async (meetingIdentifier: string) => {
    const response = await api.get<MeetingResponse>(
      `/meetings/public/${meetingIdentifier}`
    );
    return response.data;
  },

  // POST /meetings — create a meeting
  createMeeting: async (data: CreateMeetingRequest) => {
    const response = await api.post<CreateMeetingResponse>("/meetings", data);
    return response.data;
  },

  // POST /meetings/join/:meeting_identifier — join a meeting
  joinMeeting: async (meetingIdentifier: string) => {
    const response = await api.post<JoinMeetingResponse>(
      `/meetings/join/${meetingIdentifier}`
    );
    return response.data;
  },

  // PUT /meetings/:id — update a meeting (host only)
  updateMeeting: async (id: string, data: UpdateMeetingRequest) => {
    const response = await api.put<MeetingResponse>(`/meetings/${id}`, data);
    return response.data;
  },

  // DELETE /meetings/:id — delete a meeting (host only)
  deleteMeeting: async (id: string) => {
    const response = await api.delete<{ success: boolean }>(`/meetings/${id}`);
    return response.data;
  },

  // POST /meetings/:id/end — end a meeting (host only)
  endMeeting: async (id: string) => {
    const response = await api.post<MeetingResponse>(`/meetings/${id}/end`);
    return response.data;
  },
};
