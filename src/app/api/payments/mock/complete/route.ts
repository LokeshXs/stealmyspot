import { NextResponse } from "next/server";
import { paymentProvider } from "@/lib/env";
import { fulfillBid } from "@/lib/payments/fulfill";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Stands in for the Dodo webhook while developing offline.
 * Hard-fails whenever a real provider is configured, so it can never publish a
 * listing in production.
 */
export async function POST(request: Request) {
  if (paymentProvider !== "mock") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  let bidId: unknown;
  try {
    ({ bidId } = (await request.json()) as { bidId?: unknown });
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  if (typeof bidId !== "string" || !bidId) {
    return NextResponse.json({ error: "Missing bidId" }, { status: 400 });
  }

  const outcome = await fulfillBid(bidId, `mock_pay_${bidId}`, "mock@example.com");

  if (outcome.status === "not_found") {
    return NextResponse.json({ error: "Unknown bid" }, { status: 404 });
  }

  return NextResponse.json({ ok: true, status: outcome.status });
}
