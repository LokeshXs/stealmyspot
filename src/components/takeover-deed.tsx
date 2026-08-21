"use client";

import { Avatar } from "@/components/ui/avatar";
import { TakeoverCountdown } from "@/components/takeover-countdown";
import { trackListingClick } from "@/components/listing-row";
import type { BoardEntry, TakeoverSummary } from "@/lib/board";
import { formatCount, formatDollars, timeAgo } from "@/lib/format";
import { initialFor } from "@/lib/identity";

export function TakeoverDeed({ entry, takeover }: { entry: BoardEntry; takeover: TakeoverSummary }) {
  return (
    <article
      id="page-one-reservation"
      tabIndex={-1}
      className="relative scroll-mt-6 overflow-hidden border-2 border-foreground bg-card shadow-hard focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary"
    >
      <header className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-foreground px-4 py-3 sm:px-6">
        <p className="text-[0.65rem] font-black tracking-[0.2em] uppercase">Page one reservation</p>
        <div className="flex items-center gap-2 text-[0.65rem] font-black tracking-[0.13em] uppercase"><span className="size-2 bg-primary" aria-hidden="true" />Active · <TakeoverCountdown endsAt={takeover.endsAt} className="text-primary" /></div>
      </header>
      <div className="grid sm:grid-cols-[13rem_1fr]">
        <div className="flex min-h-48 flex-col items-center justify-center border-b-2 border-foreground bg-primary px-5 py-7 text-primary-foreground sm:border-r-2 sm:border-b-0">
          <span className="text-[0.65rem] font-black tracking-[0.25em] uppercase">Reserved</span>
          <span className="mt-1 text-7xl leading-none font-black tracking-[-0.08em] tabular-nums">#01</span>
          <span className="mt-4 border border-current px-2 py-1 text-[0.58rem] font-black tracking-[0.16em] uppercase">Page one</span>
        </div>
        <div className="relative min-w-0 px-5 py-7 sm:px-7">
          <a href={entry.sourceUrl} target="_blank" rel="sponsored noopener noreferrer" onClick={() => trackListingClick(entry.id)} onAuxClick={() => trackListingClick(entry.id)} aria-label={`${entry.label}, page-one reservation holder`} className="absolute inset-0 z-10 focus-visible:outline-2 focus-visible:outline-offset-[-4px] focus-visible:outline-primary" />
          <p className="text-[0.62rem] font-black tracking-[0.18em] text-primary uppercase">Page-one holder</p>
          <div className="mt-3 flex min-w-0 items-center gap-3">
            <Avatar src={entry.imageUrl} alt="" fallback={initialFor(entry.label)} className="size-14 shrink-0 rounded-none border border-foreground" />
            <div className="min-w-0"><h3 className="truncate text-2xl font-black tracking-[-0.03em]">{entry.label}</h3><p className="mt-1 text-xs font-bold text-muted-foreground">Paid {formatDollars(takeover.amountCents)} · ends <span suppressHydrationWarning>{new Date(takeover.endsAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}</span></p></div>
          </div>
          {entry.description ? <p className="mt-4 line-clamp-2 text-sm leading-relaxed text-muted-foreground">{entry.description}</p> : null}
          <p className="mt-3 text-[11px] font-medium text-muted-foreground/75 tabular-nums">{formatCount(entry.clickCount)} clicks · {timeAgo(entry.rankedAt)}</p>
        </div>
      </div>
      <p className="border-t-2 border-foreground bg-primary/10 px-4 py-3 text-xs font-bold sm:px-6">Occupied page-one positions are frozen for one hour. New bids fill any remaining space.</p>
    </article>
  );
}
