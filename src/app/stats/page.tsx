import type { Metadata } from "next";
import { SiteFooter } from "@/components/site-footer";
import { PresenceStatRows } from "@/components/presence-stat-rows";
import { Wordmark } from "@/components/wordmark";
import { getStats } from "@/lib/board";
import { siteTitle } from "@/lib/env";
import { formatCount, formatDollars } from "@/lib/format";
import { getPresenceCounts } from "@/lib/presence";

export const metadata: Metadata = { title: `Figures · ${siteTitle}` };
export const dynamic = "force-dynamic";

function Row({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <tr className="rule-t">
      <th scope="row" className="py-3 pr-4 text-left text-sm font-normal text-muted-foreground">
        {label}
        {note ? <span className="block text-xs text-muted-foreground/60">{note}</span> : null}
      </th>
      <td className="py-3 text-right text-base font-bold text-foreground tabular-nums">{value}</td>
    </tr>
  );
}

export default async function StatsPage() {
  const [stats, presence] = await Promise.all([getStats(), getPresenceCounts()]);

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-4 pt-6 pb-12 sm:px-6">
      <header className="rule-masthead pb-3">
        <Wordmark size="sm" />
      </header>

      <h1 className="mt-10 text-4xl font-black tracking-[-0.03em]">Figures</h1>
      <p className="mt-3 max-w-xl text-sm leading-relaxed text-pretty text-muted-foreground">
        Everything the ledger knows about itself, read straight from the database at the moment you
        loaded this page.
      </p>

      <table className="mt-8 w-full border-b border-[--rule]">
        <caption className="sr-only">Ledger figures</caption>
        <tbody>
          <PresenceStatRows counts={presence} />
          <Row label="Entries on the ledger" value={formatCount(stats.listingCount)} />
          <Row label="Clicks sent onward" value={formatCount(stats.totalClicks)} />
          <Row label="Bids settled" value={formatCount(stats.bidCount)} />
          <Row
            label="Total placed"
            note="Sum of what was charged, excluding tax"
            value={formatDollars(stats.volumeCents)}
          />
        </tbody>
      </table>

      <SiteFooter />
    </main>
  );
}
