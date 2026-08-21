"use client";

import { Recycle, Spinner } from "@/components/icons";
import { useBoard } from "@/components/board-context";
import { formatCount, formatDollars } from "@/lib/format";

/**
 * The strip under the masthead: what the ledger currently holds, plus how fresh
 * it is. This absorbs the old standalone Refresh button — freshness and the
 * means to fix it belong in the same place.
 */
export function Dateline({ volumeCents }: { volumeCents: number }) {
  const { board, refresh, refreshing, staleSeconds } = useBoard();

  const items = [
    `${formatCount(board.total)} ${board.total === 1 ? "entry" : "entries"}`,
    `${formatDollars(volumeCents)} placed`,
    board.topBidCents > 0 ? `top ${formatDollars(board.topBidCents)}` : "floor $1",
  ];

  return (
    <div className="rule-b flex flex-wrap items-center justify-between gap-x-4 gap-y-1 py-2 text-[11px] font-medium text-muted-foreground">
      <p className="flex flex-wrap items-center gap-x-2 tabular-nums">
        {items.map((item, i) => (
          <span key={item} className="flex items-center gap-2">
            {i > 0 ? (
              <span aria-hidden="true" className="text-rule">
                ·
              </span>
            ) : null}
            {item}
          </span>
        ))}
      </p>

      <button
        type="button"
        onClick={() => refresh()}
        disabled={refreshing}
        aria-busy={refreshing}
        aria-label="Reload the ledger"
        className="inline-flex cursor-pointer items-center gap-1.5 tabular-nums transition-colors hover:text-foreground disabled:cursor-not-allowed"
      >
        {refreshing ? <Spinner /> : <Recycle />}
        {refreshing ? "reloading" : `updated ${staleSeconds}s ago`}
      </button>
    </div>
  );
}
