"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { SimulationResult, AgentProgress, AgentName } from "@/lib/types/simulation";
import type { ReactNode } from "react";
import { useSession } from "@/hooks/useSession";
import styles from "./Simulation.module.css";

const AGENT_CONFIG: {
  name: AgentName;
  label: string;
  description: string;
  icon: ReactNode;
}[] = [
  {
    name: "career",
    label: "Career Agent",
    description: "Researching salary trajectories & industry trends",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
        <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
      </svg>
    ),
  },
  {
    name: "financial",
    label: "Financial Agent",
    description: "Modeling savings, investments & net worth projections",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="1" x2="12" y2="23" />
        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
      </svg>
    ),
  },
  {
    name: "wellness",
    label: "Wellness Agent",
    description: "Analyzing health patterns & habit projections",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </svg>
    ),
  },
  {
    name: "lifestyle",
    label: "Lifestyle Agent",
    description: "Projecting relationships, community & life milestones",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  {
    name: "synthesis",
    label: "Synthesis Agent",
    description: "Building your three future-self personas",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3" />
        <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
      </svg>
    ),
  },
];

export default function SimulationRunner() {
  const router = useRouter();
  const { saveSimulation } = useSession();
  const [agentProgress, setAgentProgress] = useState<AgentProgress[]>(
    AGENT_CONFIG.map((a) => ({ agent: a.name, status: "pending" }))
  );
  const [result, setResult] = useState<SimulationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [profileName, setProfileName] = useState("");
  const hasStarted = useRef(false);

  const runSimulation = useCallback(async () => {
    const stored = sessionStorage.getItem("futurelens_profile");
    if (!stored) {
      setError("No profile found. Please complete the onboarding first.");
      return;
    }

    const profile = JSON.parse(stored);
    setProfileName(profile.name || "");

    // Simulate agent progress for the 4 parallel agents
    const domainAgents: AgentName[] = ["career", "financial", "wellness", "lifestyle"];

    // Mark all domain agents as running
    setAgentProgress((prev) =>
      prev.map((a) =>
        domainAgents.includes(a.agent)
          ? { ...a, status: "running", message: "Analyzing..." }
          : a
      )
    );

    // Stagger visual completion of domain agents for better UX
    const staggerComplete = (agent: AgentName, delayMs: number) => {
      setTimeout(() => {
        setAgentProgress((prev) =>
          prev.map((a) =>
            a.agent === agent ? { ...a, status: "completed", message: "Done" } : a
          )
        );
      }, delayMs);
    };

    try {
      // Start the actual API call
      const response = await fetch("/api/simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: stored,
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `Simulation failed (${response.status})`);
      }

      // Stagger domain agent completions for visual effect
      staggerComplete("career", 0);
      staggerComplete("financial", 400);
      staggerComplete("wellness", 800);
      staggerComplete("lifestyle", 1200);

      // Mark synthesis as running
      setTimeout(() => {
        setAgentProgress((prev) =>
          prev.map((a) =>
            a.agent === "synthesis"
              ? { ...a, status: "running", message: "Synthesizing personas..." }
              : a
          )
        );
      }, 1400);

      const data: SimulationResult = await response.json();

      // Mark synthesis complete
      setTimeout(() => {
        setAgentProgress((prev) =>
          prev.map((a) =>
            a.agent === "synthesis" ? { ...a, status: "completed", message: "Done" } : a
          )
        );

        // Store result and show completion
        sessionStorage.setItem("futurelens_simulation", JSON.stringify(data));
        saveSimulation(data).catch(() => {});
        setResult(data);
      }, 2000);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Simulation failed";
      setError(message);
      setAgentProgress((prev) =>
        prev.map((a) =>
          a.status === "running" ? { ...a, status: "error", message } : a
        )
      );
    }
  }, []);

  useEffect(() => {
    if (!hasStarted.current) {
      hasStarted.current = true;
      runSimulation();
    }
  }, [runSimulation]);

  const handleRetry = () => {
    setError(null);
    setResult(null);
    setAgentProgress(AGENT_CONFIG.map((a) => ({ agent: a.name, status: "pending" })));
    hasStarted.current = false;
    runSimulation();
  };

  const handleSelectPersona = (timeframe: string) => {
    sessionStorage.setItem("futurelens_selected_persona", timeframe);
    router.push(`/persona?t=${timeframe}`);
  };

  return (
    <div className={styles.container}>
      <div className={`${styles.ambient} ${styles.ambient1}`} />
      <div className={`${styles.ambient} ${styles.ambient2}`} />

      <div className={styles.content}>
        {!result ? (
          <>
            {/* Portal animation */}
            <div className={styles.portal}>
              <div className={styles.portalRing} />
              <div className={styles.portalRing} />
              <div className={styles.portalRing} />
              <div className={styles.portalCore} />
            </div>

            <h1 className={styles.title}>
              {profileName
                ? `Simulating your futures, ${profileName}`
                : "Simulating your futures"}
            </h1>
            <p className={styles.subtitle}>
              Five AI agents are researching and constructing your future selves
            </p>

            {/* Agent progress */}
            <div className={styles.agentList}>
              {AGENT_CONFIG.map((config) => {
                const progress = agentProgress.find(
                  (a) => a.agent === config.name
                );
                const status = progress?.status || "pending";

                return (
                  <div
                    key={config.name}
                    className={`${styles.agentCard} ${styles[status]}`}
                  >
                    <div className={styles.agentIcon}>{config.icon}</div>
                    <div className={styles.agentInfo}>
                      <div className={styles.agentName}>{config.label}</div>
                      <div className={styles.agentStatus}>
                        {status === "running"
                          ? config.description
                          : status === "completed"
                            ? "Complete"
                            : status === "error"
                              ? progress?.message || "Error"
                              : "Waiting..."}
                      </div>
                    </div>
                    {status === "running" && <div className={styles.spinner} />}
                    {status === "completed" && (
                      <div className={styles.agentCheck}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {error && (
              <div className={styles.errorBox}>
                <p className={styles.errorText}>{error}</p>
                <button className={styles.retryBtn} onClick={handleRetry}>
                  Try Again
                </button>
              </div>
            )}
          </>
        ) : (
          /* ═══ COMPLETION STATE ═══ */
          <div className={styles.completedContent}>
            <div className={styles.portal}>
              <div className={styles.portalRing} />
              <div className={styles.portalRing} />
              <div className={styles.portalRing} />
              <div className={styles.portalCore} />
            </div>

            <h1 className={styles.title}>Your future selves are ready</h1>
            <p className={styles.subtitle}>{result.profileSummary}</p>

            <div className={styles.personaCards}>
              {/* 1-Year */}
              <div
                className={`${styles.personaCard} ${styles.yr1}`}
                onClick={() => handleSelectPersona("1-year")}
              >
                <div className={styles.personaTimeframe}>1 Year</div>
                <div className={styles.personaName}>
                  {result.personas.oneYear.name}
                </div>
                <div className={styles.personaTone}>
                  {result.personas.oneYear.emotionalTone}
                </div>
                <div className={styles.personaOpener}>
                  &ldquo;{result.personas.oneYear.openingLine}&rdquo;
                </div>
              </div>

              {/* 5-Year */}
              <div
                className={`${styles.personaCard} ${styles.yr5}`}
                onClick={() => handleSelectPersona("5-year")}
              >
                <div className={styles.personaTimeframe}>5 Years</div>
                <div className={styles.personaName}>
                  {result.personas.fiveYear.name}
                </div>
                <div className={styles.personaTone}>
                  {result.personas.fiveYear.emotionalTone}
                </div>
                <div className={styles.personaOpener}>
                  &ldquo;{result.personas.fiveYear.openingLine}&rdquo;
                </div>
              </div>

              {/* 10-Year */}
              <div
                className={`${styles.personaCard} ${styles.yr10}`}
                onClick={() => handleSelectPersona("10-year")}
              >
                <div className={styles.personaTimeframe}>10 Years</div>
                <div className={styles.personaName}>
                  {result.personas.tenYear.name}
                </div>
                <div className={styles.personaTone}>
                  {result.personas.tenYear.emotionalTone}
                </div>
                <div className={styles.personaOpener}>
                  &ldquo;{result.personas.tenYear.openingLine}&rdquo;
                </div>
              </div>
            </div>

            <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "1rem" }}>
              Choose a future self to start a voice conversation
            </p>

            <Link href="/onboarding" style={{
              fontSize: "0.8rem",
              color: "var(--text-muted)",
              textDecoration: "none",
            }}>
              ← Re-do onboarding
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
