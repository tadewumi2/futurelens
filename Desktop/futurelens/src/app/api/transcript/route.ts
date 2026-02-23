import { NextRequest, NextResponse } from "next/server";
import { saveTranscript, getTranscripts } from "@/lib/aws/dynamo";

/**
 * GET /api/transcript?sessionId=xxx — Get all transcripts for a session
 */
export async function GET(request: NextRequest) {
  const sessionId = request.nextUrl.searchParams.get("sessionId");
  if (!sessionId) {
    return NextResponse.json({ error: "sessionId required" }, { status: 400 });
  }

  try {
    const transcripts = await getTranscripts(sessionId);
    return NextResponse.json({ transcripts });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed to load transcripts";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

/**
 * POST /api/transcript — Save a conversation transcript
 * Body: { sessionId, personaTimeframe, personaName, entries, duration }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId, personaTimeframe, personaName, entries, duration } = body;

    if (!sessionId || !entries) {
      return NextResponse.json(
        { error: "sessionId and entries required" },
        { status: 400 }
      );
    }

    const stored = await saveTranscript(sessionId, {
      personaTimeframe: personaTimeframe || "unknown",
      personaName: personaName || "Future Self",
      entries: entries || [],
      duration: duration || 0,
    });

    return NextResponse.json(stored);
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed to save transcript";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
