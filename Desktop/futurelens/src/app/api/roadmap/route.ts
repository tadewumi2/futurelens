import { NextRequest, NextResponse } from "next/server";
import { generateImage } from "@/lib/aws/canvas";

export async function POST(request: NextRequest) {
  try {
    const { prompts } = await request.json();

    if (!Array.isArray(prompts) || prompts.length === 0) {
      return NextResponse.json(
        { error: "prompts array required" },
        { status: 400 }
      );
    }

    // Generate images in parallel (up to 4)
    const results = await Promise.allSettled(
      prompts.slice(0, 4).map((prompt: string) =>
        generateImage(prompt, { width: 1024, height: 1024 })
      )
    );

    const images = results.map((result, i) => ({
      index: i,
      success: result.status === "fulfilled",
      image:
        result.status === "fulfilled"
          ? `data:image/png;base64,${result.value}`
          : null,
      error:
        result.status === "rejected"
          ? result.reason?.message || "Failed to generate"
          : null,
    }));

    return NextResponse.json({ images });
  } catch (error) {
    console.error("Roadmap image generation error:", error);
    const message =
      error instanceof Error ? error.message : "Image generation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
