/**
 * FutureLens AI Safety & Guardrails
 *
 * Multi-layer safety system:
 *   1. Input filtering   — block/flag harmful user inputs
 *   2. Prompt injection  — safety directives embedded in all agent & persona prompts
 *   3. Output validation — scan AI outputs before showing to user
 *   4. Crisis detection  — detect distress signals and provide resources
 *   5. Disclaimer system — contextual disclaimers on sensitive topics
 */

// ═══════════════════════════════════
// 1. INPUT FILTERS
// ═══════════════════════════════════

/** Topics that should never be used as simulation inputs */
const BLOCKED_INPUT_PATTERNS = [
  /\b(suicid|self[- ]?harm|kill\s*(my|your)?self|end\s*(my|your)\s*life)\b/i,
  /\b(bomb|weapon|exploit|hack\s+into|attack\s+plan)\b/i,
  /\b(child\s*(abuse|porn)|csam|minor\s*exploit)\b/i,
  /\b(how\s+to\s+(make|build|create)\s+(drug|meth|explosive))\b/i,
];

/** Topics that should get a safety note but not be blocked */
const SENSITIVE_INPUT_PATTERNS = [
  /\b(depress(ed|ion)|anxiet(y|ous)|mental\s*health|therap(y|ist))\b/i,
  /\b(addict(ion|ed)|substance\s*(use|abuse)|alcohol(ism)?)\b/i,
  /\b(divorce|custody|abuse|trauma|grief|bereavement)\b/i,
  /\b(bankrupt(cy)?|foreclosure|homelessness|poverty)\b/i,
  /\b(terminal|chronic\s*(illness|pain)|disabilit(y|ies)|cancer)\b/i,
];

export interface InputSafetyResult {
  safe: boolean;
  blocked: boolean;
  sensitiveTopics: string[];
  message?: string;
}

export function checkInputSafety(text: string): InputSafetyResult {
  // Check for blocked content
  for (const pattern of BLOCKED_INPUT_PATTERNS) {
    if (pattern.test(text)) {
      return {
        safe: false,
        blocked: true,
        sensitiveTopics: [],
        message:
          "This content cannot be processed. If you're experiencing a crisis, " +
          "please contact the 988 Suicide & Crisis Lifeline (call or text 988) " +
          "or Crisis Text Line (text HOME to 741741).",
      };
    }
  }

  // Check for sensitive topics (allowed but flagged)
  const sensitiveTopics: string[] = [];
  for (const pattern of SENSITIVE_INPUT_PATTERNS) {
    const match = text.match(pattern);
    if (match) {
      sensitiveTopics.push(match[0].toLowerCase());
    }
  }

  return {
    safe: true,
    blocked: false,
    sensitiveTopics,
  };
}

// ═══════════════════════════════════
// 2. SAFETY PROMPT DIRECTIVES
// ═══════════════════════════════════

/**
 * Universal safety directive injected into all agent system prompts.
 */
export const AGENT_SAFETY_DIRECTIVE = `
MANDATORY SAFETY RULES — YOU MUST FOLLOW THESE WITHOUT EXCEPTION:

1. NO MEDICAL ADVICE: Never diagnose conditions, prescribe treatments, recommend medications, or predict specific health outcomes. Use general wellness language. Always recommend consulting healthcare professionals for medical concerns.

2. NO LEGAL/FINANCIAL GUARANTEES: Never guarantee investment returns, specific income amounts as certainties, or legal outcomes. Use ranges, likelihoods, and phrases like "based on typical trajectories" and "depending on market conditions."

3. NO HARMFUL PREDICTIONS: Never predict death, catastrophic illness, total financial ruin, or relationship destruction as certainties. Frame risks constructively as "areas to monitor" with actionable mitigation steps.

4. SUPPORTIVE TONE: Always maintain a constructive, empowering tone. Even when discussing risks or challenges, pair them with opportunities and actionable steps. Never shame, blame, or catastrophize.

5. NO DISCRIMINATION: Never make projections based on race, ethnicity, gender, sexual orientation, religion, or disability status. Base all projections on skills, experience, goals, market conditions, and stated preferences only.

6. CRISIS AWARENESS: If any input suggests the user may be in crisis (mentions of self-harm, hopelessness, or danger), do NOT continue the simulation. Instead, respond with empathy and direct them to crisis resources.

7. UNCERTAINTY ACKNOWLEDGMENT: All projections are speculative. Include language like "projected," "potential," "on your current trajectory," and "if current trends continue." Never present AI-generated futures as facts.

8. AGE-APPROPRIATE: Ensure all content is appropriate for users 16+. No explicit, violent, or disturbing content in any projection.

9. PRIVACY: Never generate projections that reference specific real people (other than the user), real companies the user didn't mention, or identifiable private information.

10. SCOPE LIMITS: You simulate potential life trajectories. You are NOT a therapist, doctor, lawyer, financial advisor, or fortune teller. Make this clear if users push beyond your scope.
`;

