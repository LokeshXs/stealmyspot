import "server-only";

import { db } from "@/lib/db";
import { ListingStatus } from "@/generated/prisma/enums";
import { applyTakeover, sortBoard } from "@/lib/ranking";

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

  const index = applyTakeover(sortBoard(listings), takeover).findIndex(
    (l) => l.id === listingId,
  );
  return index >= 0 ? index + 1 : null;
}
