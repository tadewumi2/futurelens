"use client";

import { useState, useRef, useCallback } from "react";

/**
 * Captures microphone audio, resamples to 16kHz mono PCM,
 * and calls onAudioChunk with base64-encoded PCM data.
 */
export function useAudioCapture(onAudioChunk: (base64: string) => void) {
  const [isCapturing, setIsCapturing] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const contextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const workletRef = useRef<AudioWorkletNode | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);

  const start = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 16000,
          channelCount: 1,
        },
      });

      streamRef.current = stream;

      const audioContext = new AudioContext({ sampleRate: 16000 });
      contextRef.current = audioContext;

      const source = audioContext.createMediaStreamSource(stream);

      // Use ScriptProcessorNode for wide browser compat
      // (AudioWorklet would be ideal for production)
      const processor = audioContext.createScriptProcessor(2048, 1, 1);
      processorRef.current = processor;

      processor.onaudioprocess = (e) => {
        if (isMutedRef.current) return;

        const inputData = e.inputBuffer.getChannelData(0);

        // Convert float32 [-1, 1] to int16 PCM
        const pcm16 = new Int16Array(inputData.length);
        for (let i = 0; i < inputData.length; i++) {
          const s = Math.max(-1, Math.min(1, inputData[i]));
          pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
        }

        // Encode as base64
        const bytes = new Uint8Array(pcm16.buffer);
        let binary = "";
        for (let i = 0; i < bytes.length; i++) {
          binary += String.fromCharCode(bytes[i]);
        }
        const base64 = btoa(binary);
        onAudioChunk(base64);
      };

      source.connect(processor);
      processor.connect(audioContext.destination);

      setIsCapturing(true);
    } catch {
      throw new Error("Microphone access denied");
    }
  }, [onAudioChunk]);

  // Use ref for muted state so the processor callback reads the latest value
  const isMutedRef = useRef(false);

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => {
      isMutedRef.current = !prev;
      return !prev;
    });
  }, []);

  const stop = useCallback(() => {
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }
    if (contextRef.current) {
      contextRef.current.close();
      contextRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setIsCapturing(false);
  }, []);

  return { isCapturing, isMuted, start, stop, toggleMute };
}
