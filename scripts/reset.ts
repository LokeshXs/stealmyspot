/**
 * Dev helper: wipe the board back to empty. `pnpm tsx scripts/reset.ts`
 * Cascades take care of bids, clicks and takeovers.
 */
import "dotenv/config";
import { db } from "../src/lib/db";

async function main() {
  await db.takeover.deleteMany();
  await db.clickEvent.deleteMany();
  await db.bid.deleteMany();
  await db.listing.deleteMany();
  await db.webhookEvent.deleteMany();
  await db.presence.deleteMany();
  console.log("Board reset — 0 listings.");
  await db.$disconnect();
}

void main();
