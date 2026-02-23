"use client";

import type { OnboardingFormData } from "@/lib/types/onboarding";
import styles from "./Onboarding.module.css";

interface Props {
  data: OnboardingFormData;
  onChange: (field: keyof OnboardingFormData, value: string) => void;
}

export default function StepCareerFinance({ data, onChange }: Props) {
  return (
    <>
      <div className={styles.formHeader}>
        <div className={styles.formIcon}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
            <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
          </svg>
        </div>
        <h2 className={styles.formTitle}>Career &amp; Finance</h2>
        <p className={styles.formSubtitle}>Where you are now professionally and financially — this grounds your future projections in reality.</p>
      </div>

      <div className={styles.fieldGroup}>
        <div className={styles.fieldRow}>
          <div className={styles.field}>
            <label className={styles.label}>Current Role / Occupation</label>
            <input
              className={styles.input}
              type="text"
              placeholder="e.g. Full Stack Developer"
              value={data.currentRole}
              onChange={(e) => onChange("currentRole", e.target.value)}
            />
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Industry</label>
            <input
              className={styles.input}
              type="text"
              placeholder="e.g. Technology"
              value={data.industry}
              onChange={(e) => onChange("industry", e.target.value)}
            />
          </div>
        </div>

        <div className={styles.fieldRow}>
          <div className={styles.field}>
            <label className={styles.label}>Years of Experience</label>
            <select
              className={styles.select}
              value={data.yearsExperience}
              onChange={(e) => onChange("yearsExperience", e.target.value)}
            >
              <option value="">Select...</option>
              <option value="0-1">0–1 years</option>
              <option value="2-4">2–4 years</option>
              <option value="5-9">5–9 years</option>
              <option value="10+">10+ years</option>
            </select>
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Income Range</label>
            <select
              className={styles.select}
              value={data.incomeRange}
              onChange={(e) => onChange("incomeRange", e.target.value)}
            >
              <option value="">Select...</option>
              <option value="under-30k">Under $30k</option>
              <option value="30-50k">$30k–$50k</option>
              <option value="50-80k">$50k–$80k</option>
              <option value="80-120k">$80k–$120k</option>
              <option value="120k+">$120k+</option>
              <option value="prefer-not">Prefer not to say</option>
            </select>
          </div>
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Key Skills (comma separated)</label>
          <input
            className={styles.input}
            type="text"
            placeholder="e.g. React, Node.js, Python, Project Management"
            value={data.skills}
            onChange={(e) => onChange("skills", e.target.value)}
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Financial Goals</label>
          <textarea
            className={styles.textarea}
            placeholder="e.g. Pay off student loans in 3 years, build a 6-month emergency fund, start investing..."
            value={data.financialGoals}
            onChange={(e) => onChange("financialGoals", e.target.value)}
          />
        </div>
      </div>
    </>
  );
}
