"use client";

import { useEffect, useRef } from "react";
import styles from "./FutureSelves.module.css";

const personas = [
  {
    year: "1 Year From Now",
    title: "The Catalyst",
    trait: "Encouraging but urgent",
    quote:
      "\u201CYou\u2019re closer than you think \u2014 but that one habit you keep putting off? This is the year it either builds your foundation or cracks it.\u201D",
    variant: "yr1" as const,
  },
  {
    year: "5 Years From Now",
    title: "The Architect",
    trait: "Confident and reflective",
    quote:
      "\u201CI remember being where you are. The choice you\u2019re agonizing over right now? It mattered \u2014 but not in the way you expect.\u201D",
    variant: "yr5" as const,
  },
  {
    year: "10 Years From Now",
    title: "The Sage",
    trait: "Wise with quiet weight",
    quote:
      "\u201CThere are things I wish I could tell you that would save you years. Let\u2019s start with the most important one.\u201D",
    variant: "yr10" as const,
  },
];

export default function FutureSelves() {
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
    <section className={styles.section} id="futures">
      <div className={styles.header}>
        <span className={styles.label}>Meet Your Future Selves</span>
        <h2 className={styles.title}>Three timelines. Three voices.</h2>
      </div>

      <div className={styles.grid}>
        {personas.map((persona, i) => (
          <div
            key={persona.variant}
            className={`${styles.card} ${styles[persona.variant]}`}
            data-delay={i * 150}
            ref={(el) => {
              if (el) cardsRef.current[i] = el;
            }}
          >
            <div className={styles.year}>{persona.year}</div>
            <h3 className={styles.personaTitle}>{persona.title}</h3>
            <p className={styles.trait}>{persona.trait}</p>
            <p className={styles.quote}>{persona.quote}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
