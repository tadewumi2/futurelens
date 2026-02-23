"use client";

import { useRef, useCallback, useState } from "react";

/**
 * Plays back PCM audio received from Nova 2 Sonic.
 * Input: base64-encoded 24kHz 16-bit mono PCM
 * Queues chunks and plays them sequentially.
 */
export function useAudioPlayback() {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const contextRef = useRef<AudioContext | null>(null);
  const queueRef = useRef<AudioBuffer[]>([]);
  const isPlayingRef = useRef(false);
  const nextTimeRef = useRef(0);

  const getContext = useCallback(() => {
    if (!contextRef.current || contextRef.current.state === "closed") {
      contextRef.current = new AudioContext({ sampleRate: 24000 });
    }
    return contextRef.current;
  }, []);

  const enqueueAudio = useCallback(
    (base64Pcm: string) => {
      try {
        const ctx = getContext();

        // Decode base64 to bytes
        const binary = atob(base64Pcm);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
          bytes[i] = binary.charCodeAt(i);
        }

        // Convert Int16 PCM to Float32 for Web Audio
        const int16 = new Int16Array(bytes.buffer);
        const float32 = new Float32Array(int16.length);
        for (let i = 0; i < int16.length; i++) {
          float32[i] = int16[i] / 32768;
        }

        // Create audio buffer
        const buffer = ctx.createBuffer(1, float32.length, 24000);
        buffer.copyToChannel(float32, 0);

        // Schedule playback
        const source = ctx.createBufferSource();
        source.buffer = buffer;
        source.connect(ctx.destination);

        const now = ctx.currentTime;
        const startTime = Math.max(now, nextTimeRef.current);
        source.start(startTime);
        nextTimeRef.current = startTime + buffer.duration;

        if (!isPlayingRef.current) {
          isPlayingRef.current = true;
          setIsSpeaking(true);
        }

        // Detect when playback queue is empty
        source.onended = () => {
          if (ctx.currentTime >= nextTimeRef.current - 0.05) {
            isPlayingRef.current = false;
            setIsSpeaking(false);
          }
        };
      } catch (err) {
        console.error("[AudioPlayback] Error:", err);
      }
    },
    [getContext]
  );

  const stop = useCallback(() => {
    if (contextRef.current && contextRef.current.state !== "closed") {
      contextRef.current.close();
      contextRef.current = null;
    }
    isPlayingRef.current = false;
    nextTimeRef.current = 0;
    queueRef.current = [];
    setIsSpeaking(false);
  }, []);

  return { isSpeaking, enqueueAudio, stop };
}
