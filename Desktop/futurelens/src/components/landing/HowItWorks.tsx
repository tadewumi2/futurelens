"use client";

import { useEffect, useRef } from "react";
import styles from "./HowItWorks.module.css";

const steps = [
  {
    number: "01",
    title: "Share Your Story",
    description:
      "Tell us about your career, habits, finances, and goals — through text, voice, or uploaded documents. Our AI builds your complete profile.",
    icon: (
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
  },
  {
    number: "02",
    title: "AI Simulates Your Futures",
    description:
      "Five specialized agents research real salary data, health statistics, and financial projections to construct three distinct future-self personas.",
    icon: (
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="12" r="3" />
        <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
      </svg>
    ),
  },
  {
    number: "03",
    title: "Have the Conversation",
    description:
      "Pick your 1-year, 5-year, or 10-year self and start a real-time voice call. Ask anything. Your future self answers with data-grounded insights.",
    icon: (
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
        <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
        <line x1="12" y1="19" x2="12" y2="23" />
        <line x1="8" y1="23" x2="16" y2="23" />
      </svg>
    ),
  },
];

export default function HowItWorks() {
  const cardsRef = useRef<HTMLDivElement[]>([]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const el = entry.target as HTMLElement;
            const delay = parseInt(el.dataset.delay || "0", 10);
            setTimeout(() => {
              el.classList.add(styles.visible);
            }, delay);
            observer.unobserve(el);
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -50px 0px" }
    );

    cardsRef.current.forEach((card) => {
      if (card) observer.observe(card);
    });

    return () => observer.disconnect();
  }, []);

  return (
    <section className={styles.section} id="how-it-works">
      <div className={styles.header}>
        <span className={styles.label}>How It Works</span>
        <h2 className={styles.title}>Three phases. One future.</h2>
      </div>

      <div className={styles.grid}>
        {steps.map((step, i) => (
          <div
            key={step.number}
            className={styles.card}
            data-delay={i * 150}
            ref={(el) => {
              if (el) cardsRef.current[i] = el;
            }}
          >
            <div className={styles.number}>{step.number}</div>
            <div className={styles.icon}>{step.icon}</div>
            <h3>{step.title}</h3>
            <p>{step.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
