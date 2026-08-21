import { NextResponse } from "next/server";
import { getPresenceCounts, recordHeartbeat } from "@/lib/presence";

export const dynamic = "force-dynamic";

const noStore = { "cache-control": "no-store" };

export async function GET() {
  return NextResponse.json(await getPresenceCounts(), { headers: noStore });
}

export async function POST(request: Request) {
  let sessionId: unknown;
  try {
    ({ sessionId } = (await request.json()) as { sessionId?: unknown });
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  if (typeof sessionId !== "string" || sessionId.length < 8 || sessionId.length > 64) {
    return NextResponse.json({ error: "Invalid sessionId" }, { status: 400 });
  }

  return NextResponse.json(await recordHeartbeat(sessionId), { headers: noStore });
}
