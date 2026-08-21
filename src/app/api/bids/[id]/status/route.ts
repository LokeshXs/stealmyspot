import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { PaymentStatus } from "@/generated/prisma/enums";
import { rankOfListing } from "@/lib/rank-lookup";

export const dynamic = "force-dynamic";

/** Polled by /success while the webhook is still in flight. */
export async function GET(_request: Request, ctx: RouteContext<"/api/bids/[id]/status">) {
  const { id } = await ctx.params;

  const bid = await db.bid.findUnique({
    where: { id },
    select: { status: true, listingId: true, amountCents: true },
  });

  if (!bid) return NextResponse.json({ error: "Unknown bid" }, { status: 404 });

  const rank =
    bid.status === PaymentStatus.PAID ? await rankOfListing(bid.listingId) : null;

  return NextResponse.json(
    { status: bid.status, rank, amountCents: bid.amountCents },
    { headers: { "cache-control": "no-store" } },
  );
}
