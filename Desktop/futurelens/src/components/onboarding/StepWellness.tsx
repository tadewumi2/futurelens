"use client";

import type { OnboardingFormData } from "@/lib/types/onboarding";
import styles from "./Onboarding.module.css";

interface Props {
  data: OnboardingFormData;
  onChange: (field: keyof OnboardingFormData, value: string) => void;
}

export default function StepWellness({ data, onChange }: Props) {
  return (
    <>
      <div className={styles.formHeader}>
        <div className={styles.formIcon}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
        </div>
        <h2 className={styles.formTitle}>Wellness &amp; Lifestyle</h2>
        <p className={styles.formSubtitle}>Your habits and social life shape your future more than you think.</p>
      </div>

      <div className={styles.fieldGroup}>
        <div className={styles.fieldRow}>
          <div className={styles.field}>
            <label className={styles.label}>Exercise Frequency</label>
            <select
              className={styles.select}
              value={data.exerciseFrequency}
              onChange={(e) => onChange("exerciseFrequency", e.target.value)}
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
              className={styles.select}
              value={data.sleepQuality}
              onChange={(e) => onChange("sleepQuality", e.target.value)}
            >
              <option value="">Select...</option>
              <option value="poor">Poor (under 5h or restless)</option>
              <option value="fair">Fair (5–6h)</option>
              <option value="good">Good (7–8h)</option>
              <option value="excellent">Excellent (8h+, consistent)</option>
            </select>
          </div>
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Stress Level</label>
          <select
            className={styles.select}
            value={data.stressLevel}
            onChange={(e) => onChange("stressLevel", e.target.value)}
          >
            <option value="">Select...</option>
            <option value="low">Low — I feel balanced</option>
            <option value="moderate">Moderate — manageable but present</option>
            <option value="high">High — it affects my daily life</option>
            <option value="severe">Severe — I'm struggling</option>
          </select>
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Relationships &amp; Social Life</label>
          <textarea
            className={styles.textarea}
            placeholder="e.g. Single, close group of friends, recently moved so still building community..."
            value={data.relationships}
            onChange={(e) => onChange("relationships", e.target.value)}
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Hobbies &amp; Interests</label>
          <input
            className={styles.input}
            type="text"
            placeholder="e.g. Reading, soccer, cooking, gaming, photography"
            value={data.hobbies}
            onChange={(e) => onChange("hobbies", e.target.value)}
          />
        </div>
      </div>
    </>
  );
}
