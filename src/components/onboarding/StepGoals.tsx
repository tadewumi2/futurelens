"use client";

import type { OnboardingFormData } from "@/lib/types/onboarding";
import { useVoiceCapture, formatDuration } from "@/hooks/useVoiceCapture";
import styles from "./Onboarding.module.css";

interface Props {
  data: OnboardingFormData;
  onChange: (field: keyof OnboardingFormData, value: string) => void;
  onAudioCapture: (blob: Blob | null) => void;
}

export default function StepGoals({ data, onChange, onAudioCapture }: Props) {
  const [voiceState, voiceActions] = useVoiceCapture();

  const handleToggleRecord = async () => {
    if (voiceState.isRecording) {
      voiceActions.stopRecording();
    } else {
      voiceActions.resetRecording();
      await voiceActions.startRecording();
    }
  };

  const handleReset = () => {
    voiceActions.resetRecording();
    onAudioCapture(null);
  };

  // Notify parent when recording completes
  if (voiceState.audioBlob) {
    onAudioCapture(voiceState.audioBlob);
  }

  return (
    <>
      <div className={styles.formHeader}>
        <div className={styles.formIcon}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
            <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
            <line x1="12" y1="19" x2="12" y2="23" />
            <line x1="8" y1="23" x2="16" y2="23" />
          </svg>
        </div>
        <h2 className={styles.formTitle}>Goals &amp; Aspirations</h2>
        <p className={styles.formSubtitle}>
          Tell us where you want to be. Type your goals below, or record a voice message — sometimes it&apos;s easier to just talk.
        </p>
      </div>

      <div className={styles.fieldGroup}>
        <div className={styles.field}>
          <label className={styles.label}>Career Goals</label>
          <textarea
            className={styles.textarea}
            placeholder="e.g. Land a full-time dev role within 6 months, eventually lead a team, start freelancing on the side..."
            value={data.careerGoals}
            onChange={(e) => onChange("careerGoals", e.target.value)}
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Health &amp; Wellness Goals</label>
          <textarea
            className={styles.textarea}
            placeholder="e.g. Exercise 4x/week, improve sleep schedule, reduce screen time, cook at home more..."
            value={data.healthGoals}
            onChange={(e) => onChange("healthGoals", e.target.value)}
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Life &amp; Lifestyle Goals</label>
          <textarea
            className={styles.textarea}
            placeholder="e.g. Travel to Japan, buy a home in 5 years, build a strong local community, learn Spanish..."
            value={data.lifestyleGoals}
            onChange={(e) => onChange("lifestyleGoals", e.target.value)}
          />
        </div>

        {/* Voice Recorder */}
        <div className={styles.voiceRecorder}>
          <div className={styles.voiceHeader}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
              <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
            </svg>
            Voice Message (optional)
          </div>
          <p className={styles.voiceHint}>
            Record anything else you want your future self to know — fears, hopes, context that&apos;s hard to type. Speak freely.
          </p>

          <div className={styles.voiceControls}>
            <button
              type="button"
              className={`${styles.recordBtn} ${voiceState.isRecording ? styles.recording : ""}`}
              onClick={handleToggleRecord}
              aria-label={voiceState.isRecording ? "Stop recording" : "Start recording"}
            >
              {voiceState.isRecording ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <rect x="6" y="6" width="12" height="12" rx="2" />
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <circle cx="12" cy="12" r="6" />
                </svg>
              )}
            </button>

            {voiceState.isRecording && (
              <>
                <button
                  type="button"
                  className={styles.controlBtn}
                  onClick={voiceState.isPaused ? voiceActions.resumeRecording : voiceActions.pauseRecording}
                  aria-label={voiceState.isPaused ? "Resume" : "Pause"}
                >
                  {voiceState.isPaused ? (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                      <polygon points="5 3 19 12 5 21 5 3" />
                    </svg>
                  ) : (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                      <rect x="6" y="4" width="4" height="16" />
                      <rect x="14" y="4" width="4" height="16" />
                    </svg>
                  )}
                </button>
                <span className={styles.voiceDuration}>
                  {formatDuration(voiceState.duration)}
                </span>
              </>
            )}

            <span
              className={`${styles.voiceStatus} ${voiceState.isRecording ? styles.recording : ""}`}
            >
              {voiceState.isRecording
                ? voiceState.isPaused
                  ? "Paused"
                  : "Recording..."
                : voiceState.audioUrl
                  ? "Recording saved"
                  : "Ready to record"}
            </span>
          </div>

          {voiceState.audioUrl && !voiceState.isRecording && (
            <div className={styles.audioPlayback}>
              <audio controls src={voiceState.audioUrl} />
              <button type="button" className={styles.resetBtn} onClick={handleReset}>
                Re-record
              </button>
            </div>
          )}

          {voiceState.error && (
            <div className={styles.voiceError}>{voiceState.error}</div>
          )}
        </div>
      </div>
    </>
  );
}
