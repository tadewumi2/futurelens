import { NextRequest, NextResponse } from "next/server";
import { callNova, parseNovaJSON } from "@/lib/aws/bedrock";
import {
  CAREER_AGENT_PROMPT,
  FINANCIAL_AGENT_PROMPT,
  WELLNESS_AGENT_PROMPT,
  LIFESTYLE_AGENT_PROMPT,
  SYNTHESIS_AGENT_PROMPT,
  buildUserProfileMessage,
} from "@/lib/aws/agents";
import type {
  CareerProjection,
  FinancialProjection,
  WellnessProjection,
  LifestyleProjection,
  SimulationResult,
} from "@/lib/types/simulation";

export async function POST(request: NextRequest) {
  try {
    const profile = await request.json();
    const userMessage = buildUserProfileMessage(profile);

    // ─── Phase 1: Run 4 domain agents in parallel ───
    const [careerResult, financialResult, wellnessResult, lifestyleResult] =
      await Promise.all([
        callNova(CAREER_AGENT_PROMPT, userMessage, {
          maxTokens: 2048,
          temperature: 0.6,
        }).then((res) => parseNovaJSON<CareerProjection>(res)),

        callNova(FINANCIAL_AGENT_PROMPT, userMessage, {
          maxTokens: 2048,
          temperature: 0.6,
        }).then((res) => parseNovaJSON<FinancialProjection>(res)),

        callNova(WELLNESS_AGENT_PROMPT, userMessage, {
          maxTokens: 2048,
          temperature: 0.6,
        }).then((res) => parseNovaJSON<WellnessProjection>(res)),

        callNova(LIFESTYLE_AGENT_PROMPT, userMessage, {
          maxTokens: 2048,
          temperature: 0.6,
        }).then((res) => parseNovaJSON<LifestyleProjection>(res)),
      ]);

    // ─── Phase 2: Synthesis agent combines all outputs ───
    const synthesisInput = `${userMessage}

---

CAREER AGENT OUTPUT:
${JSON.stringify(careerResult, null, 2)}

FINANCIAL AGENT OUTPUT:
${JSON.stringify(financialResult, null, 2)}

WELLNESS AGENT OUTPUT:
${JSON.stringify(wellnessResult, null, 2)}

LIFESTYLE AGENT OUTPUT:
${JSON.stringify(lifestyleResult, null, 2)}`;

    const synthesisRaw = await callNova(SYNTHESIS_AGENT_PROMPT, synthesisInput, {
      maxTokens: 4096,
      temperature: 0.75,
    });

    const synthesis = parseNovaJSON<{
      profileSummary: string;
      personas: {
        oneYear: SimulationResult["personas"]["oneYear"];
        fiveYear: SimulationResult["personas"]["fiveYear"];
        tenYear: SimulationResult["personas"]["tenYear"];
      };
    }>(synthesisRaw);

    // ─── Assemble final result ───
    const result: SimulationResult = {
      profileSummary: synthesis.profileSummary,
      agentOutputs: {
        career: careerResult,
        financial: financialResult,
        wellness: wellnessResult,
        lifestyle: lifestyleResult,
      },
      personas: synthesis.personas,
      generatedAt: new Date().toISOString(),
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error("Simulation error:", error);

    const message =
      error instanceof Error ? error.message : "Simulation failed";

    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
