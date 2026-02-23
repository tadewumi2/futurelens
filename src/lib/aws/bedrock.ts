import {
  BedrockRuntimeClient,
  ConverseCommand,
  type Message,
} from "@aws-sdk/client-bedrock-runtime";

// Initialize Bedrock client — region must support Nova 2 Lite
const client = new BedrockRuntimeClient({
  region: process.env.AWS_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
});

const MODEL_ID = "us.amazon.nova-lite-v1:0";

/**
 * Call Nova 2 Lite via Bedrock Converse API
 */
export async function callNova(
  systemPrompt: string,
  userMessage: string,
  options?: { maxTokens?: number; temperature?: number }
): Promise<string> {
  const { maxTokens = 2048, temperature = 0.7 } = options || {};

  const messages: Message[] = [
    {
      role: "user",
      content: [{ text: userMessage }],
    },
  ];

  const command = new ConverseCommand({
    modelId: MODEL_ID,
    system: [{ text: systemPrompt }],
    messages,
    inferenceConfig: {
      maxTokens,
      temperature,
    },
  });

  const response = await client.send(command);

  const outputContent = response.output?.message?.content;
  if (!outputContent || outputContent.length === 0) {
    throw new Error("No response from Nova model");
  }

  return outputContent[0].text || "";
}

/**
 * Parse JSON from Nova response (handles markdown code blocks)
 */
export function parseNovaJSON<T>(response: string): T {
  // Strip markdown code fences if present
  let cleaned = response.trim();
  if (cleaned.startsWith("```json")) {
    cleaned = cleaned.slice(7);
  } else if (cleaned.startsWith("```")) {
    cleaned = cleaned.slice(3);
  }
  if (cleaned.endsWith("```")) {
    cleaned = cleaned.slice(0, -3);
  }
  return JSON.parse(cleaned.trim());
}
