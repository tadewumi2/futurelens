"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { SimulationResult } from "@/lib/types/simulation";
import { useSession } from "@/hooks/useSession";
import {
  SCENARIO_PRESETS,
  buildAdjustmentsFromProfile,
  mergeAdjustmentsIntoProfile,
  type WhatIfAdjustments,
  type ComparisonMetric,
} from "@/lib/types/whatif";
import DisclaimerBanner from "@/components/shared/DisclaimerBanner";
import styles from "./WhatIf.module.css";

type Timeframe = "1-year" | "5-year" | "10-year";

export default function WhatIfExplorer() {
  const router = useRouter();
  const { saveSimulation } = useSession();

  const [profile, setProfile] = useState<Record<string, string>>({});
  const [original, setOriginal] = useState<SimulationResult | null>(null);
  const [adjustments, setAdjustments] = useState<WhatIfAdjustments | null>(null);
  const [originalValues, setOriginalValues] = useState<WhatIfAdjustments | null>(null);
  const [scenarioResult, setScenarioResult] = useState<SimulationResult | null>(null);
  const [activePreset, setActivePreset] = useState<string | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTimeframe, setActiveTimeframe] = useState<Timeframe>("5-year");

  useEffect(() => {
    const simStored = sessionStorage.getItem("futurelens_simulation");
    const profileStored = sessionStorage.getItem("futurelens_profile");

    if (!simStored || !profileStored) {
      router.push("/onboarding");
      return;
    }

    const p = JSON.parse(profileStored);
    const sim: SimulationResult = JSON.parse(simStored);
    setProfile(p);
    setOriginal(sim);

    const adj = buildAdjustmentsFromProfile(p);
    setAdjustments(adj);
    setOriginalValues(adj);
  }, [router]);

  const handleFieldChange = (field: keyof WhatIfAdjustments, value: string) => {
    setAdjustments((prev) => (prev ? { ...prev, [field]: value } : prev));
    setActivePreset(null); // clear preset when manually editing
  };

  const handlePreset = (presetId: string) => {
    const preset = SCENARIO_PRESETS.find((p) => p.id === presetId);
    if (!preset || !profile) return;

    setActivePreset(presetId);
    const adj = buildAdjustmentsFromProfile(profile, preset.changes);
    setAdjustments(adj);
    setScenarioResult(null); // clear previous comparison
  };

  const isChanged = (field: keyof WhatIfAdjustments) => {
    if (!adjustments || !originalValues) return false;
    return adjustments[field] !== originalValues[field];
  };

  const hasAnyChanges = () => {
    if (!adjustments || !originalValues) return false;
    return (Object.keys(adjustments) as (keyof WhatIfAdjustments)[]).some(
      (k) => adjustments[k] !== originalValues[k]
    );
  };

  const runScenario = useCallback(async () => {
    if (!adjustments || !profile) return;

    setIsSimulating(true);
    setError(null);
    setScenarioResult(null);

    try {
      const mergedProfile = mergeAdjustmentsIntoProfile(profile, adjustments);
      const res = await fetch("/api/simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(mergedProfile),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Simulation failed (${res.status})`);
      }

      const data: SimulationResult = await res.json();
      setScenarioResult(data);

      // Persist what-if result to DynamoDB
      saveSimulation(data, {
        isWhatIf: true,
        scenarioLabel: activePreset || "Custom scenario",
      }).catch(() => {});
    } catch (err) {
      setError(err instanceof Error ? err.message : "Re-simulation failed");
    }

    setIsSimulating(false);
  }, [adjustments, profile]);

  // ─── Build comparison metrics ───
  const buildMetrics = (tf: Timeframe): ComparisonMetric[] => {
    if (!original || !scenarioResult) return [];

    const key = tf === "1-year" ? "oneYear" : tf === "5-year" ? "fiveYear" : "tenYear";
    const oc = original.agentOutputs.career[key];
    const sc = scenarioResult.agentOutputs.career[key];
    const of2 = original.agentOutputs.financial[key];
    const sf = scenarioResult.agentOutputs.financial[key];
    const ow = original.agentOutputs.wellness[key];
    const sw = scenarioResult.agentOutputs.wellness[key];
    const ol = original.agentOutputs.lifestyle[key];
    const sl = scenarioResult.agentOutputs.lifestyle[key];

    return [
      {
        label: "Role",
        category: "career",
        timeframe: tf,
        original: oc.role || "N/A",
        scenario: sc.role || "N/A",
        direction: sc.role !== oc.role ? "neutral" : "neutral",
      },
      {
        label: "Salary",
        category: "career",
        timeframe: tf,
        original: oc.salary || "N/A",
        scenario: sc.salary || "N/A",
        direction: "neutral",
      },
      {
        label: "Net Worth",
        category: "financial",
        timeframe: tf,
        original: "netWorth" in of2 ? (of2 as Record<string, string>).netWorth || "N/A" : "N/A",
        scenario: "netWorth" in sf ? (sf as Record<string, string>).netWorth || "N/A" : "N/A",
        direction: "neutral",
      },
      {
        label: "Physical Health",
        category: "wellness",
        timeframe: tf,
        original: ow.physicalHealth || "N/A",
        scenario: sw.physicalHealth || "N/A",
        direction: "neutral",
      },
      {
        label: "Mental Health",
        category: "wellness",
        timeframe: tf,
        original: ow.mentalHealth || "N/A",
        scenario: sw.mentalHealth || "N/A",
        direction: "neutral",
      },
      {
        label: "Relationships",
        category: "lifestyle",
        timeframe: tf,
        original: ol.relationships || "N/A",
        scenario: sl.relationships || "N/A",
        direction: "neutral",
      },
    ];
  };

  // Determine direction based on text diff
  const detectDiffs = (metrics: ComparisonMetric[]): ComparisonMetric[] => {
    return metrics.map((m) => {
      let direction: "better" | "worse" | "neutral" = "neutral";
      if (m.original !== m.scenario) {
        direction = m.scenario.length > m.original.length ? "better" : "neutral";
      }
      return { ...m, direction };
    });
  };

  if (!adjustments || !original) {
    return (
      <div className={styles.container}>
        <div style={{ textAlign: "center", color: "var(--text-muted)", paddingTop: "30vh" }}>
          Loading...
        </div>
      </div>
    );
  }

  const metrics = scenarioResult ? detectDiffs(buildMetrics(activeTimeframe)) : [];
  const changedMetrics = metrics.filter((m) => m.original !== m.scenario);

  return (
    <div className={styles.container}>
      <div className={`${styles.ambient} ${styles.ambient1}`} />
      <div className={`${styles.ambient} ${styles.ambient2}`} />

      <div className={styles.content}>
        <Link href="/roadmap" className={styles.backLink}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
          Back to roadmap
        </Link>

        <div className={styles.header}>
          <h1 className={styles.title}>What If...?</h1>
          <p className={styles.subtitle}>
            Adjust your choices and re-simulate to see how different decisions change your future
          </p>
        </div>

        <DisclaimerBanner context="whatif" />

        {/* Preset Scenarios */}
        <div className={styles.presets}>
          {SCENARIO_PRESETS.map((preset) => (
            <div
              key={preset.id}
              className={`${styles.presetCard} ${activePreset === preset.id ? styles.active : ""}`}
              onClick={() => handlePreset(preset.id)}
            >
              <div className={styles.presetEmoji}>{preset.emoji}</div>
              <div className={styles.presetLabel}>{preset.label}</div>
              <div className={styles.presetDesc}>{preset.description}</div>
            </div>
          ))}
        </div>

        {/* Adjustment Panels */}
        <div className={styles.panelWrapper}>
          {/* Career & Finance */}
          <div className={styles.panel}>
            <div className={`${styles.panelTitle} ${styles.career}`}>
              💼 Career &amp; Finance
            </div>
            <div className={styles.fieldGroup}>
              <div className={styles.field}>
                <label className={styles.label}>Role</label>
                <input
                  className={`${styles.input} ${isChanged("currentRole") ? styles.changed : ""}`}
                  value={adjustments.currentRole}
                  onChange={(e) => handleFieldChange("currentRole", e.target.value)}
                  placeholder="e.g. Senior Developer"
                />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Industry</label>
                <input
                  className={`${styles.input} ${isChanged("industry") ? styles.changed : ""}`}
                  value={adjustments.industry}
                  onChange={(e) => handleFieldChange("industry", e.target.value)}
                  placeholder="e.g. Technology"
                />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Income Range</label>
                <select
                  className={`${styles.select} ${isChanged("incomeRange") ? styles.changed : ""}`}
                  value={adjustments.incomeRange}
                  onChange={(e) => handleFieldChange("incomeRange", e.target.value)}
                >
                  <option value="">Select...</option>
                  <option value="under-30k">Under $30k</option>
                  <option value="30-50k">$30k–$50k</option>
                  <option value="50-80k">$50k–$80k</option>
                  <option value="80-120k">$80k–$120k</option>
                  <option value="120k+">$120k+</option>
                </select>
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Career Goals</label>
                <textarea
                  className={`${styles.textarea} ${isChanged("careerGoals") ? styles.changed : ""}`}
                  value={adjustments.careerGoals}
                  onChange={(e) => handleFieldChange("careerGoals", e.target.value)}
                />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Financial Goals</label>
                <textarea
                  className={`${styles.textarea} ${isChanged("financialGoals") ? styles.changed : ""}`}
                  value={adjustments.financialGoals}
                  onChange={(e) => handleFieldChange("financialGoals", e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Wellness & Lifestyle */}
          <div className={styles.panel}>
            <div className={`${styles.panelTitle} ${styles.wellness}`}>
              ❤️ Wellness &amp; Lifestyle
            </div>
            <div className={styles.fieldGroup}>
              <div className={styles.field}>
                <label className={styles.label}>Exercise Frequency</label>
                <select
                  className={`${styles.select} ${isChanged("exerciseFrequency") ? styles.changed : ""}`}
                  value={adjustments.exerciseFrequency}
                  onChange={(e) => handleFieldChange("exerciseFrequency", e.target.value)}
                >
                  <option value="">Select...</option>
                  <option value="rarely">Rarely</option>
                  <option value="1-2-week">1–2 times/week</option>
                  <option value="3-4-week">3–4 times/week</option>
                  <option value="daily">Daily</option>
                </select>
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Sleep Quality</label>
                <select
                  className={`${styles.select} ${isChanged("sleepQuality") ? styles.changed : ""}`}
                  value={adjustments.sleepQuality}
                  onChange={(e) => handleFieldChange("sleepQuality", e.target.value)}
                >
                  <option value="">Select...</option>
                  <option value="poor">Poor</option>
                  <option value="fair">Fair</option>
                  <option value="good">Good</option>
                  <option value="excellent">Excellent</option>
                </select>
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Stress Level</label>
                <select
                  className={`${styles.select} ${isChanged("stressLevel") ? styles.changed : ""}`}
                  value={adjustments.stressLevel}
                  onChange={(e) => handleFieldChange("stressLevel", e.target.value)}
                >
                  <option value="">Select...</option>
                  <option value="low">Low</option>
                  <option value="moderate">Moderate</option>
                  <option value="high">High</option>
                  <option value="severe">Severe</option>
                </select>
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Health Goals</label>
                <textarea
                  className={`${styles.textarea} ${isChanged("healthGoals") ? styles.changed : ""}`}
                  value={adjustments.healthGoals}
                  onChange={(e) => handleFieldChange("healthGoals", e.target.value)}
                />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Hobbies</label>
                <input
                  className={`${styles.input} ${isChanged("hobbies") ? styles.changed : ""}`}
                  value={adjustments.hobbies}
                  onChange={(e) => handleFieldChange("hobbies", e.target.value)}
                />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Lifestyle Goals</label>
                <textarea
                  className={`${styles.textarea} ${isChanged("lifestyleGoals") ? styles.changed : ""}`}
                  value={adjustments.lifestyleGoals}
                  onChange={(e) => handleFieldChange("lifestyleGoals", e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Simulate Button */}
        <div className={styles.simulateSection}>
          {error && <div className={styles.error}>{error}</div>}
          <button
            className={styles.simulateBtn}
            onClick={runScenario}
            disabled={isSimulating || !hasAnyChanges()}
          >
            {isSimulating ? (
              <>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: "spin 1s linear infinite" }}>
                  <path d="M21 12a9 9 0 11-6.219-8.56" />
                </svg>
                Re-simulating...
              </>
            ) : (
              <>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M23 4v6h-6" />
                  <path d="M1 20v-6h6" />
                  <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
                </svg>
                Re-simulate Future
              </>
            )}
          </button>
          {!hasAnyChanges() && (
            <p className={styles.simulateHint}>
              Change at least one variable above to see how it affects your future
            </p>
          )}
        </div>

        {/* ═══ COMPARISON RESULTS ═══ */}
        {scenarioResult && (
          <div className={styles.comparison}>
            <div className={styles.comparisonHeader}>
              <h2 className={styles.comparisonTitle}>Side-by-Side Comparison</h2>
              <p className={styles.comparisonSubtitle}>
                See how your changes ripple through your future
              </p>
            </div>

            <div className={styles.timeframeTabs}>
              {(["1-year", "5-year", "10-year"] as Timeframe[]).map((tf) => (
                <button
                  key={tf}
                  className={`${styles.timeframeTab} ${activeTimeframe === tf ? styles.active : ""}`}
                  onClick={() => setActiveTimeframe(tf)}
                >
                  {tf === "1-year" ? "1 Year" : tf === "5-year" ? "5 Years" : "10 Years"}
                </button>
              ))}
            </div>

            <div className={styles.comparisonGrid}>
              {/* Original */}
              <div className={`${styles.comparisonCard} ${styles.original}`}>
                <div className={styles.cardLabel}>Original Path</div>
                {metrics.map((m, i) => (
                  <div key={i} className={styles.metricRow}>
                    <span className={styles.metricLabel}>{m.label}</span>
                    <span className={styles.metricValue}>{m.original}</span>
                  </div>
                ))}
              </div>

              {/* Scenario */}
              <div className={`${styles.comparisonCard} ${styles.scenario}`}>
                <div className={styles.cardLabel}>New Scenario</div>
                {metrics.map((m, i) => (
                  <div key={i} className={styles.metricRow}>
                    <span className={styles.metricLabel}>{m.label}</span>
                    <span className={styles.metricValue}>{m.scenario}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Key Changes */}
            {changedMetrics.length > 0 && (
              <div className={styles.diffGrid}>
                {changedMetrics.map((m, i) => (
                  <div key={i} className={`${styles.diffItem} ${styles[m.direction]}`}>
                    <span className={styles.diffArrow}>
                      {m.direction === "better"
                        ? "↑"
                        : m.direction === "worse"
                          ? "↓"
                          : "→"}
                    </span>
                    <span className={styles.diffLabel}>
                      <strong>{m.label}:</strong> {m.original} → {m.scenario}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {changedMetrics.length === 0 && (
              <p style={{ textAlign: "center", color: "var(--text-muted)", fontSize: "0.85rem", marginTop: "1rem" }}>
                Both paths project similar outcomes at this timeframe. Try a more dramatic change or check a different timeframe.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
