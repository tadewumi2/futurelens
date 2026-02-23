// ─── Individual Agent Outputs ───

export interface CareerProjection {
  currentAssessment: string;
  oneYear: {
    role: string;
    salary: string;
    skills: string[];
    likelihood: string;
    keyActions: string[];
  };
  fiveYear: {
    role: string;
    salary: string;
    skills: string[];
    likelihood: string;
    keyActions: string[];
  };
  tenYear: {
    role: string;
    salary: string;
    skills: string[];
    likelihood: string;
    keyActions: string[];
  };
  risks: string[];
  opportunities: string[];
}

export interface FinancialProjection {
  currentAssessment: string;
  oneYear: {
    netWorth: string;
    savings: string;
    debtStatus: string;
    monthlyBudget: string;
  };
  fiveYear: {
    netWorth: string;
    savings: string;
    investments: string;
    milestones: string[];
  };
  tenYear: {
    netWorth: string;
    assets: string;
    financialFreedom: string;
    milestones: string[];
  };
  risks: string[];
  recommendations: string[];
}

export interface WellnessProjection {
  currentAssessment: string;
  oneYear: {
    physicalHealth: string;
    mentalHealth: string;
    habits: string[];
    risks: string[];
  };
  fiveYear: {
    physicalHealth: string;
    mentalHealth: string;
    habits: string[];
    risks: string[];
  };
  tenYear: {
    physicalHealth: string;
    mentalHealth: string;
    habits: string[];
    risks: string[];
  };
  recommendations: string[];
}

export interface LifestyleProjection {
  currentAssessment: string;
  oneYear: {
    relationships: string;
    community: string;
    hobbies: string;
    livingsituation: string;
  };
  fiveYear: {
    relationships: string;
    community: string;
    achievements: string[];
    livingsituation: string;
  };
  tenYear: {
    relationships: string;
    community: string;
    legacy: string;
    livingsituation: string;
  };
  recommendations: string[];
}

// ─── Synthesized Persona ───

export interface FuturePersona {
  timeframe: "1-year" | "5-year" | "10-year";
  name: string; // e.g. "The Catalyst"
  age: string;
  emotionalTone: string; // e.g. "encouraging but urgent"
  speakingStyle: string;
  lifeStatus: {
    career: string;
    financial: string;
    health: string;
    relationships: string;
    location: string;
  };
  keyMemories: string[]; // things this future self "remembers" doing
  proudOf: string[];
  regrets: string[];
  adviceToPresent: string[];
  conversationBoundaries: string[];
  openingLine: string; // first thing they'd say in a voice call
  personality: string;
}

// ─── Full Simulation Result ───

export interface SimulationResult {
  profileSummary: string;
  agentOutputs: {
    career: CareerProjection;
    financial: FinancialProjection;
    wellness: WellnessProjection;
    lifestyle: LifestyleProjection;
  };
  personas: {
    oneYear: FuturePersona;
    fiveYear: FuturePersona;
    tenYear: FuturePersona;
  };
  generatedAt: string;
}

// ─── Agent execution status (for progress UI) ───

export type AgentName =
  | "career"
  | "financial"
  | "wellness"
  | "lifestyle"
  | "synthesis";

export type AgentStatus = "pending" | "running" | "completed" | "error";

export interface AgentProgress {
  agent: AgentName;
  status: AgentStatus;
  message?: string;
}
