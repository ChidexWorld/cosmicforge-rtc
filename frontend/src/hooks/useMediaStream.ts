"use client";

import { useState, useRef, useEffect, useCallback } from "react";

interface UseMediaStreamOptions {
  video?: boolean;
  audio?: boolean;
}

export function useMediaStream(
  options: UseMediaStreamOptions = { video: true, audio: true },
) {
  const [isCameraOn, setIsCameraOn] = useState(!!options.video);
  const [isMicOn, setIsMicOn] = useState(!!options.audio);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const startStream = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Failed to access media devices:", err);
    }
  }, []);

  const stopStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  // Start/stop camera
  useEffect(() => {
    if (isCameraOn) {
      startStream();
    } else {
      stopStream();
    }
    return () => {
      stopStream();
    };
  }, [isCameraOn, startStream, stopStream]);

  // Mute/unmute mic track
  useEffect(() => {
    if (streamRef.current) {
      streamRef.current.getAudioTracks().forEach((track) => {
        track.enabled = isMicOn;
      });
    }
  }, [isMicOn]);

  const toggleCamera = useCallback(() => {
    setIsCameraOn((prev) => !prev);
  }, []);

  const toggleMic = useCallback(() => {
    setIsMicOn((prev) => !prev);
  }, []);

  return {
    videoRef,
    streamRef,
    isCameraOn,
    isMicOn,
    toggleCamera,
    toggleMic,
  };
}
