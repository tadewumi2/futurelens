"use client";

import type { OnboardingFormData } from "@/lib/types/onboarding";
import styles from "./Onboarding.module.css";

interface Props {
  data: OnboardingFormData;
  onChange: (field: keyof OnboardingFormData, value: string) => void;
}

export default function StepAboutYou({ data, onChange }: Props) {
  return (
    <>
      <div className={styles.formHeader}>
        <div className={styles.formIcon}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
        </div>
        <h2 className={styles.formTitle}>About You</h2>
        <p className={styles.formSubtitle}>Let&apos;s start with the basics so your future self knows who they&apos;re talking to.</p>
      </div>

      <div className={styles.fieldGroup}>
        <div className={styles.fieldRow}>
          <div className={styles.field}>
            <label className={styles.label}>Your Name</label>
            <input
              className={styles.input}
              type="text"
              placeholder="e.g. Tosin"
              value={data.name}
              onChange={(e) => onChange("name", e.target.value)}
            />
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Age</label>
            <input
              className={styles.input}
              type="text"
              placeholder="e.g. 28"
              value={data.age}
              onChange={(e) => onChange("age", e.target.value)}
            />
          </div>
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Where do you live?</label>
          <input
            className={styles.input}
            type="text"
            placeholder="e.g. Winnipeg, Canada"
            value={data.location}
            onChange={(e) => onChange("location", e.target.value)}
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Tell us a bit about your background</label>
          <textarea
            className={styles.textarea}
            placeholder="e.g. I'm a recent grad with a background in English Studies and web development. I moved to Canada two years ago and I'm currently job searching..."
            value={data.background}
            onChange={(e) => onChange("background", e.target.value)}
          />
        </div>
      </div>
    </>
  );
}
