"use client";

import { type MutableRefObject, useState, useRef, useEffect } from "react";

export function useMicLevel(
  isMicOn: boolean,
  streamRef: MutableRefObject<MediaStream | null>
) {
  const [rawLevel, setRawLevel] = useState(0);

  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number>(0);
  const levelRef = useRef(0);

  useEffect(() => {
    if (!isMicOn) {
      levelRef.current = 0;
      return;
    }

    let cancelled = false;

    const setupAnalyser = async () => {
      let stream = streamRef.current;
      if (!stream) {
        try {
          stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        } catch {
          return;
        }
      }

      if (cancelled) return;

      const audioContext = new AudioContext();
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.5;

      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);

      audioContextRef.current = audioContext;
      analyserRef.current = analyser;

      const dataArray = new Uint8Array(analyser.fftSize);

      const tick = () => {
        if (cancelled) return;
        analyser.getByteTimeDomainData(dataArray);
        let peak = 0;
        for (let i = 0; i < dataArray.length; i++) {
          const deviation = Math.abs(dataArray[i] - 128);
          if (deviation > peak) peak = deviation;
        }
        const raw = peak / 128;
        const normalized = Math.min(1, Math.pow(raw * 4, 0.5));
        if (Math.abs(normalized - levelRef.current) > 0.02) {
          levelRef.current = normalized;
          setRawLevel(normalized);
        }
        animFrameRef.current = requestAnimationFrame(tick);
      };

      tick();
    };

    const timeout = setTimeout(setupAnalyser, 300);

    return () => {
      cancelled = true;
      clearTimeout(timeout);
      cancelAnimationFrame(animFrameRef.current);
      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }
      analyserRef.current = null;
    };
  }, [isMicOn, streamRef]);

  // Derive final value: if mic is off, always return 0
  return isMicOn ? rawLevel : 0;
}
