/**
 * Asks Dodo the truth about every unsettled bid and finishes the ones that were
 * actually paid.
 *
 *   pnpm tsx scripts/reconcile.ts          # report only
 *   pnpm tsx scripts/reconcile.ts --apply  # fulfil the paid ones
 *
 * The webhook is the happy path, but it is not a guarantee: a wrong URL, the
 * wrong signing secret, or a tunnel that died mid-payment all end with Dodo
 * holding the customer's money and this database still saying PENDING. Dodo
 * retries 8 times over ~10 hours, which covers a blip but not a misconfigured
 * endpoint. This is the backstop for that case.
 *
 * It calls the same idempotent `fulfillBid()` the webhook does, so running it
 * twice — or running it after a late webhook finally lands — changes nothing.
 */
import "dotenv/config";
import DodoPayments from "dodopayments";
import { db } from "../src/lib/db";
import { PaymentStatus } from "../src/generated/prisma/enums";
import { dodoEnv } from "../src/lib/env";
import { failBid, fulfillBid } from "../src/lib/payments/fulfill";

const APPLY = process.argv.includes("--apply");

/** Dodo statuses that mean the customer's money actually moved. */
const PAID: string[] = ["succeeded", "partially_captured", "partially_captured_and_capturable"];
const DEAD: string[] = ["failed", "cancelled"];

async function main() {
  const { apiKey, environment } = dodoEnv();
  const dodo = new DodoPayments({ bearerToken: apiKey, environment });

  const pending = await db.bid.findMany({
    where: { status: PaymentStatus.PENDING, provider: "dodo", sessionId: { not: null } },
    include: { listing: true },
    orderBy: { createdAt: "asc" },
  });

  if (pending.length === 0) {
    console.log("Nothing unsettled. Every Dodo bid is already resolved.");
    return db.$disconnect();
  }

  console.log(`${pending.length} unsettled bid(s)${APPLY ? "" : " — dry run, pass --apply to act"}\n`);

  for (const bid of pending) {
    const label = `${bid.listing.identityKey} $${bid.amountCents / 100}`;
    let session;
    try {
      session = await dodo.checkoutSessions.retrieve(bid.sessionId!);
    } catch (e) {
      console.log(`  ?  ${label} — could not read session: ${(e as Error).message}`);
      continue;
    }

    const status = session.payment_status ?? "(no payment yet)";

    if (PAID.includes(status)) {
      if (!APPLY) {
        console.log(`  ✓  ${label} — PAID at Dodo, not published here. Would fulfil.`);
        continue;
      }
      const outcome = await fulfillBid(bid.id, session.payment_id ?? null, session.customer_email ?? null);
      console.log(`  ✓  ${label} — ${outcome.status}`);
    } else if (DEAD.includes(status)) {
      if (!APPLY) {
        console.log(`  ✗  ${label} — ${status} at Dodo. Would mark failed.`);
        continue;
      }
      await failBid(bid.id);
      console.log(`  ✗  ${label} — marked failed`);
    } else {
      console.log(`  ·  ${label} — ${status}; leaving alone`);
    }
  }

  await db.$disconnect();
}

void main();
