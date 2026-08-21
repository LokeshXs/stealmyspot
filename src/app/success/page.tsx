import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SuccessStatus } from "@/components/success-status";
import { db } from "@/lib/db";
import { PaymentStatus } from "@/generated/prisma/enums";
import { getBidRankingState } from "@/lib/bid-ranking-state";
import { imageForIdentity, labelForKey } from "@/lib/identity";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Bid Status | Steal My Spot",
  alternates: { canonical: null },
  openGraph: null,
  twitter: null,
  robots: { index: false, follow: false, googleBot: { index: false, follow: false } },
};

/**
 * Dodo's return_url lands here. The redirect can beat the webhook, so this page
 * never claims success on its own — it polls the bid until the webhook confirms.
 */
export default async function SuccessPage({ searchParams }: PageProps<"/success">) {
  const params = await searchParams;
  const raw = Array.isArray(params.bid) ? params.bid[0] : params.bid;
  if (!raw) notFound();

  const bid = await db.bid.findUnique({
    where: { id: raw },
    select: {
      id: true,
      status: true,
      amountCents: true,
      listingId: true,
      achievedRank: true,
      paidAt: true,
      listing: { select: { identityType: true, identityKey: true, imageUrl: true } },
    },
  });

  if (!bid) notFound();

  // When the webhook has already landed there is nothing to poll for — resolve
  // the rank here so the page shows "#1" on first paint rather than after a tick.
  const ranking = bid.status === PaymentStatus.PAID
    ? await getBidRankingState(bid)
    : { rank: null, achievedRank: bid.achievedRank, rankingPending: false, takeoverEndsAt: null };
  const initialRank = ranking.achievedRank ?? ranking.rank;

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col justify-center px-4 py-10 sm:px-6 sm:py-16">
      <SuccessStatus
        bidId={bid.id}
        initialStatus={bid.status}
        initialRank={initialRank}
        initialAchievedRank={ranking.achievedRank}
        initialRankingPending={ranking.rankingPending}
        initialTakeoverEndsAt={ranking.takeoverEndsAt}
        amountCents={bid.amountCents}
        listingLabel={labelForKey(bid.listing.identityKey)}
        listingImageUrl={imageForIdentity(bid.listing.identityType, bid.listing.imageUrl)}
      />
    </main>
  );
}
