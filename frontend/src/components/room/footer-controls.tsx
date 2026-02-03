import {
  Volume2,
  Upload,
  Mic,
  MicOff,
  Video,
  VideoOff,
  Settings,
  Maximize,
  Phone,
} from "lucide-react";
import { Button } from "../ui/button";
import { useLocalParticipant, useRoomContext } from "@livekit/components-react";
import { useEffect, useState } from "react";
import { MicVisualizer } from "../ui/mic-visualizer";
import { useMediaControl } from "@/hooks";

interface FooterControlsProps {
  onToggleSidebar: () => void;
  isSidebarOpen: boolean;
  meetingId: string;
  participantId: string;
}

export default function FooterControls({
  onToggleSidebar,
  isSidebarOpen,
  meetingId,
  participantId,
}: FooterControlsProps) {
  const {
    localParticipant,
    isMicrophoneEnabled,
    isCameraEnabled,
    isScreenShareEnabled,
    microphoneTrack,
  } = useLocalParticipant();
  const room = useRoomContext();

  const { startScreenShare, stopScreenShare, updateAudio, updateVideo } =
    useMediaControl();

  const [activeStream, setActiveStream] = useState<MediaStream | null>(null);

  useEffect(() => {
    if (microphoneTrack?.track?.mediaStreamTrack) {
      setActiveStream(
        new MediaStream([microphoneTrack.track.mediaStreamTrack]),
      );
    } else {
      setActiveStream(null);
    }
  }, [microphoneTrack]);

  const toggleMic = async () => {
    const newState = !isMicrophoneEnabled;
    await localParticipant.setMicrophoneEnabled(newState);
    updateAudio.mutate({ participantId, isMuted: !newState });
  };

  const toggleCamera = async () => {
    const newState = !isCameraEnabled;
    await localParticipant.setCameraEnabled(newState);
    updateVideo.mutate({ participantId, isVideoOn: newState });
  };

  const toggleScreenShare = async () => {
    const newState = !isScreenShareEnabled;
    await localParticipant.setScreenShareEnabled(newState);
    if (newState) {
      startScreenShare.mutate(meetingId);
    } else {
      stopScreenShare.mutate(meetingId);
    }
  };

  const handleDisconnect = () => {
    room.disconnect();
  };

  return (
    <footer className="p-2 sm:p-6 flex items-center justify-center gap-2 sm:gap-4 bg-white border-t border-gray-100 z-10 relative">
      <div className="flex flex-wrap items-center justify-between w-full max-w-5xl rounded-lg gap-2 sm:gap-4 px-1 sm:px-6">
        <Button className="p-2 sm:p-3 rounded-md bg-[#FAFAFB] text-sky-500 hover:bg-gray-200">
          <Volume2 className="text-[#029CD4]" size={24} />
        </Button>
        <div className="flex items-center gap-2 sm:gap-4">
          <Button
            onClick={toggleScreenShare}
            className={`p-2 sm:p-3 rounded-lg transition-colors ${
              isScreenShareEnabled
                ? "bg-green-100 text-green-600 hover:bg-green-200"
                : "bg-[#FAFAFB] text-sky-500 hover:bg-gray-200"
            }`}
          >
            <Upload
              className={
                isScreenShareEnabled ? "text-green-600" : "text-[#029CD4]"
              }
              size={24}
            />
          </Button>

          <div className="relative">
            <Button
              onClick={toggleMic}
              className={`p-2 sm:p-3 rounded-lg transition-colors relative z-10 ${
                !isMicrophoneEnabled
                  ? "bg-red-50 text-red-500 hover:bg-red-100"
                  : "bg-[#FAFAFB] text-sky-500 hover:bg-gray-200"
              }`}
            >
              {isMicrophoneEnabled ? (
                <Mic className="text-[#029CD4]" size={24} />
              ) : (
                <MicOff className="text-red-500" size={24} />
              )}
            </Button>

            {/* Visualizer Overlay */}
            {/* Visualizer Overlay */}
            {isMicrophoneEnabled && (
              <div className="absolute inset-0 flex items-end justify-center pb-2 pointer-events-none z-20">
                <MicVisualizer
                  stream={activeStream}
                  isOn={true}
                  barColor="bg-green-400"
                  count={4}
                  className="h-2"
                />
              </div>
            )}
          </div>

          {/* ... */}

          <Button
            onClick={handleDisconnect}
            style={{
              width: "56px",
              height: "56px",
              backgroundColor: "#FF3639",
              borderRadius: "28px",
            }}
            className="text-white shadow-xl hover:bg-red-600 transition-colors flex items-center justify-center p-0"
            variant="destructive"
          >
            <Phone className="fill-current rotate-[135deg]" size={28} />
          </Button>

          <Button
            onClick={toggleCamera}
            className={`p-2 sm:p-3 rounded-lg transition-colors ${
              !isCameraEnabled
                ? "bg-red-50 text-red-500 hover:bg-red-100"
                : "bg-[#FAFAFB] text-sky-500 hover:bg-gray-200"
            }`}
          >
            {isCameraEnabled ? (
              <Video className="text-[#029CD4]" size={24} />
            ) : (
              <VideoOff className="text-red-500" size={24} />
            )}
          </Button>

          <Button className="p-2 sm:p-3 rounded-lg bg-[#FAFAFB] text-sky-500 hover:bg-gray-200">
            <Settings className="text-[#029CD4]" size={24} />
          </Button>
        </div>
        <Button
          onClick={onToggleSidebar}
          className={`p-2 sm:p-3 rounded-lg transition-colors hover:text-white ${
            isSidebarOpen
              ? "bg-sky-100 text-sky-600"
              : "bg-gray-100 text-gray-500"
          }`}
        >
          <Maximize size={24} />
        </Button>
      </div>
    </footer>
  );
}
