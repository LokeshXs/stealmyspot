import "server-only";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { BidKind, ListingStatus, PaymentStatus } from "@/generated/prisma/enums";
import { PAGE_SIZE, sortBoard, takeoverEndsAt } from "@/lib/ranking";

export type FulfillOutcome =
  | { status: "fulfilled"; listingId: string; amountCents: number }
  | { status: "already_paid" }
  | { status: "not_found" };

/**
 * The single path that publishes a listing. Both the mock checkout and the real
 * Dodo webhook call this, and it is safe to call repeatedly for the same bid —
 * Dodo retries a delivery up to 8 times.
 *
 * The rank comes from `bid.amountCents`, which we recorded when the checkout was
 * created. It is deliberately NOT read from the payment: Dodo is a Merchant of
 * Record and adds tax on top, so the charged total is not the bid.
 */
export async function fulfillBid(
  bidId: string,
  paymentId?: string | null,
  customerEmail?: string | null,
): Promise<FulfillOutcome> {
  const outcome = await db.$transaction(async (tx) => {
    const bid = await tx.bid.findUnique({ where: { id: bidId } });
    if (!bid) return { status: "not_found" } as const;
    if (bid.status === PaymentStatus.PAID) return { status: "already_paid" } as const;

    const now = new Date();

    await tx.bid.update({
      where: { id: bid.id },
      data: {
        status: PaymentStatus.PAID,
        paidAt: now,
        ...(paymentId ? { paymentId } : {}),
        ...(customerEmail ? { customerEmail } : {}),
      },
    });

    await tx.listing.update({
      where: { id: bid.listingId },
      data: {
        amountCents: bid.amountCents,
        status: ListingStatus.PUBLISHED,
        rankedAt: now,
      },
    });

    if (bid.kind === BidKind.TAKEOVER) {
      // Snapshot page 1 as it stands *after* this bid lands, minus the winner —
      // that frozen order is what fills the rest of the first page for 3 hours.
      const published = await tx.listing.findMany({
        where: { status: ListingStatus.PUBLISHED },
        select: { id: true, amountCents: true, rankedAt: true },
      });

      const frozenIds = sortBoard(published)
        .filter((l) => l.id !== bid.listingId)
        .slice(0, PAGE_SIZE - 1)
        .map((l) => l.id);

      await tx.takeover.create({
        data: {
          listingId: bid.listingId,
          amountCents: bid.amountCents,
          startsAt: now,
          endsAt: takeoverEndsAt(now),
          frozenIds,
        },
      });
    }

    return {
      status: "fulfilled",
      listingId: bid.listingId,
      amountCents: bid.amountCents,
    } as const;
  });

  if (outcome.status === "fulfilled") {
    /*
     * The transaction is already committed by this point, so a cache failure
     * must not surface as a failed fulfilment — that would invite a re-run
     * against a payment that has in fact settled.
     *
     * `revalidatePath` needs a Next request context, which `scripts/reconcile.ts`
     * does not have. Losing it there is harmless: the board is `force-dynamic`
     * and re-reads on the next request regardless.
     */
    try {
      revalidatePath("/");
    } catch (error) {
      console.warn(
        "[fulfillBid] revalidate skipped (no request context):",
        error instanceof Error ? error.message : error,
      );
    }
  }

  return outcome;
}

/** A checkout that failed leaves no trace: an unpaid, never-published listing is removed. */
export async function failBid(bidId: string): Promise<void> {
  await db.$transaction(async (tx) => {
    const bid = await tx.bid.findUnique({ where: { id: bidId } });
    if (!bid || bid.status === PaymentStatus.PAID) return;

    await tx.bid.update({
      where: { id: bid.id },
      data: { status: PaymentStatus.FAILED },
    });

    const paidCount = await tx.bid.count({
      where: { listingId: bid.listingId, status: PaymentStatus.PAID },
    });

    if (paidCount === 0) {
      await tx.listing.deleteMany({
        where: { id: bid.listingId, status: ListingStatus.PENDING },
      });
    }
  });
}
