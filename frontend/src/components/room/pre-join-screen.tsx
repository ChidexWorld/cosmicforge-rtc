"use client";

import {
  type ReactNode,
  useState,
  useEffect,
  useRef,
  useCallback,
} from "react";
import { Mic, MicOff, Video, VideoOff, Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useMediaStream } from "@/hooks/useMediaStream";
import { MicVisualizer } from "@/components/ui/mic-visualizer";
import { useJoinMeeting, usePublicMeeting, useProfile } from "@/hooks";
import { storageStore } from "@/store";
import type { JoinMeetingData } from "@/types/meeting";

interface PreJoinScreenProps {
  roomId: string;
  onJoin: (data: JoinMeetingData) => void;
}

export default function PreJoinScreen({ roomId, onJoin }: PreJoinScreenProps) {
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [isWaiting, setIsWaiting] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState("");
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const { videoRef, streamRef, isCameraOn, isMicOn, toggleCamera, toggleMic } =
    useMediaStream({ video: true, audio: true });

  // Get authenticated user info
  const { data: profileData } = useProfile();
  const storedUser = storageStore.getUser();

  // ... rest of imports

  // Get public meeting info
  const { data: meetingInfo, isLoading: isLoadingMeeting } =
    usePublicMeeting(roomId);

  // Join meeting mutation
  const joinMutation = useJoinMeeting();

  // Set initial display name from user profile
  useEffect(() => {
    if (profileData?.username) {
      setDisplayName(profileData.username);
    } else if (storedUser?.username) {
      setDisplayName(storedUser.username);
    }
  }, [profileData, storedUser]);

  // Cleanup polling interval on unmount
  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, []);

  // Poll to check if participant has been admitted
  const startPolling = useCallback(() => {
    // Clear any existing interval
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
    }

    pollIntervalRef.current = setInterval(async () => {
      try {
        const result = await joinMutation.mutateAsync({
          meetingIdentifier: roomId,
          data: {
            user_id: profileData?.id || storedUser?.id,
            display_name: displayName.trim(),
          },
        });

        if (result.data.join_token) {
          if (pollIntervalRef.current) {
            clearInterval(pollIntervalRef.current);
            pollIntervalRef.current = null;
          }
          setIsWaiting(false);
          onJoin(result.data);
        }
      } catch {
        // Still waiting or error - continue polling
      }
    }, 3000); // Check every 3 seconds
  }, [roomId, displayName, profileData, storedUser, joinMutation, onJoin]);

  const handleJoin = async () => {
    setError("");

    if (!displayName.trim()) {
      setError("Please enter your name");
      return;
    }

    try {
      const result = await joinMutation.mutateAsync({
        meetingIdentifier: roomId,
        data: {
          user_id: profileData?.id || storedUser?.id,
          display_name: displayName.trim(),
        },
      });

      // Check if user is in waiting room (empty join_token means waiting)
      if (!result.data.join_token) {
        setIsWaiting(true);
        // Start polling for admission status
        startPolling();
      } else {
        // Host or admitted - proceed to room
        onJoin(result.data);
      }
    } catch (err: any) {
      console.error("Join error:", err);
      const errorMessage =
        err.response?.data?.error?.message ||
        (err instanceof Error ? err.message : "Failed to join meeting");
      setError(errorMessage);
    }
  };

  const handleCancel = () => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
    setIsWaiting(false);
    setError("");
  };

  if (isLoadingMeeting) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-[#029CD4] border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-[#00000080]">Loading meeting info...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center h-screen bg-gray-50">
      <div className="flex flex-col items-center gap-8 w-full max-w-lg px-6">
        {/* Title */}
        <div className="text-center space-y-1">
          <h1 className="text-2xl font-bold text-[#343434]">Ready to join?</h1>
          <p className="text-sm text-[#00000080]">
            {meetingInfo?.data?.title || "Meeting"} -{" "}
            <span className="font-medium text-[#029CD4]">{roomId}</span>
          </p>
          <div className="flex items-center justify-center gap-2 mt-2">
            {meetingInfo?.data?.is_private && (
              <span className="px-2 py-0.5 text-xs bg-amber-100 text-amber-700 rounded-full font-medium">
                Private Only
              </span>
            )}
            {meetingInfo?.data?.status && (
              <span
                className={`px-2 py-0.5 text-xs rounded-full font-medium capitalize ${
                  meetingInfo.data.status === "live"
                    ? "bg-green-100 text-green-700"
                    : meetingInfo.data.status === "scheduled"
                      ? "bg-blue-100 text-blue-700"
                      : "bg-gray-100 text-gray-700"
                }`}
              >
                {meetingInfo.data.status}
              </span>
            )}
          </div>
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
                <AvatarFallback className="text-3xl font-bold bg-[#E6F5FA] text-[#029CD4]">
                  {(displayName || "Guest").slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="text-white/50 text-sm">Camera is off</span>
            </div>
          )}

          {/* Mic status badge */}
          <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-sm rounded-full px-3 py-1.5 flex items-center gap-1.5">
            {isMicOn ? (
              <>
                <Mic className="w-3.5 h-3.5 text-green-400" />
                <div className="h-3.5 flex items-center">
                  <MicVisualizer
                    stream={streamRef.current}
                    isOn={isMicOn}
                    barColor="bg-green-400"
                    count={5}
                  />
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

        {/* Display Name Input */}
        {!isWaiting && (
          <div className="w-full max-w-xs">
            <Input
              type="text"
              placeholder="Enter your name"
              value={displayName}
              onChange={(e) => {
                setDisplayName(e.target.value);
                setError("");
              }}
              className="text-center h-11"
              maxLength={100}
            />
            {error && (
              <p className="text-sm text-red-500 mt-2 text-center">{error}</p>
            )}
          </div>
        )}

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
            <Button variant="ghost" size="sm" onClick={handleCancel}>
              Cancel
            </Button>
          </div>
        ) : (
          <Button
            size="lg"
            className="w-full max-w-xs"
            onClick={handleJoin}
            disabled={
              joinMutation.isPending ||
              meetingInfo?.data?.status === "ended" ||
              meetingInfo?.data?.status === "cancelled"
            }
          >
            {joinMutation.isPending
              ? "Joining..."
              : meetingInfo?.data?.status === "ended"
                ? "Meeting Ended"
                : "Join Meeting"}
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
