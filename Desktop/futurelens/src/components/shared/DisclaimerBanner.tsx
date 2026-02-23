"use client";

import { useState } from "react";
import { getDisclaimers } from "@/lib/safety";

interface Props {
  context: "simulation" | "voice" | "roadmap" | "whatif";
  /** Extra disclaimers from output validation */
  extra?: string[];
}

export default function DisclaimerBanner({ context, extra }: Props) {
  const [expanded, setExpanded] = useState(false);
  const disclaimers = [...getDisclaimers(context), ...(extra || [])];

  if (disclaimers.length === 0) return null;

  return (
    <div
      style={{
        padding: expanded ? "1rem 1.25rem" : "0.65rem 1.25rem",
        borderRadius: 12,
        border: "1px solid rgba(255,183,77,0.12)",
        background: "rgba(255,183,77,0.03)",
        fontSize: "0.78rem",
        color: "var(--text-muted)",
        lineHeight: 1.6,
        marginBottom: "1.5rem",
        transition: "all 0.3s ease",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
          cursor: "pointer",
        }}
        onClick={() => setExpanded(!expanded)}
      >
        <span style={{ fontSize: "0.9rem" }}>⚠️</span>
        <span style={{ fontWeight: 500, color: "var(--text-secondary)" }}>
          AI Simulation Disclaimer
        </span>
        <span
          style={{
            marginLeft: "auto",
            fontSize: "0.7rem",
            opacity: 0.6,
            transform: expanded ? "rotate(180deg)" : "rotate(0)",
            transition: "transform 0.2s ease",
          }}
        >
          ▼
        </span>
      </div>
      {expanded && (
        <div style={{ marginTop: "0.75rem" }}>
          {disclaimers.map((d, i) => (
            <p key={i} style={{ marginBottom: i < disclaimers.length - 1 ? "0.5rem" : 0 }}>
              {d}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}
