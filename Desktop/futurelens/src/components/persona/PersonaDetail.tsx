"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import type { FuturePersona, SimulationResult } from "@/lib/types/simulation";
import { getPersonaByTimeframe, buildPersonaSystemPrompt } from "@/lib/persona";
import styles from "./PersonaDetail.module.css";

export default function PersonaDetail() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const timeframe = searchParams.get("t") || "1-year";

  const [persona, setPersona] = useState<FuturePersona | null>(null);
  const [simulation, setSimulation] = useState<SimulationResult | null>(null);
  const [profileName, setProfileName] = useState("");

  useEffect(() => {
    const simStored = sessionStorage.getItem("futurelens_simulation");
    const profileStored = sessionStorage.getItem("futurelens_profile");

    if (!simStored) {
      router.push("/onboarding");
      return;
    }

    const sim: SimulationResult = JSON.parse(simStored);
    setSimulation(sim);
    setPersona(getPersonaByTimeframe(sim, timeframe));

    if (profileStored) {
      const profile = JSON.parse(profileStored);
      setProfileName(profile.name || "");
    }
  }, [timeframe, router]);

  if (!persona || !simulation) {
    return (
      <div className={styles.container}>
        <p style={{ color: "var(--text-muted)" }}>Loading persona...</p>
      </div>
    );
  }

  const variantClass =
    timeframe === "1-year" ? "yr1" : timeframe === "5-year" ? "yr5" : "yr10";

  const timeframeLabel =
    timeframe === "1-year"
      ? "1 Year From Now"
      : timeframe === "5-year"
        ? "5 Years From Now"
        : "10 Years From Now";

  const handleStartConversation = () => {
    // Build and store the system prompt for the voice conversation
    const systemPrompt = buildPersonaSystemPrompt(persona, profileName, simulation);
    sessionStorage.setItem("futurelens_persona_prompt", systemPrompt);
    sessionStorage.setItem("futurelens_selected_persona", timeframe);
    router.push("/conversation");
  };

  const allTimeframes = ["1-year", "5-year", "10-year"];

  return (
    <div className={styles.container}>
      <div
        className={`${styles.ambient} ${styles.ambient1}`}
        style={{
          background:
            timeframe === "1-year"
              ? "rgba(0,229,255,0.04)"
              : timeframe === "5-year"
                ? "rgba(124,77,255,0.04)"
                : "rgba(255,107,157,0.04)",
        }}
      />
      <div className={`${styles.ambient} ${styles.ambient2}`} />

      <div className={styles.content}>
        <Link href="/simulation" className={styles.backLink}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
          Back to personas
        </Link>

        {/* Hero Card */}
        <div className={`${styles.heroCard} ${styles[variantClass]}`}>
          <div className={styles.heroTop}>
            <div className={styles.heroInfo}>
              <div className={styles.timeframeBadge}>{timeframeLabel}</div>
              <h1 className={styles.personaName}>{persona.name}</h1>
              <p className={styles.personaAge}>
                {profileName}, age {persona.age}
              </p>
            </div>
            <div className={styles.avatarCircle}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </div>
          </div>

          <div className={styles.openingLine}>
            &ldquo;{persona.openingLine}&rdquo;
          </div>
        </div>

        {/* Detail Grid */}
        <div className={styles.detailGrid}>
          {/* Personality & Tone */}
          <div className={`${styles.detailCard} ${styles.fullWidth}`}>
            <div className={styles.detailLabel}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /></svg>
              Personality &amp; Tone
            </div>
            <p className={styles.detailContent}>{persona.personality}</p>
            <p className={styles.detailContent} style={{ marginTop: "0.75rem" }}>
              <strong style={{ color: "var(--warm-white)", fontWeight: 500 }}>Emotional state:</strong>{" "}
              {persona.emotionalTone}
            </p>
            <p className={styles.detailContent} style={{ marginTop: "0.5rem" }}>
              <strong style={{ color: "var(--warm-white)", fontWeight: 500 }}>Speaking style:</strong>{" "}
              {persona.speakingStyle}
            </p>
          </div>

          {/* Life Status */}
          <div className={styles.detailCard}>
            <div className={styles.detailLabel}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="7" width="20" height="14" rx="2" ry="2" /><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" /></svg>
              Life Status
            </div>
            <ul className={styles.detailList}>
              <li><strong style={{ color: "var(--warm-white)", fontWeight: 500 }}>Career:</strong> {persona.lifeStatus.career}</li>
              <li><strong style={{ color: "var(--warm-white)", fontWeight: 500 }}>Financial:</strong> {persona.lifeStatus.financial}</li>
              <li><strong style={{ color: "var(--warm-white)", fontWeight: 500 }}>Health:</strong> {persona.lifeStatus.health}</li>
              <li><strong style={{ color: "var(--warm-white)", fontWeight: 500 }}>Relationships:</strong> {persona.lifeStatus.relationships}</li>
              <li><strong style={{ color: "var(--warm-white)", fontWeight: 500 }}>Location:</strong> {persona.lifeStatus.location}</li>
            </ul>
          </div>

          {/* Key Memories */}
          <div className={styles.detailCard}>
            <div className={styles.detailLabel}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3" /><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42" /></svg>
              Key Memories
            </div>
            <ul className={styles.detailList}>
              {persona.keyMemories.map((m, i) => (
                <li key={i}>{m}</li>
              ))}
            </ul>
          </div>

          {/* Proud Of */}
          <div className={styles.detailCard}>
            <div className={styles.detailLabel}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
              Proud Of
            </div>
            <ul className={styles.detailList}>
              {persona.proudOf.map((p, i) => (
                <li key={i}>{p}</li>
              ))}
            </ul>
          </div>

          {/* Regrets */}
          <div className={styles.detailCard}>
            <div className={styles.detailLabel}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
              Regrets
            </div>
            <ul className={styles.detailList}>
              {persona.regrets.map((r, i) => (
                <li key={i}>{r}</li>
              ))}
            </ul>
          </div>

          {/* Advice */}
          <div className={`${styles.detailCard} ${styles.fullWidth}`}>
            <div className={styles.detailLabel}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
              What they want to tell you
            </div>
            <ul className={styles.detailList}>
              {persona.adviceToPresent.map((a, i) => (
                <li key={i}>{a}</li>
              ))}
            </ul>
          </div>
        </div>

        {/* CTA */}
        <div className={styles.ctaSection}>
          <button className={styles.ctaBtn} onClick={handleStartConversation}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
              <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
              <line x1="12" y1="19" x2="12" y2="23" />
              <line x1="8" y1="23" x2="16" y2="23" />
            </svg>
            <span>Start Voice Conversation</span>
          </button>
          <p className={styles.ctaHint}>
            Your future self will speak using Amazon Nova 2 Sonic
          </p>

          {/* Switch between personas */}
          <div className={styles.switchLinks}>
            {allTimeframes.map((tf) => (
              <Link
                key={tf}
                href={`/persona?t=${tf}`}
                className={`${styles.switchLink} ${tf === timeframe ? styles.active : ""}`}
              >
                {tf === "1-year" ? "1 Year" : tf === "5-year" ? "5 Years" : "10 Years"}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
