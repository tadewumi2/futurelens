import {
  BedrockRuntimeClient,
  InvokeModelCommand,
} from "@aws-sdk/client-bedrock-runtime";

const client = new BedrockRuntimeClient({
  region: process.env.AWS_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
});

const MODEL_ID = "amazon.nova-canvas-v1:0";

/**
 * Generate an image using Amazon Nova Canvas.
 * Returns a base64-encoded PNG image.
 */
export async function generateImage(
  prompt: string,
  options?: {
    width?: number;
    height?: number;
    quality?: "standard" | "premium";
    negativePrompt?: string;
  }
): Promise<string> {
  const {
    width = 1024,
    height = 1024,
    quality = "standard",
    negativePrompt = "text, watermark, logo, blurry, low quality, distorted, ugly, deformed",
  } = options || {};

  const body = JSON.stringify({
    taskType: "TEXT_IMAGE",
    textToImageParams: {
      text: prompt,
      negativeText: negativePrompt,
    },
    imageGenerationConfig: {
      numberOfImages: 1,
      width,
      height,
      quality,
      cfgScale: 8.0,
      seed: Math.floor(Math.random() * 2147483647),
    },
  });

  const command = new InvokeModelCommand({
    modelId: MODEL_ID,
    body: new TextEncoder().encode(body),
    contentType: "application/json",
    accept: "application/json",
  });

  const response = await client.send(command);
  const responseBody = JSON.parse(new TextDecoder().decode(response.body));

  if (responseBody.images && responseBody.images.length > 0) {
    return responseBody.images[0]; // base64 PNG
  }

  throw new Error("No image generated");
}