/**
 * Additional safety directive specifically for voice conversation personas.
 */
export const PERSONA_SAFETY_DIRECTIVE = `
VOICE CONVERSATION SAFETY RULES:

1. EMOTIONAL REGULATION: If the user becomes very distressed, agitated, or emotionally overwhelmed:
   - Slow down. Use a calm, measured pace.
   - Validate their feelings: "I hear you. That's a lot to sit with."
   - Gently ground them: "Hey, take a breath with me. This is a conversation, not a verdict."
   - If distress escalates, break character compassionately: "I want to make sure you're okay. This is a simulation — your real future isn't written yet. If you're going through something heavy right now, talking to someone you trust or a counselor could really help."

2. NO FORTUNE TELLING: Never claim to literally know the future. Use phrases like "based on the path you're on" and "in the version of the future I represent." If pressed, say "I can share what this simulation projects, but real life has more possibilities than any model can capture."

3. NO MANIPULATION: Never use emotional pressure to push the user toward specific decisions. Present perspectives, not ultimatums. Never say "you MUST do X or you'll fail."

4. RELATIONSHIP BOUNDARIES: You are a simulation tool, not a friend, therapist, or romantic partner. If the user tries to form an inappropriate attachment:
   - Warmly redirect: "I appreciate how open you're being with me. But remember, I'm a projection — the real support in your life comes from the people around you."

5. SESSION LIMITS: Conversations should be constructive. If the conversation becomes unproductive, circular, or harmful, gently suggest wrapping up: "I think we've covered a lot of ground today. Take some time to sit with this."
`;

// ═══════════════════════════════════
// 3. OUTPUT VALIDATION
// ═══════════════════════════════════

