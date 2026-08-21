import "server-only";

import { db } from "@/lib/db";
import { ListingStatus } from "@/generated/prisma/enums";
import { partitionTakeover, sortBoard, takeoverRankOf } from "@/lib/ranking";

/** Current position of a listing on the live board, or null if it isn't published. */
export async function rankOfListing(listingId: string): Promise<number | null> {
  const [listings, takeover] = await Promise.all([
    db.listing.findMany({
      where: { status: ListingStatus.PUBLISHED },
      select: { id: true, amountCents: true, rankedAt: true },
    }),
    db.takeover.findFirst({
      where: { endsAt: { gt: new Date() } },
      orderBy: { startsAt: "desc" },
    }),
  ]);

  const sorted = sortBoard(listings);
  if (takeover) {
    return takeoverRankOf(listingId, partitionTakeover(sorted, takeover));
  }

  const index = sorted.findIndex((listing) => listing.id === listingId);
  return index >= 0 ? index + 1 : null;
}
