"use client";

import { useEffect, useState } from "react";
import {
  LiveKitRoom,
  VideoConference,
  GridLayout,
  ParticipantTile,
  RoomAudioRenderer,
  ControlBar,
  useTracks,
  LayoutContextProvider,
  useParticipantContext,
  VideoTrack,
  ParticipantName,
  TrackMutedIndicator,
} from "@livekit/components-react";
import { Track } from "livekit-client";
import Sidebar from "@/components/room/sidebar";
import FooterControls from "@/components/room/footer-controls";
import type { JoinMeetingData } from "@/types/meeting";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useMeeting } from "@/hooks";

interface LiveRoomProps {
  joinData: JoinMeetingData;
}
export default function LiveRoom({ joinData }: LiveRoomProps) {
  const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Poll meeting status to auto-redirect if meeting ends
  const { data: meetingData } = useMeeting(joinData.meeting_id);

  useEffect(() => {
    if (meetingData?.data?.status === "ended") {
      router.push("/dashboard");
    }
  }, [meetingData, router]);

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
        onDisconnected={() => router.push("/dashboard")}
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
  if (!participant) return null;

  return (
    <div className="relative w-full h-full">
      {participant.isCameraEnabled ? (
        <VideoTrack
          trackRef={
            {
              participant,
              source: Track.Source.Camera,
              publication: participant.getTrackPublication(Track.Source.Camera),
            } as any
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
          <TrackMutedIndicator
            trackRef={
              {
                participant,
                source: Track.Source.Microphone,
                publication: participant.getTrackPublication(
                  Track.Source.Microphone,
                ),
              } as any
            }
            className="opacity-70"
          ></TrackMutedIndicator>
        </div>
      </div>
    </div>
  );
}
