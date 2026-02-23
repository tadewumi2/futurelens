"use client";

import Link from "next/link";
import styles from "./FinalCTA.module.css";

export default function FinalCTA() {
  return (
    <section className={styles.section} id="start">
      <div className={styles.ambient} />
      <div className={styles.content}>
        <span className={styles.label}>Ready?</span>
        <h2 className={styles.title}>Your future self is waiting.</h2>
        <p className={styles.subtitle}>
          Change your present by hearing from who you&apos;ll become.
        </p>
        <Link href="/onboarding" className={styles.btnPrimary}>
          <span>Start Your Simulation</span>
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="5" y1="12" x2="19" y2="12" />
            <polyline points="12 5 19 12 12 19" />
          </svg>
        </Link>
      </div>
    </section>
  );
}
