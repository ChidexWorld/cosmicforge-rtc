"use client";

import { type ReactNode, useState } from "react";
import { Mic, MicOff, Video, VideoOff, Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useMediaStream } from "@/hooks/useMediaStream";
import { useMicLevel } from "@/hooks/useMicLevel";

interface PreJoinScreenProps {
  roomId: string;
  onJoin: () => void;
}

export default function PreJoinScreen({ roomId, onJoin }: PreJoinScreenProps) {
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [isWaiting, setIsWaiting] = useState(false);

  const { videoRef, streamRef, isCameraOn, isMicOn, toggleCamera, toggleMic } =
    useMediaStream({ video: true, audio: true });

  const micLevel = useMicLevel(isMicOn, streamRef);

  const handleJoin = () => {
    setIsWaiting(true);
    // In a real app this would send a request to the host for admission
  };

  return (
    <div className="flex items-center justify-center h-screen bg-gray-50">
      <div className="flex flex-col items-center gap-8 w-full max-w-lg px-6">
        {/* Title */}
        <div className="text-center space-y-1">
          <h1 className="text-2xl font-bold text-[#343434]">Ready to join?</h1>
          <p className="text-sm text-[#00000080]">
            Room: <span className="font-medium text-[#029CD4]">{roomId}</span>
          </p>
        </div>

        {/* Camera Preview */}
        <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-[#1a1a2e] shadow-lg">
          {isCameraOn ? (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover mirror"
              style={{ transform: "scaleX(-1)" }}
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center gap-3">
              <Avatar className="h-24 w-24 border-4 border-white/10">
                <AvatarImage src="https://api.dicebear.com/7.x/avataaars/svg?seed=You" />
                <AvatarFallback className="text-3xl font-bold bg-[#029CD4] text-white">
                  Y
                </AvatarFallback>
              </Avatar>
              <span className="text-white/50 text-sm">Camera is off</span>
            </div>
          )}

          {/* Mic status badge — bottom left */}
          <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-sm rounded-full px-3 py-1.5 flex items-center gap-1.5">
            {isMicOn ? (
              <>
                <Mic className="w-3.5 h-3.5 text-green-400" />
                <div className="flex items-end gap-[2px] h-3.5">
                  {[0, 1, 2, 3, 4].map((i) => {
                    const threshold = (i + 1) / 5;
                    const active = micLevel >= threshold;
                    return (
                      <div
                        key={i}
                        className={`w-[3px] rounded-full transition-all duration-100 ${
                          active ? "bg-green-400" : "bg-white/20"
                        }`}
                        style={{
                          height: `${((i + 1) / 5) * 100}%`,
                        }}
                      />
                    );
                  })}
                </div>
              </>
            ) : (
              <>
                <MicOff className="w-3.5 h-3.5 text-red-400" />
                <span className="text-white text-xs">Muted</span>
              </>
            )}
          </div>
        </div>

        {/* Toggle Controls */}
        <div className="flex items-center gap-4">
          <ToggleButton
            isOn={isMicOn}
            onToggle={toggleMic}
            iconOn={<Mic className="w-5 h-5" />}
            iconOff={<MicOff className="w-5 h-5" />}
            label="Mic"
          />
          <ToggleButton
            isOn={isCameraOn}
            onToggle={toggleCamera}
            iconOn={<Video className="w-5 h-5" />}
            iconOff={<VideoOff className="w-5 h-5" />}
            label="Camera"
          />
          <ToggleButton
            isOn={isSpeakerOn}
            onToggle={() => setIsSpeakerOn(!isSpeakerOn)}
            iconOn={<Volume2 className="w-5 h-5" />}
            iconOff={<VolumeX className="w-5 h-5" />}
            label="Speaker"
          />
        </div>

        {/* Join / Waiting */}
        {isWaiting ? (
          <div className="flex flex-col items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#029CD4] opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-[#029CD4]" />
              </span>
              <span className="text-sm font-medium text-[#343434]">
                Waiting for the host to let you in...
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsWaiting(false)}
            >
              Cancel
            </Button>
          </div>
        ) : (
          <Button size="lg" className="w-full max-w-xs" onClick={handleJoin}>
            Join Meeting
          </Button>
        )}
      </div>
    </div>
  );
}

function ToggleButton({
  isOn,
  onToggle,
  iconOn,
  iconOff,
  label,
}: {
  isOn: boolean;
  onToggle: () => void;
  iconOn: ReactNode;
  iconOff: ReactNode;
  label: string;
}) {
  return (
    <button
      onClick={onToggle}
      className={`flex flex-col items-center gap-1.5 group`}
    >
      <div
        className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
          isOn
            ? "bg-[#029CD4] text-white shadow-md"
            : "bg-gray-200 text-gray-500"
        } group-hover:scale-105`}
      >
        {isOn ? iconOn : iconOff}
      </div>
      <span
        className={`text-xs font-medium ${
          isOn ? "text-[#029CD4]" : "text-gray-400"
        }`}
      >
        {label}
      </span>
    </button>
  );
}
