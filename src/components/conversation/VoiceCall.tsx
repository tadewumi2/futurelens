"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { io, Socket } from "socket.io-client";
import { useAudioCapture } from "@/hooks/useAudioCapture";
import { useAudioPlayback } from "@/hooks/useAudioPlayback";
import { getTimeframeColor } from "@/lib/persona";
import styles from "./Conversation.module.css";

interface TranscriptEntry {
  id: string;
  role: "USER" | "ASSISTANT";
  text: string;
  timestamp: Date;
}

type ConnectionState = "disconnected" | "connecting" | "connected";
type CallState = "idle" | "connecting" | "active" | "ended";

export default function VoiceCall() {
  const router = useRouter();
  const socketRef = useRef<Socket | null>(null);
  const transcriptEndRef = useRef<HTMLDivElement>(null);

  // State
  const [connectionState, setConnectionState] =
    useState<ConnectionState>("disconnected");
  const [callState, setCallState] = useState<CallState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const [callDuration, setCallDuration] = useState(0);
  const [personaName, setPersonaName] = useState("Future Self");
  const [personaTimeframe, setPersonaTimeframe] = useState("1-year");
  const [accentColor, setAccentColor] = useState("var(--cyan-glow)");
  const [systemPrompt, setSystemPrompt] = useState("");

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Audio hooks
  const { isSpeaking, enqueueAudio, stop: stopPlayback } = useAudioPlayback();

  const handleAudioChunk = useCallback(
    (base64: string) => {
      if (socketRef.current?.connected) {
        socketRef.current.emit("voice:audioChunk", { audio: base64 });
      }
    },
    []
  );

  const {
    isCapturing,
    isMuted,
    start: startCapture,
    stop: stopCapture,
    toggleMute,
  } = useAudioCapture(handleAudioChunk);

  // Load persona data from session
  useEffect(() => {
    const prompt = sessionStorage.getItem("futurelens_persona_prompt");
    const timeframe =
      sessionStorage.getItem("futurelens_selected_persona") || "1-year";
    const simStored = sessionStorage.getItem("futurelens_simulation");

    if (!prompt || !simStored) {
      router.push("/onboarding");
      return;
    }

    setSystemPrompt(prompt);
    setPersonaTimeframe(timeframe);
    setAccentColor(getTimeframeColor(timeframe));

    // Get persona name from simulation data
    try {
      const sim = JSON.parse(simStored);
      const key =
        timeframe === "1-year"
          ? "oneYear"
          : timeframe === "5-year"
            ? "fiveYear"
            : "tenYear";
      setPersonaName(sim.personas[key]?.name || "Future Self");
    } catch {
      setPersonaName("Future Self");
    }
  }, [router]);

  // Connect Socket.IO
  useEffect(() => {
    const socket = io({ transports: ["websocket"] });
    socketRef.current = socket;

    socket.on("connect", () => {
      setConnectionState("connected");
      console.log("[Socket.IO] Connected");
    });

    socket.on("disconnect", () => {
      setConnectionState("disconnected");
      setCallState("idle");
      console.log("[Socket.IO] Disconnected");
    });

    socket.on("connect_error", () => {
      setConnectionState("disconnected");
    });

    // Voice events
    socket.on("voice:started", () => {
      setCallState("active");
      setError(null);
    });

    socket.on("voice:audio", (data: { audio: string }) => {
      enqueueAudio(data.audio);
    });

    socket.on("voice:transcript", (data: { text: string; role: string }) => {
      const role = data.role as "USER" | "ASSISTANT";
      setTranscript((prev) => {
        // Aggregate consecutive same-role entries
        const last = prev[prev.length - 1];
        if (last && last.role === role) {
          return [
            ...prev.slice(0, -1),
            { ...last, text: last.text + " " + data.text },
          ];
        }
        return [
          ...prev,
          {
            id: Date.now().toString() + Math.random(),
            role,
            text: data.text,
            timestamp: new Date(),
          },
        ];
      });
    });

    socket.on("voice:error", (data: { error: string }) => {
      setError(data.error);
      setCallState("idle");
    });

    socket.on("voice:ended", () => {
      setCallState("ended");
    });

    setConnectionState("connecting");

    return () => {
      socket.disconnect();
    };
  }, [enqueueAudio]);

  // Auto-scroll transcript
  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [transcript]);

  // Call timer
  useEffect(() => {
    if (callState === "active") {
      setCallDuration(0);
      timerRef.current = setInterval(() => {
        setCallDuration((d) => d + 1);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [callState]);

  // ─── Actions ───
  const startCall = async () => {
    if (!socketRef.current?.connected || !systemPrompt) return;

    setError(null);
    setCallState("connecting");
    setTranscript([]);

    try {
      await startCapture();
      socketRef.current.emit("voice:start", {
        systemPrompt,
        voiceId: "matthew",
      });
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Failed to start call";
      setError(msg);
      setCallState("idle");
    }
  };

  const endCall = async () => {
    stopCapture();
    stopPlayback();
    socketRef.current?.emit("voice:stop");
    setCallState("ended");

    // Store transcript for roadmap page
    sessionStorage.setItem(
      "futurelens_transcript",
      JSON.stringify(transcript)
    );
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
      .toString()
      .padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  // Determine visual state
  const voiceState = isSpeaking ? "speaking" : isCapturing ? "listening" : "idle";
  const timeframeLabel =
    personaTimeframe === "1-year"
      ? "1 Year"
      : personaTimeframe === "5-year"
        ? "5 Years"
        : "10 Years";

  // Generate waveform bars
  const waveBars = Array.from({ length: 24 }, (_, i) => {
    const h =
      voiceState === "speaking"
        ? 8 + Math.sin(Date.now() / 100 + i * 0.5) * 14
        : voiceState === "listening"
          ? 4 + Math.sin(Date.now() / 200 + i * 0.3) * 6
          : 4;
    return h;
  });

  return (
    <div className={styles.container}>
      <div
        className={`${styles.ambient} ${styles.ambient1}`}
        style={{ background: `${accentColor}11` }}
      />
      <div
        className={`${styles.ambient} ${styles.ambient2}`}
        style={{ background: "rgba(124,77,255,0.04)" }}
      />

      <Link
        href={`/persona?t=${personaTimeframe}`}
        className={styles.backLink}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="19" y1="12" x2="5" y2="12" />
          <polyline points="12 19 5 12 12 5" />
        </svg>
        Back
      </Link>

      <div className={styles.content}>
        {/* Avatar */}
        <div className={styles.avatar}>
          <div
            className={`${styles.avatarRing} ${callState === "active" ? styles.active : ""}`}
            style={{ borderColor: callState === "active" ? `${accentColor}25` : undefined }}
          />
          <div
            className={`${styles.avatarRing} ${callState === "active" ? styles.active : ""}`}
          />
          <div className={`${styles.avatarRing} ${callState === "active" ? styles.active : ""}`} />
          <div className={`${styles.avatarCore} ${styles[voiceState]}`}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </div>
        </div>

        {/* Persona Info */}
        <div className={styles.personaInfo}>
          <h1 className={styles.personaName}>{personaName}</h1>
          <p
            className={styles.personaTimeframe}
            style={{ color: accentColor }}
          >
            {timeframeLabel} From Now
          </p>
          <p
            className={`${styles.callStatus} ${callState === "active" ? styles.active : ""}`}
          >
            <span
              className={`${styles.connectionDot} ${
                connectionState === "connected"
                  ? styles.connected
                  : connectionState === "connecting"
                    ? styles.connecting
                    : styles.disconnected
              }`}
            />
            {callState === "idle"
              ? "Ready to call"
              : callState === "connecting"
                ? "Connecting..."
                : callState === "active"
                  ? voiceState === "speaking"
                    ? "Speaking..."
                    : "Listening..."
                  : "Call ended"}
          </p>
        </div>

        {/* Waveform */}
        <div
          className={`${styles.waveform} ${callState === "active" ? styles.visible : ""}`}
        >
          {waveBars.map((h, i) => (
            <div
              key={i}
              className={styles.waveBar}
              style={{
                height: `${h}px`,
                background:
                  voiceState === "speaking"
                    ? accentColor
                    : "rgba(0,229,255,0.3)",
              }}
            />
          ))}
        </div>

        {/* Error */}
        {error && <div className={styles.error}>{error}</div>}

        {/* Transcript */}
        {transcript.length > 0 && (
          <div className={styles.transcript}>
            {transcript.map((entry) => (
              <div key={entry.id} className={styles.transcriptEntry}>
                <div
                  className={`${styles.transcriptRole} ${
                    entry.role === "USER" ? styles.user : styles.assistant
                  }`}
                >
                  {entry.role === "USER" ? "You" : personaName}
                </div>
                <div className={styles.transcriptText}>{entry.text}</div>
              </div>
            ))}
            <div ref={transcriptEndRef} />
          </div>
        )}

        {/* Controls */}
        <div className={styles.controls}>
          {callState === "active" && (
            <button
              className={`${styles.muteBtn} ${isMuted ? styles.muted : ""}`}
              onClick={toggleMute}
              aria-label={isMuted ? "Unmute" : "Mute"}
            >
              {isMuted ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="1" y1="1" x2="23" y2="23" />
                  <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6" />
                  <path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2c0 .87-.16 1.7-.45 2.47" />
                  <line x1="12" y1="19" x2="12" y2="23" />
                  <line x1="8" y1="23" x2="16" y2="23" />
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                  <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                  <line x1="12" y1="19" x2="12" y2="23" />
                  <line x1="8" y1="23" x2="16" y2="23" />
                </svg>
              )}
            </button>
          )}

          {callState === "active" && (
            <span className={styles.timer}>{formatTime(callDuration)}</span>
          )}

          {callState === "idle" || callState === "ended" ? (
            <button
              className={`${styles.callBtn} ${styles.start}`}
              onClick={startCall}
              disabled={connectionState !== "connected" || !systemPrompt}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
              </svg>
            </button>
          ) : callState === "connecting" ? (
            <button
              className={`${styles.callBtn} ${styles.start}`}
              disabled
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ animation: "spin 1s linear infinite" }}>
                <path d="M21 12a9 9 0 11-6.219-8.56" />
              </svg>
            </button>
          ) : (
            <button
              className={`${styles.callBtn} ${styles.end}`}
              onClick={endCall}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 9c-1.6 0-3.15.25-4.6.72v3.1c0 .39-.23.74-.56.9-.98.49-1.87 1.12-2.66 1.85-.18.18-.43.28-.7.28-.28 0-.53-.11-.71-.29L.29 13.08a.956.956 0 010-1.36C3.69 8.68 7.62 7 12 7s8.31 1.68 11.71 4.72c.18.18.29.44.29.71 0 .28-.11.53-.29.71l-2.48 2.48c-.18.18-.43.29-.71.29-.27 0-.52-.11-.7-.28-.79-.73-1.68-1.36-2.66-1.85a.991.991 0 01-.56-.9v-3.1C15.15 9.25 13.6 9 12 9z" />
              </svg>
            </button>
          )}

          {callState === "active" && (
            <button
              className={styles.muteBtn}
              onClick={endCall}
              aria-label="End call"
              style={{ borderColor: "rgba(255,77,77,0.2)" }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ff6b6b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          )}
        </div>

        {callState === "ended" && transcript.length > 0 && (
          <Link
            href="/roadmap"
            style={{
              marginTop: "2rem",
              padding: "0.7rem 1.5rem",
              borderRadius: 100,
              background: "linear-gradient(135deg, var(--cyan-glow), var(--cyan-dim))",
              color: "var(--bg-deep)",
              textDecoration: "none",
              fontWeight: 600,
              fontSize: "0.9rem",
              display: "inline-flex",
              alignItems: "center",
              gap: "0.5rem",
            }}
          >
            View Life Roadmap
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </Link>
        )}
      </div>
    </div>
  );
}
