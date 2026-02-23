"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { SimulationResult } from "@/lib/types/simulation";
import {
  buildRoadmapData,
  CATEGORY_CONFIG,
  type RoadmapData,
  type MilestoneCategory,
  type TimelineNode,
} from "@/lib/types/roadmap";
import DisclaimerBanner from "@/components/shared/DisclaimerBanner";
import styles from "./Roadmap.module.css";

export default function RoadmapView() {
  const router = useRouter();
  const [roadmap, setRoadmap] = useState<RoadmapData | null>(null);
  const [activeFilter, setActiveFilter] = useState<MilestoneCategory | "all">("all");
  const [images, setImages] = useState<Record<number, string>>({});
  const [imagesLoading, setImagesLoading] = useState(false);

  useEffect(() => {
    const simStored = sessionStorage.getItem("futurelens_simulation");
    const profileStored = sessionStorage.getItem("futurelens_profile");

    if (!simStored) {
      router.push("/onboarding");
      return;
    }

    const sim: SimulationResult = JSON.parse(simStored);
    const profile = profileStored ? JSON.parse(profileStored) : {};
    const data = buildRoadmapData(sim, profile.name || "You");
    setRoadmap(data);

    // Generate images in background
    generateImages(data.timeline);
  }, [router]);

  const generateImages = useCallback(async (timeline: TimelineNode[]) => {
    setImagesLoading(true);
    try {
      const prompts = timeline.map((n) => n.imagePrompt);
      const res = await fetch("/api/roadmap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompts }),
      });

      if (res.ok) {
        const data = await res.json();
        const imageMap: Record<number, string> = {};
        data.images?.forEach(
          (img: { index: number; success: boolean; image: string | null }) => {
            if (img.success && img.image) {
              imageMap[img.index] = img.image;
            }
          }
        );
        setImages(imageMap);
      }
    } catch (err) {
      console.error("Image generation failed:", err);
      // Non-critical — roadmap works without images
    }
    setImagesLoading(false);
  }, []);

  if (!roadmap) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          <div className={styles.imageSpinner} />
          <span>Building your roadmap...</span>
        </div>
      </div>
    );
  }

  const filterMilestones = (node: TimelineNode) => {
    if (activeFilter === "all") return node.milestones;
    return node.milestones.filter((m) => m.category === activeFilter);
  };

  return (
    <div className={styles.container}>
      <div className={`${styles.ambient} ${styles.ambient1}`} />
      <div className={`${styles.ambient} ${styles.ambient2}`} />

      <div className={styles.content}>
        <Link href="/simulation" className={styles.backLink}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
          Back to personas
        </Link>

        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerIcon}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
          </div>
          <h1 className={styles.title}>
            Your Life Roadmap{roadmap.userName ? `, ${roadmap.userName}` : ""}
          </h1>
          <p className={styles.subtitle}>
            A visual journey through your projected future — milestones, risks, and opportunities
          </p>
        </div>

        <DisclaimerBanner context="roadmap" />

        {/* Category Filters */}
        <div className={styles.filters}>
          <button
            className={`${styles.filterBtn} ${activeFilter === "all" ? styles.active : ""}`}
            onClick={() => setActiveFilter("all")}
          >
            All
          </button>
          {(
            Object.entries(CATEGORY_CONFIG) as [
              MilestoneCategory,
              (typeof CATEGORY_CONFIG)[MilestoneCategory],
            ][]
          ).map(([key, config]) => (
            <button
              key={key}
              className={`${styles.filterBtn} ${activeFilter === key ? styles.active : ""}`}
              onClick={() => setActiveFilter(key)}
              style={
                activeFilter === key
                  ? { borderColor: config.color, color: config.color }
                  : undefined
              }
            >
              {config.icon} {config.label}
            </button>
          ))}
        </div>

        {/* Timeline */}
        <div className={styles.timeline}>
          <div className={styles.timelineLine} />

          {roadmap.timeline.map((node, nodeIndex) => {
            const milestones = filterMilestones(node);
            if (milestones.length === 0 && activeFilter !== "all") return null;

            return (
              <div key={node.timeframe} className={styles.node}>
                <div className={styles.nodeDot} />

                <div className={styles.nodeHeader}>
                  <span className={styles.nodeLabel}>{node.label}</span>
                  <span className={styles.nodeSublabel}>{node.sublabel}</span>
                </div>

                {/* Nova Canvas Image */}
                <div className={styles.imageCard}>
                  {images[nodeIndex] ? (
                    <img
                      src={images[nodeIndex]}
                      alt={`${node.label} visualization`}
                    />
                  ) : (
                    <div className={styles.imagePlaceholder}>
                      {imagesLoading ? (
                        <>
                          <div className={styles.imageSpinner} />
                          <span>Generating visualization...</span>
                        </>
                      ) : (
                        <span>Image will appear here</span>
                      )}
                    </div>
                  )}
                </div>

                {/* Milestone Cards */}
                <div className={styles.milestoneGrid}>
                  {milestones.map((milestone) => (
                    <div
                      key={milestone.id}
                      className={`${styles.milestone} ${styles[milestone.category]}`}
                    >
                      <div className={styles.milestoneTop}>
                        <span className={styles.milestoneEmoji}>
                          {milestone.icon}
                        </span>
                        <span className={styles.milestoneTitle}>
                          {milestone.title}
                        </span>
                        <span
                          className={`${styles.likelihoodDot} ${styles[milestone.likelihood]}`}
                          title={`${milestone.likelihood} likelihood`}
                        />
                      </div>
                      <p className={styles.milestoneDesc}>
                        {milestone.description}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Risk Alerts */}
                {node.risks.length > 0 && activeFilter === "all" && (
                  <div className={styles.risks}>
                    {node.risks.map((risk) => (
                      <div key={risk.id} className={styles.risk}>
                        <span className={styles.riskIcon}>⚠️</span>
                        <span>{risk.title}</span>
                        <span
                          className={`${styles.riskSeverity} ${styles[risk.severity]}`}
                        >
                          {risk.severity}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Summary Section */}
        {(roadmap.overallRisks.length > 0 ||
          roadmap.overallOpportunities.length > 0) && (
          <div className={styles.summary}>
            <h3 className={styles.summaryTitle}>Big Picture</h3>
            <div className={styles.summaryGrid}>
              {roadmap.overallRisks.length > 0 && (
                <div className={`${styles.summarySection} ${styles.risks}`}>
                  <h4>Key Risks to Monitor</h4>
                  <ul className={styles.summaryList}>
                    {roadmap.overallRisks.slice(0, 5).map((r) => (
                      <li key={r.id}>{r.title}</li>
                    ))}
                  </ul>
                </div>
              )}
              {roadmap.overallOpportunities.length > 0 && (
                <div
                  className={`${styles.summarySection} ${styles.opportunities}`}
                >
                  <h4>Opportunities to Seize</h4>
                  <ul className={styles.summaryList}>
                    {roadmap.overallOpportunities.slice(0, 5).map((o, i) => (
                      <li key={i}>{o}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className={styles.actions}>
          <Link href="/whatif" className={styles.primaryBtn}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M23 4v6h-6" />
              <path d="M1 20v-6h6" />
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
            </svg>
            Explore &ldquo;What If...?&rdquo;
          </Link>
          <Link href="/simulation" className={styles.secondaryBtn}>
            Talk to Another Self
          </Link>
        </div>
      </div>
    </div>
  );
}
