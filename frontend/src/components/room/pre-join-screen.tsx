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
import { Spinner } from "@/components/ui/spinner";
import { useMediaStream } from "@/hooks/useMediaStream";
import { MicVisualizer } from "@/components/ui/mic-visualizer";
import { useJoinMeeting, usePublicMeeting, useProfile } from "@/hooks";
import { storageStore, cookieStore } from "@/store";
import type { JoinMeetingData } from "@/types/meeting";

interface PreJoinScreenProps {
  roomId: string;
  onJoin: (data: JoinMeetingData) => void;
}

export default function PreJoinScreen({ roomId, onJoin }: PreJoinScreenProps) {
  // State for media controls (speaker, camera, mic)
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);

  // State to track if user is in waiting room
  const [isWaiting, setIsWaiting] = useState(false);

  // Display name state - auto-populated from profile/storage
  const [displayName, setDisplayName] = useState("");

  // UI error state
  const [error, setError] = useState("");

  // Ref for polling interval - used to check admission status
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

  // Poll to check if participant has been admitted to the meeting
  // This runs when a user is placed in the waiting room (isWaiting = true)
  const startPolling = useCallback(() => {
    // Clear any existing interval to prevent duplicates
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
    }

    pollIntervalRef.current = setInterval(async () => {
      try {
        // Attempt to join again to check status.
        // If admitted, the backend will return a join_token.
        const result = await joinMutation.mutateAsync({
          meetingIdentifier: roomId,
          data: {
            // CRITICAL: We only send user_id if we have a valid authenticated profile.
            // Guests join without a user_id.
            // We DO NOT use storedUser.id here to avoid "User not found" errors from stale sessions.
            user_id: profileData?.id,
            display_name: displayName.trim(),
          },
        });

        // If we get a token, it means we've been admitted!
        if (result.data.join_token) {
          if (pollIntervalRef.current) {
            clearInterval(pollIntervalRef.current);
            pollIntervalRef.current = null;
          }
          setIsWaiting(false);
          // Proceed to the main live room
          onJoin(result.data);
        }
      } catch {
        // Still in waiting room or temporary network error - continue polling
      }
    }, 3000); // Check every 3 seconds
  }, [roomId, displayName, profileData, joinMutation, onJoin]);

  const handleJoin = async () => {
    setError("");

    if (!displayName.trim()) {
      setError("Please enter your name");
      return;
    }

    try {
      // Construct join data
      const data = {
        // LOGIC CONFIRMATION:
        // 1. If profileData.id exists, the user is authenticated -> Send user_id.
        // 2. If profileData.id is missing, the user is a guest -> Send undefined for user_id.
        // 3. We NEVER use storedUser.id (localStorage) for user_id to prevent stale session errors.
        user_id: profileData?.id,
        display_name: displayName.trim(),
      };

      // Attempt to join the meeting
      const result = await joinMutation.mutateAsync({
        meetingIdentifier: roomId,
        data,
      });

      // Check if user is in waiting room (empty join_token means waiting)
      if (!result.data.join_token) {
        // GUEST AUTH: Even if waiting, save tokens if provided (for polling/chat while waiting)
        if (result.data.access_token && result.data.refresh_token) {
          cookieStore.setTokens(
            result.data.access_token,
            result.data.refresh_token,
          );
        }

        setIsWaiting(true);
        // Start polling for admission status
        startPolling();
      } else {
        // GUEST AUTH: If backend returned guest tokens, save them!
        if (result.data.access_token && result.data.refresh_token) {
          cookieStore.setTokens(
            result.data.access_token,
            result.data.refresh_token,
          );
        }

        // Host or admitted immediately - proceed to room
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
        <Spinner label="Loading meeting info..." />
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
          <>
            {/* Logic for Scheduled Meetings:
                - Check if meeting is 'scheduled' AND current time is before start_time
                - Be explicit about preventing early joins
                - Calculate remaining time to show countdown
            */}
            {meetingInfo?.data?.status === "scheduled" &&
              (() => {
                const now = new Date();
                const startTime = new Date(meetingInfo.data.start_time);
                const isBeforeStart = now < startTime;

                if (isBeforeStart) {
                  const minutesUntilStart = Math.ceil(
                    (startTime.getTime() - now.getTime()) / (1000 * 60),
                  );
                  const hours = Math.floor(minutesUntilStart / 60);
                  const minutes = minutesUntilStart % 60;
                  const timeDisplay =
                    hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;

                  return (
                    <div className="flex flex-col items-center gap-2 w-full max-w-xs">
                      <p className="text-sm text-center text-[#00000080]">
                        Meeting starts in {timeDisplay}
                      </p>
                      <Button size="lg" className="w-full" disabled>
                        Meeting Not Started
                      </Button>
                    </div>
                  );
                }
                return null;
              })()}

            {(meetingInfo?.data?.status !== "scheduled" ||
              new Date() >= new Date(meetingInfo?.data?.start_time || "")) && (
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
                    : meetingInfo?.data?.status === "cancelled"
                      ? "Meeting Cancelled"
                      : "Join Meeting"}
              </Button>
            )}
          </>
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
