"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { Spinner } from "@/components/icons";
import { SuccessConfetti } from "@/components/success-confetti";
import { TakeoverCountdown } from "@/components/takeover-countdown";
import { Avatar } from "@/components/ui/avatar";
import { buttonVariants } from "@/components/ui/button";
import { Wordmark } from "@/components/wordmark";
import { canonicalOrigin } from "@/lib/env";
import { formatDollars } from "@/lib/format";
import { initialFor } from "@/lib/identity";
import { cn } from "@/lib/utils";

type Status = "PENDING" | "PAID" | "FAILED" | "EXPIRED";
const POLL_MS = 2_000;
const GIVE_UP_AFTER_MS = 60_000;

function ReceiptShell({ status, children }: { status: string; children: ReactNode }) {
  return (
    <section className="w-full border-2 border-foreground bg-card text-left shadow-hard" aria-live="polite">
      <header className="flex flex-col gap-3 border-b-2 border-foreground px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-7">
        <Wordmark size="sm" />
        <p className="w-fit border border-foreground bg-primary/10 px-2.5 py-1 text-[0.65rem] font-black tracking-[0.18em] uppercase">{status}</p>
      </header>
      {children}
    </section>
  );
}

function RankSeal({ rank }: { rank: number | null }) {
  const displayedRank = rank ? String(rank).padStart(2, "0") : "—";
  const rankSize = displayedRank.length >= 4 ? "text-6xl" : displayedRank.length === 3 ? "text-7xl" : "text-8xl";
  return (
    <div className="flex min-h-56 flex-col items-center justify-center border-b-2 border-foreground bg-primary px-6 py-8 text-primary-foreground sm:min-h-72 sm:border-r-2 sm:border-b-0">
      <span className="text-[0.68rem] font-black tracking-[0.28em] uppercase">Spot</span>
      <span className={cn("mt-2 font-black leading-none tracking-[-0.08em] tabular-nums", rankSize)}>{displayedRank}</span>
      <span className="mt-5 border border-current px-2 py-1 text-[0.58rem] font-extrabold tracking-[0.2em] uppercase opacity-90">Ledger entry</span>
    </div>
  );
}

