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
      <Wordmark size="sm" className="mx-auto mb-10" />

      <div className="rounded-md border border-border">
        <p className="rule-b px-4 py-2 text-[11px] font-bold tracking-[0.16em] text-muted-foreground uppercase">
          Stand-in checkout
        </p>

        <div className="p-4">
          <h1 className="text-2xl font-black tracking-[-0.02em]">
            {isTakeover ? "Reserve the front page" : `Position #${rank}`}
          </h1>

          <dl className="mt-5 text-sm">
            <div className="rule-t flex items-baseline justify-between gap-4 py-2.5">
              <dt className="text-muted-foreground">Entry</dt>
              <dd className="truncate">{labelForKey(bid.listing.identityKey)}</dd>
            </div>
            <div className="rule-t flex items-baseline justify-between gap-4 py-2.5">
              <dt className="text-muted-foreground">Your number</dt>
              <dd className="font-semibold tabular-nums">{formatDollars(bid.amountCents)}</dd>
            </div>
            {bid.paidCents !== bid.amountCents ? (
              <div className="rule-t flex items-baseline justify-between gap-4 py-2.5">
                <dt className="text-muted-foreground">Already standing</dt>
                <dd className="font-semibold tabular-nums">
                  −{formatDollars(bid.amountCents - bid.paidCents)}
                </dd>
              </div>
            ) : null}
            <div className="rule-t flex items-baseline justify-between gap-4 py-2.5">
              <dt className="font-medium">Due now</dt>
              <dd className="text-lg font-black text-primary tabular-nums">
                {formatDollars(bid.paidCents)}
              </dd>
            </div>
          </dl>

          <div className="mt-5">
            {alreadyPaid ? (
              <Link
                href={`/success?bid=${bid.id}`}
                className="block rounded-md border border-border px-4 py-2.5 text-center text-sm"
              >
                Already settled — see your place
              </Link>
            ) : (
              <MockCheckoutForm bidId={bid.id} amountCents={bid.paidCents} />
            )}
          </div>

          <p className="mt-4 text-xs leading-relaxed text-pretty text-muted-foreground">
            No card is touched. This page stands in for the Dodo Payments checkout so the whole
            flow can be exercised offline.
          </p>
        </div>
      </div>

      <Link
        href="/"
        className="mx-auto mt-6 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        ← abandon
      </Link>
    </main>
  );
}
