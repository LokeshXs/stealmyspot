"use client";

import { ListingRow } from "@/components/listing-row";
import { Pagination } from "@/components/pagination";
import { useBoard } from "@/components/board-context";
import { formatDollars } from "@/lib/format";
import { MIN_BID_CENTS, TAKEOVER_HOURS } from "@/lib/ranking";

/** The ledger itself: hairline-divided rows on the page, no card, no shadow. */
export function Leaderboard() {
  const { board, refresh } = useBoard();

  return (
    <div>
      {board.takeoverEndsAt ? (
        <p className="rule-b bg-primary/[0.06] px-3 py-2 font-mono text-[11px] text-muted-foreground sm:px-5">
          <span className="text-primary">Page one is held.</span> Reserved for {TAKEOVER_HOURS}{" "}
          hours — new entries join from page two until it lapses.
        </p>
      ) : null}

      {board.entries.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="divide-y divide-[--rule] border-y border-[--rule]">
          {board.entries.map((entry) => (
            <ListingRow key={entry.id} entry={entry} />
          ))}
        </div>
      )}

      <Pagination
        page={board.page}
        pageCount={board.pageCount}
        rangeStart={board.rangeStart}
        rangeEnd={board.rangeEnd}
        total={board.total}
        onPageChange={refresh}
      />
    </div>
  );
}

function EmptyState() {
  return (
    <div className="border-y border-[--rule] px-3 py-16 text-center sm:px-5">
      <p className="font-display text-2xl">The ledger is empty.</p>
      <p className="mx-auto mt-2 max-w-xs text-sm text-pretty text-muted-foreground">
        The first entry sets the floor at{" "}
        <span className="font-mono text-foreground">{formatDollars(MIN_BID_CENTS)}</span>.
      </p>
    </div>
  );
}
