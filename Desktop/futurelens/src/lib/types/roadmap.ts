import type { SimulationResult } from "./simulation";

// ─── Roadmap Data Structures ───

export type MilestoneCategory =
  | "career"
  | "financial"
  | "wellness"
  | "lifestyle";

export interface Milestone {
  id: string;
  category: MilestoneCategory;
  title: string;
  description: string;
  icon: string; // emoji
  likelihood: "high" | "medium" | "low";
}

export interface RiskAlert {
  id: string;
  category: MilestoneCategory;
  title: string;
  description: string;
  severity: "high" | "medium" | "low";
}

export interface TimelineNode {
  timeframe: "now" | "1-year" | "5-year" | "10-year";
  label: string;
  sublabel: string;
  milestones: Milestone[];
  risks: RiskAlert[];
  imagePrompt: string; // prompt for Nova Canvas
  imageUrl?: string; // generated image URL
}

export interface RoadmapData {
  userName: string;
  generatedAt: string;
  timeline: TimelineNode[];
  overallRisks: RiskAlert[];
  overallOpportunities: string[];
}

// ─── Category Config ───

export const CATEGORY_CONFIG: Record<
  MilestoneCategory,
  { label: string; color: string; icon: string }
> = {
  career: { label: "Career", color: "#00e5ff", icon: "💼" },
  financial: { label: "Financial", color: "#7c4dff", icon: "💰" },
  wellness: { label: "Wellness", color: "#4caf50", icon: "❤️" },
  lifestyle: { label: "Lifestyle", color: "#ff6b9d", icon: "🌟" },
};

// ─── Transform Simulation → Roadmap ───

