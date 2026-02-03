import { useMutation } from "@tanstack/react-query";
import { meetingService } from "@/services/meeting.service";

export function useMediaControl() {
  const startScreenShare = useMutation({
    mutationFn: (meetingId: string) =>
      meetingService.startScreenShare(meetingId),
  });

  const stopScreenShare = useMutation({
    mutationFn: (meetingId: string) =>
      meetingService.stopScreenShare(meetingId),
  });

  const updateAudio = useMutation({
    mutationFn: ({
      participantId,
      isMuted,
    }: {
      participantId: string;
      isMuted: boolean;
    }) => meetingService.updateAudioState(participantId, isMuted),
  });

  const updateVideo = useMutation({
    mutationFn: ({
      participantId,
      isVideoOn,
    }: {
      participantId: string;
      isVideoOn: boolean;
    }) => meetingService.updateVideoState(participantId, isVideoOn),
  });

  return {
    startScreenShare,
    stopScreenShare,
    updateAudio,
    updateVideo,
  };
}
