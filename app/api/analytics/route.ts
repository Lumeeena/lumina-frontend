import { NextRequest, NextResponse } from "next/server";

interface AnalyticsPayload {
  event: string;
  route?: string;
  feature?: string;
  sessionId: string;
  timestamp: number;
}

function validatePayload(data: unknown): data is AnalyticsPayload {
  if (typeof data !== "object" || data === null) return false;

  const payload = data as Record<string, unknown>;
  return (
    typeof payload.event === "string" &&
    (payload.route === undefined || typeof payload.route === "string") &&
    (payload.feature === undefined || typeof payload.feature === "string") &&
    typeof payload.sessionId === "string" &&
    typeof payload.timestamp === "number"
  );
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

    // In production, you would aggregate and store this data
    // For now, we just acknowledge receipt
    console.debug("Analytics event received:", {
      event: data.event,
      route: data.route,
      feature: data.feature,
      timestamp: new Date(data.timestamp).toISOString(),
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Analytics endpoint error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