export function buildRoadmapData(
  simulation: SimulationResult,
  userName: string
): RoadmapData {
  const { agentOutputs, personas } = simulation;
  const c = agentOutputs.career;
  const f = agentOutputs.financial;
  const w = agentOutputs.wellness;
  const l = agentOutputs.lifestyle;

  // ─── NOW ───
  const nowNode: TimelineNode = {
    timeframe: "now",
    label: "Today",
    sublabel: "Where you are",
    milestones: [
      {
        id: "now-career",
        category: "career",
        title: c.oneYear.role ? `Working as ${c.oneYear.role.split(" ")[0]}...` : "Career Starting Point",
        description: c.currentAssessment,
        icon: "📍",
        likelihood: "high",
      },
      {
        id: "now-financial",
        category: "financial",
        title: "Financial Baseline",
        description: f.currentAssessment,
        icon: "📊",
        likelihood: "high",
      },
    ],
    risks: [],
    imagePrompt: `Minimalist illustration of a person standing at a crossroads looking toward a bright horizon, warm sunset colors, hopeful mood, digital art style, clean lines`,
  };

  // ─── 1 YEAR ───
  const yr1Node: TimelineNode = {
    timeframe: "1-year",
    label: "1 Year",
    sublabel: personas.oneYear.name,
    milestones: [
      {
        id: "1y-career",
        category: "career",
        title: c.oneYear.role || "Career Growth",
        description: `Salary: ${c.oneYear.salary}. ${c.oneYear.keyActions?.[0] || ""}`,
        icon: "💼",
        likelihood: parseLikelihood(c.oneYear.likelihood),
      },
      {
        id: "1y-financial",
        category: "financial",
        title: `Net Worth: ${f.oneYear.netWorth}`,
        description: `Savings: ${f.oneYear.savings}. ${f.oneYear.debtStatus}`,
        icon: "💰",
        likelihood: "medium",
      },
      {
        id: "1y-wellness",
        category: "wellness",
        title: w.oneYear.physicalHealth,
        description: w.oneYear.mentalHealth,
        icon: "❤️",
        likelihood: "high",
      },
      {
        id: "1y-lifestyle",
        category: "lifestyle",
        title: l.oneYear.relationships,
        description: `${l.oneYear.community}. Hobbies: ${l.oneYear.hobbies}`,
        icon: "🌟",
        likelihood: "high",
      },
    ],
    risks: [
      ...w.oneYear.risks.map((r, i) => ({
        id: `1y-wr-${i}`,
        category: "wellness" as MilestoneCategory,
        title: r,
        description: r,
        severity: "medium" as const,
      })),
    ],
    imagePrompt: `Minimalist illustration of a young professional working on a laptop in a modern apartment, city view through window, morning light, growth and progress theme, digital art, clean aesthetic`,
  };

  // ─── 5 YEARS ───
  const yr5Node: TimelineNode = {
    timeframe: "5-year",
    label: "5 Years",
    sublabel: personas.fiveYear.name,
    milestones: [
      {
        id: "5y-career",
        category: "career",
        title: c.fiveYear.role || "Senior Role",
        description: `Salary: ${c.fiveYear.salary}. Skills: ${c.fiveYear.skills?.slice(0, 3).join(", ")}`,
        icon: "💼",
        likelihood: parseLikelihood(c.fiveYear.likelihood),
      },
      {
        id: "5y-financial",
        category: "financial",
        title: `Net Worth: ${f.fiveYear.netWorth}`,
        description: `Investments: ${f.fiveYear.investments}`,
        icon: "💰",
        likelihood: "medium",
      },
      ...(f.fiveYear.milestones || []).slice(0, 2).map((m, i) => ({
        id: `5y-fm-${i}`,
        category: "financial" as MilestoneCategory,
        title: m,
        description: m,
        icon: "🎯",
        likelihood: "medium" as const,
      })),
      {
        id: "5y-wellness",
        category: "wellness",
        title: w.fiveYear.physicalHealth,
        description: w.fiveYear.mentalHealth,
        icon: "❤️",
        likelihood: "high",
      },
      {
        id: "5y-lifestyle",
        category: "lifestyle",
        title: l.fiveYear.relationships,
        description: l.fiveYear.community,
        icon: "🌟",
        likelihood: "high",
      },
      ...(l.fiveYear.achievements || []).slice(0, 2).map((a, i) => ({
        id: `5y-la-${i}`,
        category: "lifestyle" as MilestoneCategory,
        title: a,
        description: a,
        icon: "🏆",
        likelihood: "medium" as const,
      })),
    ],
    risks: [
      ...c.risks.map((r, i) => ({
        id: `5y-cr-${i}`,
        category: "career" as MilestoneCategory,
        title: r,
        description: r,
        severity: "medium" as const,
      })),
      ...f.risks.slice(0, 2).map((r, i) => ({
        id: `5y-fr-${i}`,
        category: "financial" as MilestoneCategory,
        title: r,
        description: r,
        severity: "high" as const,
      })),
    ],
    imagePrompt: `Minimalist illustration of a confident person in a leadership role, modern office with a team, city skyline, achievement and stability theme, warm professional colors, digital art`,
  };

  // ─── 10 YEARS ───
  const yr10Node: TimelineNode = {
    timeframe: "10-year",
    label: "10 Years",
    sublabel: personas.tenYear.name,
    milestones: [
      {
        id: "10y-career",
        category: "career",
        title: c.tenYear.role || "Leadership Role",
        description: `Salary: ${c.tenYear.salary}. ${c.tenYear.skills?.slice(0, 3).join(", ")}`,
        icon: "💼",
        likelihood: parseLikelihood(c.tenYear.likelihood),
      },
      {
        id: "10y-financial",
        category: "financial",
        title: `Net Worth: ${f.tenYear.netWorth}`,
        description: `Assets: ${f.tenYear.assets}. ${f.tenYear.financialFreedom}`,
        icon: "💰",
        likelihood: "medium",
      },
      ...(f.tenYear.milestones || []).slice(0, 2).map((m, i) => ({
        id: `10y-fm-${i}`,
        category: "financial" as MilestoneCategory,
        title: m,
        description: m,
        icon: "🎯",
        likelihood: "medium" as const,
      })),
      {
        id: "10y-wellness",
        category: "wellness",
        title: w.tenYear.physicalHealth,
        description: w.tenYear.mentalHealth,
        icon: "❤️",
        likelihood: "medium",
      },
      {
        id: "10y-lifestyle",
        category: "lifestyle",
        title: l.tenYear.relationships,
        description: `${l.tenYear.community}. Legacy: ${l.tenYear.legacy}`,
        icon: "🌟",
        likelihood: "high",
      },
    ],
    risks: [
      ...w.tenYear.risks.map((r, i) => ({
        id: `10y-wr-${i}`,
        category: "wellness" as MilestoneCategory,
        title: r,
        description: r,
        severity: "high" as const,
      })),
    ],
    imagePrompt: `Minimalist illustration of a person at peace overlooking a beautiful landscape at sunset, home and family in background, wisdom and fulfillment theme, warm golden colors, digital art`,
  };

  // Overall
  const overallRisks: RiskAlert[] = [
    ...c.risks.map((r, i) => ({
      id: `or-c-${i}`,
      category: "career" as MilestoneCategory,
      title: r,
      description: r,
      severity: "medium" as const,
    })),
    ...f.risks.map((r, i) => ({
      id: `or-f-${i}`,
      category: "financial" as MilestoneCategory,
      title: r,
      description: r,
      severity: "high" as const,
    })),
  ];

  return {
    userName,
    generatedAt: new Date().toISOString(),
    timeline: [nowNode, yr1Node, yr5Node, yr10Node],
    overallRisks,
    overallOpportunities: c.opportunities || [],
  };
}

function parseLikelihood(s?: string): "high" | "medium" | "low" {
  if (!s) return "medium";
  const lower = s.toLowerCase();
  if (lower.includes("high")) return "high";
  if (lower.includes("low")) return "low";
  return "medium";
}
