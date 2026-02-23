"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import styles from "./Hero.module.css";

export default function Hero() {
  const portalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let ticking = false;

    const handleMouseMove = (e: MouseEvent) => {
      if (!ticking) {
        requestAnimationFrame(() => {
          if (portalRef.current) {
            const x = (e.clientX / window.innerWidth - 0.5) * 15;
            const y = (e.clientY / window.innerHeight - 0.5) * 15;
            portalRef.current.style.transform = `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`;
          }
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return (
    <section className={styles.hero}>
      {/* Ambient gradient blobs */}
      <div className={`${styles.ambient} ${styles.ambient1}`} />
      <div className={`${styles.ambient} ${styles.ambient2}`} />

      {/* Starfield */}
      <div className={styles.starfield} />

      {/* Portal glow */}
      <div className={styles.portalGlow} ref={portalRef}>
        <div className={styles.ring} />
        <div className={styles.ring} />
        <div className={styles.ring} />
        <div className={styles.ring} />
        <div className={styles.core} />
      </div>

      {/* Content */}
      <div className={styles.content}>
        <div className={styles.eyebrow}>
          <span className={styles.eyebrowDot} />
          AI-Powered Life Simulation
        </div>

        <h1 className={styles.title}>
          <span className={styles.line1}>Talk to Your</span>
          <span className={styles.line2}>Future Self</span>
        </h1>

        <p className={styles.subtitle}>
          FutureLens uses real-world data and AI voice technology to create a
          living conversation with who you could become — in 1 year, 5 years,
          or 10.
        </p>

        <div className={styles.actions}>
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
          <a href="#how-it-works" className={styles.btnSecondary}>
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <polygon points="10 8 16 12 10 16 10 8" />
            </svg>
            <span>See How It Works</span>
          </a>
        </div>
      </div>

      {/* Scroll hint */}
      <div className={styles.scrollHint}>
        <span>Explore</span>
        <div className={styles.scrollLine} />
      </div>
    </section>
  );
}
