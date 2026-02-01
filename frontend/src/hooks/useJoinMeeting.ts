import { useMutation, useQueryClient } from "@tanstack/react-query";
import { meetingService } from "@/services/meeting.service";
import type { ApiErrorResponse } from "@/types/auth";
import { AxiosError } from "axios";

export function useJoinMeeting() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (meetingIdentifier: string) =>
      meetingService.joinMeeting(meetingIdentifier),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["meetings"] });
    },
    onError: (error: AxiosError<ApiErrorResponse>) => {
      const message =
        error.response?.data?.error?.message || "Failed to join meeting";
      console.error("Join meeting error:", message);
    },
  });
}