export function SuccessStatus({ bidId, initialStatus, initialRank, initialAchievedRank, initialRankingPending, initialTakeoverEndsAt, amountCents, listingLabel, listingImageUrl }: {
  bidId: string; initialStatus: Status; initialRank: number | null; initialAchievedRank: number | null;
  initialRankingPending: boolean; initialTakeoverEndsAt: string | null;
  amountCents: number; listingLabel: string; listingImageUrl: string | null;
}) {
  const [status, setStatus] = useState<Status>(initialStatus);
  const [rank, setRank] = useState<number | null>(initialRank);
  const [achievedRank, setAchievedRank] = useState<number | null>(initialAchievedRank);
  const [rankingPending, setRankingPending] = useState(initialRankingPending);
  const [takeoverEndsAt, setTakeoverEndsAt] = useState(initialTakeoverEndsAt);
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    if (status !== "PENDING" && !rankingPending) return;
    const startedAt = Date.now();
    let cancelled = false;
    const timer = window.setInterval(async () => {
      if (status === "PENDING" && Date.now() - startedAt > GIVE_UP_AFTER_MS) {
        if (!cancelled) setTimedOut(true);
        window.clearInterval(timer);
        return;
      }
      try {
        const response = await fetch(`/api/bids/${bidId}/status`, { cache: "no-store" });
        if (!response.ok) return;
        const data = (await response.json()) as { status: Status; rank: number | null; achievedRank: number | null; rankingPending: boolean; takeoverEndsAt: string | null };
        if (cancelled) return;
        setStatus(data.status);
        setRank(data.rank);
        setAchievedRank(data.achievedRank);
        setRankingPending(data.rankingPending);
        setTakeoverEndsAt(data.takeoverEndsAt);
      } catch {
        // A single dropped request should not interrupt payment verification.
      }
    }, POLL_MS);
    return () => { cancelled = true; window.clearInterval(timer); };
  }, [bidId, status, rankingPending]);

  if (status === "PAID") {
    if (rankingPending && takeoverEndsAt) {
      const shareText = `I just secured a bid for ${listingLabel} on Steal My Spot. It will be ranked when page one reopens 👀`;
      const shareUrl = `${canonicalOrigin}/?utm_source=x&utm_medium=share&utm_campaign=reservation`;
      const xIntent = `https://x.com/intent/post?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
      return <><SuccessConfetti /><ReceiptShell status="Payment cleared"><div className="grid sm:grid-cols-[15rem_1fr]"><div className="flex min-h-56 flex-col items-center justify-center border-b-2 border-foreground bg-primary px-6 py-8 text-center text-primary-foreground sm:min-h-72 sm:border-r-2 sm:border-b-0"><span className="text-[0.68rem] font-black tracking-[0.24em] uppercase">Ranking pending</span><TakeoverCountdown endsAt={takeoverEndsAt} className="mt-3 text-5xl font-black tracking-[-0.05em]" /><span className="mt-5 border border-current px-2 py-1 text-[0.58rem] font-extrabold tracking-[0.16em] uppercase">Until page one reopens</span></div><div className="flex min-w-0 flex-col justify-center px-5 py-8 sm:px-9 sm:py-10"><p className="text-[0.68rem] font-black tracking-[0.22em] text-primary uppercase">Your bid is secured</p><h1 className="mt-2 text-3xl font-black tracking-[-0.04em] sm:text-5xl">Your product will be ranked when the reservation ends.</h1><div className="mt-7 flex min-w-0 items-center gap-3 border-2 border-foreground bg-background p-3 shadow-hard-sm"><Avatar src={listingImageUrl} alt="" fallback={initialFor(listingLabel)} className="size-12 shrink-0 rounded-none border border-foreground" /><div className="min-w-0 flex-1"><p className="truncate text-base font-black sm:text-lg">{listingLabel}</p><p className="mt-0.5 text-[0.63rem] font-bold tracking-[0.14em] text-muted-foreground uppercase">Paid · awaiting rank</p></div></div></div></div><div className="border-t-2 border-foreground px-5 py-5 sm:px-7"><p className="text-[0.62rem] font-black tracking-[0.18em] text-muted-foreground uppercase">Standing bid</p><p className="mt-1 text-4xl font-black tracking-[-0.04em] tabular-nums">{formatDollars(amountCents)}</p></div><footer className="flex flex-col gap-5 border-t-2 border-foreground px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-7"><a href={xIntent} target="_blank" rel="noopener noreferrer" className={cn(buttonVariants({ variant: "chunky" }))}>Share on X</a><Link href="/" className="w-fit text-sm font-bold underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary">Back to the ledger →</Link></footer></ReceiptShell></>;
    }
    const displayedRank = achievedRank ?? rank;
    const shareText = `I just put ${listingLabel} at #${displayedRank ?? "—"} on the Steal My Spot leaderboard 👀\n\nThink you can take the spot?`;
    const shareUrl = `${canonicalOrigin}/?utm_source=x&utm_medium=share&utm_campaign=achievement`;
    const xIntent = `https://x.com/intent/post?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
    return (
      <>
        <SuccessConfetti />
        <ReceiptShell status="Payment cleared">
          <div className="grid sm:grid-cols-[15rem_1fr]">
            <RankSeal rank={displayedRank} />
            <div className="flex min-w-0 flex-col justify-center px-5 py-8 sm:px-9 sm:py-10">
              <p className="text-[0.68rem] font-black tracking-[0.22em] text-primary uppercase">Your spot is live</p>
              <h1 className="mt-2 text-3xl font-black tracking-[-0.04em] sm:text-5xl">Entered the ledger at <span className="marker-stroke whitespace-nowrap">#{displayedRank ?? "—"}</span></h1>
              <div className="mt-7 flex min-w-0 items-center gap-3 border-2 border-foreground bg-background p-3 shadow-hard-sm">
                <Avatar src={listingImageUrl} alt="" fallback={initialFor(listingLabel)} className="size-12 shrink-0 rounded-none border border-foreground" />
                <div className="min-w-0 flex-1"><p className="truncate text-base font-black sm:text-lg">{listingLabel}</p><p className="mt-0.5 text-[0.63rem] font-bold tracking-[0.14em] text-muted-foreground uppercase">Paid placement</p></div>
                {displayedRank === 1 ? <span className="shrink-0 border border-foreground bg-primary px-2 py-1 text-[0.58rem] font-black tracking-[0.12em] text-primary-foreground uppercase">Leader</span> : null}
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 border-t-2 border-foreground">
            <div className="border-r-2 border-foreground px-5 py-5 sm:px-7"><p className="text-[0.62rem] font-black tracking-[0.18em] text-muted-foreground uppercase">Standing bid</p><p className="mt-1 text-3xl font-black tracking-[-0.04em] tabular-nums sm:text-4xl">{formatDollars(amountCents)}</p></div>
            <div className="px-5 py-5 sm:px-7"><p className="text-[0.62rem] font-black tracking-[0.18em] text-muted-foreground uppercase">Next bid to pass</p><p className="mt-1 text-3xl font-black tracking-[-0.04em] tabular-nums sm:text-4xl">{formatDollars(amountCents + 100)}</p></div>
          </div>
          <p className="border-t-2 border-foreground px-5 py-4 text-sm font-medium text-muted-foreground sm:px-7">Raise this listing later and you only pay the difference.</p>
          <footer className="flex flex-col gap-5 border-t-2 border-foreground px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-7">
            <a href={xIntent} target="_blank" rel="noopener noreferrer" className={cn(buttonVariants({ variant: "chunky" }))}>Share your win on X</a>
            <Link href="/" className="w-fit text-sm font-bold underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary">Back to the ledger →</Link>
          </footer>
        </ReceiptShell>
      </>
    );
  }

  if (status === "FAILED" || status === "EXPIRED") {
    return <ReceiptShell status="Not completed"><div className="grid sm:grid-cols-[15rem_1fr]"><div className="flex min-h-44 items-center justify-center border-b-2 border-foreground bg-muted text-7xl font-black text-muted-foreground sm:min-h-72 sm:border-r-2 sm:border-b-0" aria-hidden="true">×</div><div className="px-5 py-9 sm:px-9 sm:py-12"><p className="text-[0.68rem] font-black tracking-[0.22em] text-muted-foreground uppercase">No ledger entry</p><h1 className="mt-2 text-3xl font-black tracking-[-0.04em] sm:text-5xl">Nothing went through.</h1><p className="mt-4 max-w-lg text-sm leading-relaxed text-muted-foreground">You were not charged and no position changed hands. Start again whenever you like.</p><Link href="/" className={cn("mt-7", buttonVariants({ variant: "chunky" }))}>Return to the ledger</Link></div></div></ReceiptShell>;
  }

  return <ReceiptShell status={timedOut ? "Still verifying" : "Verifying payment"}><div className="grid sm:grid-cols-[15rem_1fr]"><div className="flex min-h-44 items-center justify-center border-b-2 border-foreground bg-primary/10 sm:min-h-72 sm:border-r-2 sm:border-b-0"><Spinner className="size-10 text-primary" aria-hidden="true" /></div><div className="px-5 py-9 sm:px-9 sm:py-12"><p className="text-[0.68rem] font-black tracking-[0.22em] text-primary uppercase">Payment check in progress</p><h1 className="mt-2 text-3xl font-black tracking-[-0.04em] sm:text-5xl">{timedOut ? "Still confirming your place" : "Confirming your place"}</h1><p className="mt-4 max-w-lg text-sm leading-relaxed text-muted-foreground">{timedOut ? "This is taking longer than usual. Do not pay again—your spot will appear as soon as confirmation reaches us." : "Your place enters the ledger as soon as payment clears. This usually takes a second or two."}</p><Link href="/" className="mt-7 inline-block text-sm font-bold underline-offset-4 hover:underline">Back to the ledger →</Link></div></div></ReceiptShell>;
}
