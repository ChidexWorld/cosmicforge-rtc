"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import {
  LiveKitRoom,
  GridLayout,
  ParticipantTile,
  RoomAudioRenderer,
  useTracks,
  LayoutContextProvider,
  useParticipantContext,
  useMaybeTrackRefContext,
  VideoTrack,
  ParticipantName,
  TrackMutedIndicator,
  type TrackReference,
} from "@livekit/components-react";
import { Track } from "livekit-client";
import Sidebar from "@/components/room/sidebar";
import FooterControls from "@/components/room/footer-controls";
import type { JoinMeetingData } from "@/types/meeting";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { usePublicMeeting } from "@/hooks";
import { cookieStore } from "@/store";

// ...

interface LiveRoomProps {
  joinData: JoinMeetingData;
}
export default function LiveRoom({ joinData }: LiveRoomProps) {
  const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const isDisconnectingRef = useRef(false);

  // Guest detection: backend only returns access_token for guests
  // Authenticated users (host or logged-in participants) don't receive tokens in join response
  const isGuest = !!joinData.access_token;

  // Poll meeting status to auto-redirect if meeting ends
  // We use usePublicMeeting because useMeeting requires authentication,
  // which would fail for guest users.
  const { data: meetingData } = usePublicMeeting(joinData.room_name);

  useEffect(() => {
    if (isDisconnectingRef.current) return;
    if (meetingData?.data?.status === "ended") {
      isDisconnectingRef.current = true;
      if (isGuest) {
        cookieStore.clearTokens();
        router.replace("/");
      } else {
        router.replace("/dashboard");
      }
    }
  }, [meetingData, router, isGuest]);

  const handleDisconnect = useCallback(() => {
    if (isDisconnectingRef.current) return;
    isDisconnectingRef.current = true;
    if (isGuest) {
      // Guest: clear temporary tokens and go to home
      cookieStore.clearTokens();
      router.replace("/");
    } else {
      // Authenticated user/host: keep tokens and go to dashboard
      router.replace("/dashboard");
    }
  }, [router, isGuest]);

  if (!joinData.join_token) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p>Invalid Join Token</p>
      </div>
    );
  }

  return (
    <LayoutContextProvider>
      <LiveKitRoom
        video={true}
        audio={true}
        token={joinData.join_token}
        serverUrl={joinData.livekit_url}
        data-lk-theme="default"
        style={{ height: "100vh" }}
        onDisconnected={handleDisconnect}
      >
        <div className="flex h-screen bg-white overflow-hidden">
          <div className="flex flex-col flex-1 overflow-hidden">
            {/* Main Video Area */}
            <main className="flex-1 overflow-hidden transition-all duration-300 ease-in-out relative bg-[#111]">
              <VideoGridContent />
            </main>

            {/* Custom Footer Controls */}
            <FooterControls
              onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
              isSidebarOpen={isSidebarOpen}
              meetingId={joinData.meeting_id}
              participantId={joinData.participant_id}
            />
          </div>

          {/* Conditional Sidebar */}
          {isSidebarOpen && (
            <aside className="fixed inset-y-0 right-0 z-50 w-[85%] sm:w-80 bg-white sm:bg-transparent shadow-2xl sm:shadow-none sm:relative sm:z-0 border-l sm:border-none border-gray-200 flex flex-col h-full transition-all duration-300 sm:p-4">
              <Sidebar
                meetingId={joinData.meeting_id}
                isHost={joinData.role === "host"}
                participantId={joinData.participant_id}
                onClose={() => setIsSidebarOpen(false)}
              />
            </aside>
          )}
        </div>
        <RoomAudioRenderer />
      </LiveKitRoom>
    </LayoutContextProvider>
  );
}

function VideoGridContent() {
  const tracks = useTracks(
    [
      { source: Track.Source.Camera, withPlaceholder: true },
      { source: Track.Source.ScreenShare, withPlaceholder: false },
    ],
    { onlySubscribed: false },
  );

  return (
    <GridLayout tracks={tracks} style={{ height: "100%" }}>
      <ParticipantTile>
        <CustomTileContent />
      </ParticipantTile>
    </GridLayout>
  );
}

function CustomTileContent() {
  const participant = useParticipantContext();
  const trackRef = useMaybeTrackRefContext();

  if (!participant) return null;

  const isScreenShare = trackRef?.source === Track.Source.ScreenShare;
  const cameraPublication = participant.getTrackPublication(
    Track.Source.Camera,
  );
  const micPublication = participant.getTrackPublication(
    Track.Source.Microphone,
  );

  // Handle screen share tracks
  if (isScreenShare && trackRef) {
    return (
      <div className="relative w-full h-full">
        <VideoTrack
          trackRef={trackRef as TrackReference}
          className="w-full h-full object-contain bg-black"
        />
        {/* Screen share label */}
        <div className="absolute bottom-3 left-3 flex items-center gap-2">
          <div className="bg-black/60 backdrop-blur-sm text-white px-3 py-1.5 rounded-full text-sm flex items-center gap-2">
            <span className="text-green-400">●</span>
            <ParticipantName />
            <span className="text-xs opacity-70">(Screen)</span>
          </div>
        </div>
      </div>
    );
  }

  // Handle camera tracks (default behavior)
  return (
    <div className="relative w-full h-full">
      {participant.isCameraEnabled && cameraPublication ? (
        <VideoTrack
          trackRef={
            {
              participant,
              source: Track.Source.Camera,
              publication: cameraPublication,
            } as TrackReference
          }
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-[#18181b]">
          <Avatar className="h-24 w-24 border-4 border-white/10 bg-transparent">
            <AvatarFallback className="text-3xl font-bold bg-[#E6F5FA] text-[#029CD4]">
              {(participant.name || participant.identity || "Guest")
                .slice(0, 2)
                .toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </div>
      )}

      {/* Overlay info */}
      <div className="absolute bottom-3 left-3 flex items-center gap-2">
        <div className="bg-black/60 backdrop-blur-sm text-white px-3 py-1.5 rounded-full text-sm flex items-center gap-2">
          <ParticipantName />
          {micPublication && (
            <TrackMutedIndicator
              trackRef={
                {
                  participant,
                  source: Track.Source.Microphone,
                  publication: micPublication,
                } as TrackReference
              }
              className="opacity-70"
            />
          )}
        </div>
      </div>
    </div>
  );
}
