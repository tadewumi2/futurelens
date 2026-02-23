"use client";

import Link from "next/link";

export default function RoadmapPage() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "var(--font-body)",
        color: "var(--warm-white)",
        textAlign: "center",
        padding: "2rem",
      }}
    >
      <div
        style={{
          width: 64,
          height: 64,
          borderRadius: "50%",
          border: "2px solid var(--cyan-glow)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: "1.5rem",
          boxShadow: "0 0 20px rgba(0,229,255,0.2)",
        }}
      >
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--cyan-glow)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
          <circle cx="12" cy="10" r="3" />
        </svg>
      </div>

      <h1
        style={{
          fontFamily: "var(--font-display)",
          fontSize: "2rem",
          fontWeight: 700,
          marginBottom: "0.75rem",
        }}
      >
        Life Roadmap
      </h1>

      <p
        style={{
          color: "var(--text-secondary)",
          maxWidth: 480,
          lineHeight: 1.6,
          marginBottom: "2rem",
        }}
      >
        This is where your visual life roadmap will be generated using Nova Canvas (Epic 6).
        It will show milestones across all three timelines based on your conversation.
      </p>

      <div style={{ display: "flex", gap: "1rem" }}>
        <Link
          href="/simulation"
          style={{
            padding: "0.65rem 1.5rem",
            borderRadius: 100,
            border: "1px solid rgba(255,255,255,0.1)",
            color: "var(--text-secondary)",
            textDecoration: "none",
            fontSize: "0.9rem",
          }}
        >
          ← Back to Personas
        </Link>
      </div>
    </div>
  );
}
