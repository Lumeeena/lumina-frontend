import { NextRequest, NextResponse } from "next/server";

interface AnalyticsPayload {
  event: string;
  route?: string;
  feature?: string;
  sessionId: string;
  timestamp: number;
}

// Known event types that the analytics system accepts
const KNOWN_EVENTS = ["pageView", "featureUsage"] as const;

// Maximum field lengths to prevent log flooding
const MAX_FIELD_LENGTHS = {
  event: 50,
  route: 500,
  feature: 100,
  sessionId: 50,
} as const;

function validatePayload(data: unknown): data is AnalyticsPayload {
  if (typeof data !== "object" || data === null) return false;

  const payload = data as Record<string, unknown>;

  // Type checks
  if (
    typeof payload.event !== "string" ||
    (payload.route !== undefined && typeof payload.route !== "string") ||
    (payload.feature !== undefined && typeof payload.feature !== "string") ||
    typeof payload.sessionId !== "string" ||
    typeof payload.timestamp !== "number"
  ) {
    return false;
  }

  // Length checks
  if (
    payload.event.length > MAX_FIELD_LENGTHS.event ||
    (payload.route !== undefined && payload.route.length > MAX_FIELD_LENGTHS.route) ||
    (payload.feature !== undefined && payload.feature.length > MAX_FIELD_LENGTHS.feature) ||
    payload.sessionId.length > MAX_FIELD_LENGTHS.sessionId
  ) {
    return false;
  }

  // Known event check
  if (!KNOWN_EVENTS.includes(payload.event as any)) {
    return false;
  }

  return true;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const data = await request.json();

    if (!validatePayload(data)) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    // Opt-out check via header
    const optOut = request.headers.get("x-analytics-opt-out") === "true";
    if (optOut) {
      return NextResponse.json({ ok: true });
    }

    // Analytics events are acknowledged but not currently stored or aggregated.
    // See docs/FEATURES.md for details on data handling.

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Analytics endpoint error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
