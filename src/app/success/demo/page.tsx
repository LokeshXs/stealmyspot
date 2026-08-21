import type { Metadata } from "next";
import { SuccessStatus } from "@/components/success-status";

export const metadata: Metadata = {
  title: "Success Preview | Steal My Spot",
  robots: { index: false, follow: false },
};

/** Visual preview of the exact screen shown after a settled payment. */
export default function SuccessDemoPage() {
  return (
    <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col justify-center px-4 py-10 sm:px-6 sm:py-16">
      <SuccessStatus
        bidId="demo"
        initialStatus="PAID"
        initialRank={1}
        initialAchievedRank={1}
        initialRankingPending={false}
        initialTakeoverEndsAt={null}
        amountCents={1400}
        listingLabel="mockup.product"
        listingImageUrl={null}
      />
    </main>
  );
}
