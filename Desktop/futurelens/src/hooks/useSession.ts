"use client";

import { useState, useEffect, useCallback, useRef } from "react";

const SESSION_KEY = "futurelens_session_id";

/**
 * Generates a stable session ID (persisted in localStorage).
 * Provides helpers to save/load data to DynamoDB via API routes,
 * with sessionStorage as the fast local cache.
 */
export function useSession() {
  const [sessionId, setSessionId] = useState<string>("");
  const [isReady, setIsReady] = useState(false);
  const pendingRef = useRef(false);

  // Initialise or restore session ID
  useEffect(() => {
    let id = localStorage.getItem(SESSION_KEY);
    if (!id) {
      id = `fl-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      localStorage.setItem(SESSION_KEY, id);
    }
    setSessionId(id);
    setIsReady(true);
  }, []);

  // ─── Save Profile ───
  const saveProfile = useCallback(
    async (profile: Record<string, unknown>) => {
      if (!sessionId) return;

      // Always save to sessionStorage (fast)
      sessionStorage.setItem("futurelens_profile", JSON.stringify(profile));

      // Persist to DynamoDB (background)
      try {
        await fetch("/api/session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId, profile }),
        });
      } catch (err) {
        console.warn("[Session] DynamoDB profile save failed:", err);
        // Non-blocking — sessionStorage is the primary store
      }
    },
    [sessionId]
  );

  // ─── Save Simulation ───
  const saveSimulation = useCallback(
    async (
      result: Record<string, unknown> | object,
      options?: { isWhatIf?: boolean; scenarioLabel?: string }
    ) => {
      if (!sessionId) return;

      // sessionStorage (fast)
      if (!options?.isWhatIf) {
        sessionStorage.setItem("futurelens_simulation", JSON.stringify(result));
      }

      // DynamoDB (background)
      try {
        await fetch("/api/session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionId,
            simulation: result,
            isWhatIf: options?.isWhatIf || false,
            scenarioLabel: options?.scenarioLabel,
          }),
        });
      } catch (err) {
        console.warn("[Session] DynamoDB simulation save failed:", err);
      }
    },
    [sessionId]
  );

  // ─── Save Transcript ───
  const saveTranscript = useCallback(
    async (data: {
      personaTimeframe: string;
      personaName: string;
      entries: Array<{ role: string; text: string; timestamp?: string }>;
      duration: number;
    }) => {
      if (!sessionId) return;

      // sessionStorage
      sessionStorage.setItem(
        "futurelens_transcript",
        JSON.stringify(data.entries)
      );

      // DynamoDB
      try {
        await fetch("/api/transcript", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId, ...data }),
        });
      } catch (err) {
        console.warn("[Session] DynamoDB transcript save failed:", err);
      }
    },
    [sessionId]
  );

  // ─── Load Full Session from DynamoDB ───
  const loadSession = useCallback(async () => {
    if (!sessionId) return null;

    try {
      const res = await fetch(`/api/session?id=${sessionId}`);
      if (!res.ok) return null;
      const data = await res.json();

      // Hydrate sessionStorage from DynamoDB if we have data
      if (data.profile?.profile) {
        sessionStorage.setItem(
          "futurelens_profile",
          JSON.stringify(data.profile.profile)
        );
      }
      if (data.latestSimulation?.result) {
        sessionStorage.setItem(
          "futurelens_simulation",
          JSON.stringify(data.latestSimulation.result)
        );
      }

      return data;
    } catch {
      return null;
    }
  }, [sessionId]);

  // ─── Delete Session (GDPR cleanup) ───
  const deleteAllData = useCallback(async () => {
    if (!sessionId) return;

    // Clear local
    sessionStorage.clear();
    localStorage.removeItem(SESSION_KEY);

    // Clear remote
    try {
      await fetch(`/api/session?id=${sessionId}`, { method: "DELETE" });
    } catch {
      // Best effort
    }
  }, [sessionId]);

  return {
    sessionId,
    isReady,
    saveProfile,
    saveSimulation,
    saveTranscript,
    loadSession,
    deleteAllData,
  };
}
