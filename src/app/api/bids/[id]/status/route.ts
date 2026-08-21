import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { PaymentStatus } from "@/generated/prisma/enums";
import { getBidRankingState } from "@/lib/bid-ranking-state";

export const dynamic = "force-dynamic";

/** Polled by /success while the webhook is still in flight. */
export async function GET(_request: Request, ctx: RouteContext<"/api/bids/[id]/status">) {
  const { id } = await ctx.params;

  const bid = await db.bid.findUnique({
    where: { id },
    select: { status: true, listingId: true, amountCents: true, achievedRank: true, paidAt: true },
  });

  if (!bid) return NextResponse.json({ error: "Unknown bid" }, { status: 404 });

  const ranking = bid.status === PaymentStatus.PAID
    ? await getBidRankingState(bid)
    : { rank: null, achievedRank: bid.achievedRank, rankingPending: false, takeoverEndsAt: null };

  return NextResponse.json(
    {
      status: bid.status,
      rank: ranking.rank,
      achievedRank: ranking.achievedRank,
      rankingPending: ranking.rankingPending,
      takeoverEndsAt: ranking.takeoverEndsAt,
      amountCents: bid.amountCents,
    },
    { headers: { "cache-control": "no-store" } },
  );
}
