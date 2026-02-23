import type { SimulationResult } from "./simulation";

// ─── Adjustable Variables ───

export interface WhatIfScenario {
  id: string;
  label: string;
  adjustments: WhatIfAdjustments;
  result: SimulationResult | null;
  status: "idle" | "running" | "completed" | "error";
  error?: string;
}

export interface WhatIfAdjustments {
  // Career
  currentRole: string;
  industry: string;
  yearsExperience: string;
  careerGoals: string;

  // Financial
  incomeRange: string;
  financialGoals: string;

  // Wellness
  exerciseFrequency: string;
  sleepQuality: string;
  stressLevel: string;
  healthGoals: string;

  // Lifestyle
  hobbies: string;
  lifestyleGoals: string;
}

export interface ComparisonMetric {
  label: string;
  category: "career" | "financial" | "wellness" | "lifestyle";
  timeframe: "1-year" | "5-year" | "10-year";
  original: string;
  scenario: string;
  direction: "better" | "worse" | "neutral";
}

// ─── Preset Scenarios ───

export interface ScenarioPreset {
  id: string;
  label: string;
  emoji: string;
  description: string;
  changes: Partial<WhatIfAdjustments>;
}

export const SCENARIO_PRESETS: ScenarioPreset[] = [
  {
    id: "career-pivot",
    label: "Career Pivot",
    emoji: "🔄",
    description: "Switch to a different industry or role",
    changes: {
      currentRole: "",
      industry: "",
      careerGoals: "",
    },
  },
  {
    id: "aggressive-saving",
    label: "Aggressive Saving",
    emoji: "💰",
    description: "Maximize savings and investing",
    changes: {
      financialGoals: "Save 40% of income, max out retirement accounts, build investment portfolio aggressively, minimize discretionary spending",
    },
  },
  {
    id: "health-focus",
    label: "Health Transformation",
    emoji: "💪",
    description: "Prioritize physical and mental wellness",
    changes: {
      exerciseFrequency: "daily",
      sleepQuality: "excellent",
      stressLevel: "low",
      healthGoals: "Exercise daily, meditate, eat whole foods, maintain consistent sleep schedule, annual health checkups",
    },
  },
  {
    id: "work-life-balance",
    label: "Work-Life Balance",
    emoji: "⚖️",
    description: "Prioritize life outside of work",
    changes: {
      stressLevel: "low",
      hobbies: "Multiple active hobbies, creative pursuits, regular travel",
      lifestyleGoals: "Strong community ties, regular travel, creative fulfillment, meaningful relationships over career advancement",
    },
  },
];

/**
 * Build adjustments from the current profile, applying scenario overrides
 */
export function buildAdjustmentsFromProfile(
  profile: Record<string, string>,
  overrides?: Partial<WhatIfAdjustments>
): WhatIfAdjustments {
  return {
    currentRole: overrides?.currentRole ?? profile.currentRole ?? "",
    industry: overrides?.industry ?? profile.industry ?? "",
    yearsExperience: overrides?.yearsExperience ?? profile.yearsExperience ?? "",
    careerGoals: overrides?.careerGoals ?? profile.careerGoals ?? "",
    incomeRange: overrides?.incomeRange ?? profile.incomeRange ?? "",
    financialGoals: overrides?.financialGoals ?? profile.financialGoals ?? "",
    exerciseFrequency: overrides?.exerciseFrequency ?? profile.exerciseFrequency ?? "",
    sleepQuality: overrides?.sleepQuality ?? profile.sleepQuality ?? "",
    stressLevel: overrides?.stressLevel ?? profile.stressLevel ?? "",
    healthGoals: overrides?.healthGoals ?? profile.healthGoals ?? "",
    hobbies: overrides?.hobbies ?? profile.hobbies ?? "",
    lifestyleGoals: overrides?.lifestyleGoals ?? profile.lifestyleGoals ?? "",
  };
}

/**
 * Merge adjustments back into the profile for re-simulation
 */
export function mergeAdjustmentsIntoProfile(
  originalProfile: Record<string, unknown>,
  adjustments: WhatIfAdjustments
): Record<string, unknown> {
  return {
    ...originalProfile,
    ...adjustments,
  };
}
