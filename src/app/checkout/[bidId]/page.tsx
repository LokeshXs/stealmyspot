import { notFound } from "next/navigation";
import Link from "next/link";
import { MockCheckoutForm } from "@/components/mock-checkout-form";
import { Wordmark } from "@/components/wordmark";
import { db } from "@/lib/db";
import { paymentProvider } from "@/lib/env";
import { BidKind, PaymentStatus } from "@/generated/prisma/enums";
import { getRankableListings } from "@/lib/board";
import { labelForKey } from "@/lib/identity";
import { formatDollars } from "@/lib/format";
import { previewRank } from "@/lib/ranking";

export const dynamic = "force-dynamic";

/** Stand-in for a hosted checkout. Only exists while PAYMENT_PROVIDER=mock. */
export default async function MockCheckoutPage({ params }: PageProps<"/checkout/[bidId]">) {
  if (paymentProvider !== "mock") notFound();

  const { bidId } = await params;
  const bid = await db.bid.findUnique({
    where: { id: bidId },
    include: { listing: true },
  });

  if (!bid) notFound();

  const listings = await getRankableListings();
  const rank = previewRank(bid.amountCents, listings, { excludeListingId: bid.listingId });
  const isTakeover = bid.kind === BidKind.TAKEOVER;
  const alreadyPaid = bid.status === PaymentStatus.PAID;

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-16">
      <Wordmark size="sm" className="mx-auto mb-8" />

      <div className="board-shadow rounded-2xl bg-card p-6">
        <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
          Mock checkout
        </p>
        <h1 className="mt-1 text-2xl font-bold tracking-[-0.02em]">
          {isTakeover ? "Leaderboard takeover" : `Claim #${rank}`}
        </h1>

        <dl className="mt-6 space-y-3 text-sm">
          <div className="flex items-baseline justify-between gap-4">
            <dt className="text-muted-foreground">Listing</dt>
            <dd className="truncate font-medium">{labelForKey(bid.listing.identityKey)}</dd>
          </div>
          <div className="flex items-baseline justify-between gap-4">
            <dt className="text-muted-foreground">Your bid</dt>
            <dd className="font-medium tabular-nums">{formatDollars(bid.amountCents)}</dd>
          </div>
          {bid.paidCents !== bid.amountCents ? (
            <div className="flex items-baseline justify-between gap-4">
              <dt className="text-muted-foreground">Already paid</dt>
              <dd className="font-medium tabular-nums">
                −{formatDollars(bid.amountCents - bid.paidCents)}
              </dd>
            </div>
          ) : null}
          <div className="flex items-baseline justify-between gap-4 border-t border-border pt-3">
            <dt className="font-semibold">Due now</dt>
            <dd className="text-lg font-bold text-primary tabular-nums">
              {formatDollars(bid.paidCents)}
            </dd>
          </div>
        </dl>

        <div className="mt-6">
          {alreadyPaid ? (
            <Link
              href={`/success?bid=${bid.id}`}
              className="block rounded-full bg-muted px-5 py-3 text-center text-sm font-bold"
            >
              Already paid — view your rank
            </Link>
          ) : (
            <MockCheckoutForm bidId={bid.id} amountCents={bid.paidCents} />
          )}
        </div>

        <p className="mt-4 text-center text-xs text-muted-foreground text-pretty">
          No card is charged. This page stands in for the Dodo Payments hosted checkout so the
          full flow works offline.
        </p>
      </div>

      <Link
        href="/"
        className="mx-auto mt-6 text-xs text-muted-foreground transition-colors hover:text-foreground"
      >
        ← Cancel and go back
      </Link>
    </main>
  );
}
