/** Dev helper: dump the board state. `pnpm tsx scripts/inspect.ts` */
import "dotenv/config";
import { db } from "../src/lib/db";

async function main() {
  const listings = await db.listing.findMany({
    orderBy: [{ amountCents: "desc" }, { rankedAt: "asc" }],
  });
  console.log("\nLISTINGS");
  console.table(
    listings.map((l) => ({
      key: l.identityKey,
      status: l.status,
      amountCents: l.amountCents,
      clicks: l.clickCount,
      name: (l.displayName ?? "").slice(0, 34),
    })),
  );

  const bids = await db.bid.findMany({ orderBy: { createdAt: "asc" } });
  console.log("\nBIDS");
  console.table(
    bids.map((b) => ({
      id: b.id.slice(0, 8),
      kind: b.kind,
      status: b.status,
      totalCents: b.amountCents,
      paidCents: b.paidCents,
    })),
  );

  const takeovers = await db.takeover.findMany();
  console.log("\nTAKEOVERS", takeovers.length);
  for (const t of takeovers) {
    console.log(
      `  listing=${t.listingId.slice(0, 8)} ends=${t.endsAt.toISOString()} frozen=${t.frozenIds.length}`,
    );
  }

  await db.$disconnect();
}

void main();
