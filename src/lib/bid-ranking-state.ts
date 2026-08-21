import "server-only";

import { db } from "@/lib/db";
import { rankOfListing } from "@/lib/rank-lookup";
import { partitionTakeover, sortBoard } from "@/lib/ranking";

/** Resolves whether a paid bid is still waiting for an honest post-reservation rank. */
export async function getBidRankingState(bid: {
  listingId: string;
  paidAt: Date | null;
  achievedRank: number | null;
}) {
  const takeoverAtPayment = bid.paidAt
    ? await db.takeover.findFirst({
        where: {
          startsAt: { lte: bid.paidAt },
          endsAt: { gte: bid.paidAt },
        },
        orderBy: { startsAt: "desc" },
      })
    : null;

  const paidDuringTakeover = Boolean(
    takeoverAtPayment &&
      takeoverAtPayment.listingId !== bid.listingId &&
      !takeoverAtPayment.frozenIds.includes(bid.listingId),
  );
  const takeoverStillActive = Boolean(takeoverAtPayment && takeoverAtPayment.endsAt.getTime() > Date.now());
  const partition = takeoverAtPayment && takeoverStillActive
    ? partitionTakeover(
        sortBoard(await db.listing.findMany({
          where: { status: "PUBLISHED" },
          select: { id: true, amountCents: true, rankedAt: true },
        })),
        takeoverAtPayment,
      )
    : null;
  const rankingPending = Boolean(partition?.queued.some((listing) => listing.id === bid.listingId));
  const rank = rankingPending ? null : await rankOfListing(bid.listingId);
  const artificialQueuedRank = paidDuringTakeover && bid.achievedRank !== null && bid.achievedRank > 50;

  return {
    rankingPending,
    takeoverEndsAt: rankingPending && takeoverAtPayment
      ? takeoverAtPayment.endsAt.toISOString()
      : null,
    achievedRank: rankingPending || artificialQueuedRank ? null : bid.achievedRank,
    rank,
  };
}
