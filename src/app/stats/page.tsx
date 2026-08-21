import type { Metadata } from "next";
import { SiteFooter } from "@/components/site-footer";
import { Wordmark } from "@/components/wordmark";
import { getStats } from "@/lib/board";
import { siteTitle } from "@/lib/env";
import { formatCount, formatDollars } from "@/lib/format";
import { getPresenceCounts } from "@/lib/presence";

export const metadata: Metadata = { title: `Live stats · ${siteTitle}` };
export const dynamic = "force-dynamic";

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="board-shadow rounded-2xl bg-card px-5 py-6">
      <p className="text-3xl font-bold tracking-[-0.03em] text-primary tabular-nums">{value}</p>
      <p className="mt-1 text-sm text-muted-foreground">{label}</p>
    </div>
  );
}

export default async function StatsPage() {
  const [stats, presence] = await Promise.all([getStats(), getPresenceCounts()]);

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-4 pt-6 pb-16">
      <header className="text-center">
        <Wordmark size="sm" />
      </header>

      <h1 className="mt-10 text-3xl font-bold tracking-[-0.03em]">Live stats</h1>
      <p className="mt-3 text-muted-foreground text-pretty">
        Everything the board knows about itself, straight from the database.
      </p>

      <div className="mt-8 grid grid-cols-2 gap-3">
        <Stat label="Visitors online" value={formatCount(presence.online)} />
        <Stat label="Visitors in the last hour" value={formatCount(presence.lastHour)} />
        <Stat label="Listings on the board" value={formatCount(stats.listingCount)} />
        <Stat label="Clicks sent to listings" value={formatCount(stats.totalClicks)} />
        <Stat label="Bids paid" value={formatCount(stats.bidCount)} />
        <Stat label="Total volume" value={formatDollars(stats.volumeCents)} />
      </div>

      <SiteFooter />
    </main>
  );
}
