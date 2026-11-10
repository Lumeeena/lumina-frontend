import { NextResponse } from "next/server";

export function GET(): NextResponse {
  return NextResponse.json(
    { status: "ok" },
    {
      status: 200,
      headers: { "Cache-Control": "no-store" },
    },
  );
}