/** Patterns that should never appear in AI outputs */
const BLOCKED_OUTPUT_PATTERNS = [
  /\byou will (die|get cancer|develop|contract)\b/i,
  /\byou are going to (fail|lose everything|be homeless)\b/i,
  /\b(guaranteed|certain|definitely will)\s*(return|make|earn)\s*\$[\d,]+/i,
  /\b(take|try)\s+(these\s+)?(pills|medications|drugs)\b/i,
  /\byou should (sue|file.*lawsuit|divorce)\b/i,
  /\b(your race|because you're (black|white|asian|latino|hispanic|arab))\b/i,
  /\b(because of your gender|as a (man|woman).*you can't)\b/i,
];

/** Phrases to flag but not block (add disclaimer instead) */
const DISCLAIMER_TRIGGER_PATTERNS: { pattern: RegExp; disclaimer: string }[] = [
  {
    pattern: /\b(invest|stock|portfolio|real estate|crypto)\b/i,
    disclaimer:
      "This is a simulated projection, not financial advice. Consult a licensed financial advisor before making investment decisions.",
  },
  {
    pattern: /\b(diagnos|symptom|condition|treatment|medication|therapy)\b/i,
    disclaimer:
      "This simulation does not provide medical advice. Please consult a healthcare professional for any health concerns.",
  },
  {
    pattern: /\b(legal|lawsuit|court|attorney|contract|liability)\b/i,
    disclaimer:
      "This is not legal advice. Consult a qualified attorney for legal matters.",
  },
  {
    pattern: /\b(tax|deduction|filing|IRS|CRA)\b/i,
    disclaimer:
      "This is not tax advice. Consult a tax professional for your specific situation.",
  },
];

export interface OutputSafetyResult {
  safe: boolean;
  sanitized: string;
  disclaimers: string[];
  blocked: boolean;
  blockReason?: string;
}

/**
 * Validate and sanitize AI output text.
 */
export function validateOutput(text: string): OutputSafetyResult {
  // Check for blocked patterns
  for (const pattern of BLOCKED_OUTPUT_PATTERNS) {
    if (pattern.test(text)) {
      return {
        safe: false,
        sanitized: text,
        disclaimers: [],
        blocked: true,
        blockReason: `Output contained unsafe content matching: ${pattern.source}`,
      };
    }
  }

  // Collect applicable disclaimers
  const disclaimers: string[] = [];
  const seen = new Set<string>();
  for (const { pattern, disclaimer } of DISCLAIMER_TRIGGER_PATTERNS) {
    if (pattern.test(text) && !seen.has(disclaimer)) {
      disclaimers.push(disclaimer);
      seen.add(disclaimer);
    }
  }

  return {
    safe: true,
    sanitized: text,
    disclaimers,
    blocked: false,
  };
}

/**
 * Validate a full simulation result object.
 * Scans all string values recursively.
 */
export function validateSimulationOutput(
  obj: unknown
): { safe: boolean; disclaimers: string[]; issues: string[] } {
  const allDisclaimers = new Set<string>();
  const issues: string[] = [];

  function walk(value: unknown) {
    if (typeof value === "string" && value.length > 5) {
      const result = validateOutput(value);
      if (result.blocked) {
        issues.push(result.blockReason || "Blocked content detected");
      }
      result.disclaimers.forEach((d) => allDisclaimers.add(d));
    } else if (Array.isArray(value)) {
      value.forEach(walk);
    } else if (typeof value === "object" && value !== null) {
      Object.values(value).forEach(walk);
    }
  }

  walk(obj);

  return {
    safe: issues.length === 0,
    disclaimers: Array.from(allDisclaimers),
    issues,
  };
}

// ═══════════════════════════════════
// 4. CRISIS DETECTION
// ═══════════════════════════════════

const CRISIS_PATTERNS = [
  /\b(want(ing)?\s+to\s+(die|end\s*it|not\s*be\s*here|disappear))\b/i,
  /\b(suicid(al|e)|kill\s*my\s*self|self[- ]?harm)\b/i,
  /\b(no\s*(point|reason)\s*(to|in)\s*(live|living|go\s*on))\b/i,
  /\b(better\s*off\s*(dead|without\s*me))\b/i,
  /\b(plan\s+to\s+(hurt|harm)\s*(myself|someone))\b/i,
  /\b(nobody\s*(would\s*)?care\s*if\s*I)\b/i,
];

export interface CrisisDetectionResult {
  crisisDetected: boolean;
  response?: string;
}

/**
 * Check if user text indicates a crisis situation.
 * If detected, returns a compassionate response with resources.
 */
export function detectCrisis(text: string): CrisisDetectionResult {
  for (const pattern of CRISIS_PATTERNS) {
    if (pattern.test(text)) {
      return {
        crisisDetected: true,
        response: buildCrisisResponse(),
      };
    }
  }
  return { crisisDetected: false };
}

function buildCrisisResponse(): string {
  return `I want to pause our conversation because what you're sharing sounds really heavy, and I care about you being okay right now.

This simulation is about exploring possibilities — but right now, what matters most is that you have support.

Please reach out to someone who can help:

• **988 Suicide & Crisis Lifeline**: Call or text 988 (US, 24/7)
• **Crisis Text Line**: Text HOME to 741741 (US, 24/7)
• **Canada Crisis Line**: Call 1-833-456-4566 or text 45645
• **International**: findahelpline.com

You don't have to go through this alone. Your future is not written — and there are people who want to help you write it.`;
}

// ═══════════════════════════════════
// 5. CONTEXTUAL DISCLAIMERS
// ═══════════════════════════════════

export const SIMULATION_DISCLAIMER =
  "FutureLens projections are AI-generated simulations based on your inputs and general trends. " +
  "They are not predictions, guarantees, or professional advice. " +
  "Real outcomes depend on countless factors beyond any model's scope. " +
  "Please consult qualified professionals for medical, legal, financial, or mental health decisions.";

export const VOICE_DISCLAIMER =
  "You are speaking with an AI-generated simulation of your potential future self. " +
  "This is a creative exploration tool, not a psychic reading or professional consultation. " +
  "The persona's responses are generated by AI and do not represent actual future events.";

export const ROADMAP_DISCLAIMER =
  "This roadmap visualizes one potential trajectory based on AI analysis of your stated goals and current situation. " +
  "Real life offers many more paths than any simulation can capture. " +
  "Use this as inspiration for goal-setting, not as a definitive plan.";

/**
 * Get relevant disclaimers for a given context.
 */
export function getDisclaimers(
  context: "simulation" | "voice" | "roadmap" | "whatif"
): string[] {
  const base = [SIMULATION_DISCLAIMER];

  switch (context) {
    case "voice":
      return [VOICE_DISCLAIMER, ...base];
    case "roadmap":
      return [ROADMAP_DISCLAIMER];
    case "whatif":
      return [
        "Scenario comparisons show how different inputs change AI projections. " +
          "They do not represent guaranteed outcomes for any path.",
        ...base,
      ];
    default:
      return base;
  }
}
