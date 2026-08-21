"use client";

import { RollingNumber } from "@/components/rolling-number";
import { useBidForm } from "@/components/bid-form-context";
import { Avatar } from "@/components/ui/avatar";
import type { BoardEntry } from "@/lib/board";
import { formatCount, formatDollars, timeAgo } from "@/lib/format";
import { initialFor } from "@/lib/identity";
import { INCREMENT_CENTS, MAX_BID_CENTS } from "@/lib/ranking";
import { cn } from "@/lib/utils";

/**
 * Fire-and-forget click tracking. The anchor keeps its real href so the status
 * bar shows the true destination and navigation is never delayed by us.
 */
function trackClick(id: string) {
  const body = JSON.stringify({ id });
  if (typeof navigator !== "undefined" && navigator.sendBeacon) {
    navigator.sendBeacon("/api/click", new Blob([body], { type: "application/json" }));
    return;
  }
  void fetch("/api/click", { method: "POST", body, keepalive: true }).catch(() => {});
}

/** The top three read as a podium; everything below is a plain tile. */
const PODIUM = ["bg-rank-1 text-primary", "bg-rank-2 text-primary", "bg-rank-3 text-primary"];

export function ListingRow({ entry }: { entry: BoardEntry }) {
  const { setAmount, identityRef } = useBidForm();

  const isLeader = entry.rank === 1;
  const podium = PODIUM[entry.rank - 1];
  const nextCents = entry.amountCents + INCREMENT_CENTS;
  const nextPrice = formatDollars(nextCents);
  const outOfReach = nextCents > MAX_BID_CENTS;

  /**
   * Loads the composer with the price it takes to pass this row — and nothing
   * else. Deliberately does NOT touch the address field: that field holds *your*
   * listing, so prefilling this row's address would raise their entry and have
   * you pay to promote a competitor.
   */
  function takeThisPlace() {
    setAmount(String(Math.round(nextCents / 100)));
    identityRef.current?.focus();
    identityRef.current?.scrollIntoView({ block: "center", behavior: "smooth" });
  }

  return (
    <article className={cn("group relative", isLeader && "bg-primary/[0.05]")}>
      {/* The leader is marked in the margin rather than by boxing the row. */}
      {isLeader ? (
        <span aria-hidden="true" className="absolute inset-y-0 left-0 z-20 w-1 bg-[--accent-bar]" />
      ) : null}

      <div className="flex items-center gap-3 py-3.5 pr-2 pl-3 transition-colors group-hover:bg-muted/50 sm:gap-4 sm:pl-5">
        {/*
          Stretched link. The row used to be one big anchor, which meant the
          action below was a link too — clicking "take this place" just opened
          the listing. Overlaying the link instead lets a real button sit on top
          of it at a higher layer, and keeps the whole row clickable.
        */}
        <a
          href={entry.sourceUrl}
          target="_blank"
          rel="sponsored noopener noreferrer"
          onClick={() => trackClick(entry.id)}
          onAuxClick={() => trackClick(entry.id)}
          aria-label={`${entry.label} — rank ${entry.rank}, ${formatDollars(entry.amountCents)}`}
          className="absolute inset-0 z-10 rounded-sm focus-visible:ring-2 focus-visible:ring-ring/60 focus-visible:outline-none"
        />

        <span
          className={cn(
            "flex size-9 shrink-0 items-center justify-center rounded-md text-sm font-black tabular-nums sm:size-11 sm:text-base",
            podium ?? "bg-muted text-muted-foreground",
          )}
        >
          {String(entry.rank).padStart(2, "0")}
        </span>

        <Avatar
          src={entry.imageUrl}
          alt=""
          fallback={initialFor(entry.label)}
          className="size-9 rounded-md sm:size-11"
        />

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate text-sm font-bold sm:text-base">{entry.label}</p>
            {isLeader ? (
              <span className="shrink-0 rounded-md bg-primary px-1.5 py-0.5 text-[10px] font-black tracking-[0.1em] text-primary-foreground uppercase">
                Leader
              </span>
            ) : null}
          </div>

          {entry.description ? (
            <p className="mt-0.5 truncate text-xs text-muted-foreground">{entry.description}</p>
          ) : null}

          <p className="mt-1 text-[11px] font-medium text-muted-foreground/70 tabular-nums">
            {formatCount(entry.clickCount)} clicks
            <span aria-hidden="true" className="px-1.5">
              ·
            </span>
            <time dateTime={entry.rankedAt}>{timeAgo(entry.rankedAt)}</time>
          </p>
        </div>

        <div className="flex shrink-0 flex-col items-end gap-1.5">
          <span
            className={cn(
              "text-base font-black tabular-nums sm:text-lg",
              isLeader ? "text-primary" : "text-foreground",
            )}
          >
            <RollingNumber value={entry.amountCents / 100} />
          </span>

          {/* z-20 puts this above the stretched link so it receives its own clicks. */}
          {outOfReach ? null : (
            <button
              type="button"
              onClick={takeThisPlace}
              className="shadow-hard-sm relative z-20 cursor-pointer rounded-md border border-foreground bg-card px-2 py-0.5 text-[10px] font-bold whitespace-nowrap opacity-0 transition-all hover:-translate-x-px hover:-translate-y-px focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-ring/60 focus-visible:outline-none active:translate-x-[2px] active:translate-y-[2px] active:shadow-none group-hover:opacity-100 group-focus-within:opacity-100 max-sm:hidden"
            >
              take this place · {nextPrice}
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
