import { NextRequest, NextResponse } from "next/server";
import {
  saveProfile,
  saveSimulation,
  loadFullSession,
  deleteSession,
  updateProfile,
} from "@/lib/aws/dynamo";

/**
 * GET /api/session?id=xxx — Load a full session
 */
export async function GET(request: NextRequest) {
  const sessionId = request.nextUrl.searchParams.get("id");
  if (!sessionId) {
    return NextResponse.json({ error: "Session ID required" }, { status: 400 });
  }

  try {
    const session = await loadFullSession(sessionId);
    return NextResponse.json(session);
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed to load session";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

/**
 * POST /api/session — Save profile and/or simulation
 * Body: { sessionId, profile?, simulation?, isWhatIf?, scenarioLabel? }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId, profile, simulation, isWhatIf, scenarioLabel } = body;

    if (!sessionId) {
      return NextResponse.json({ error: "sessionId required" }, { status: 400 });
    }

    const results: Record<string, unknown> = { sessionId };

    // Save profile if provided
    if (profile) {
      const stored = await saveProfile(sessionId, profile);
      results.profile = stored;
    }

    // Save simulation if provided
    if (simulation) {
      const stored = await saveSimulation(sessionId, simulation, {
        isWhatIf: isWhatIf || false,
        scenarioLabel,
      });
      results.simulation = stored;
    }

    return NextResponse.json(results);
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed to save session";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

/**
 * PUT /api/session — Update existing profile
 * Body: { sessionId, profile }
 */
export async function PUT(request: NextRequest) {
  try {
    const { sessionId, profile } = await request.json();

    if (!sessionId || !profile) {
      return NextResponse.json(
        { error: "sessionId and profile required" },
        { status: 400 }
      );
    }

    await updateProfile(sessionId, profile);
    return NextResponse.json({ success: true, sessionId });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed to update";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

/**
 * DELETE /api/session?id=xxx — Delete all session data
 */
export async function DELETE(request: NextRequest) {
  const sessionId = request.nextUrl.searchParams.get("id");
  if (!sessionId) {
    return NextResponse.json({ error: "Session ID required" }, { status: 400 });
  }

  try {
    await deleteSession(sessionId);
    return NextResponse.json({ success: true, deleted: sessionId });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed to delete";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
