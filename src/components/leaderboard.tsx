"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { ClaimSection } from "@/components/claim-section";
import { ListingRow } from "@/components/listing-row";
import { Pagination } from "@/components/pagination";
import { Spinner } from "@/components/icons";
import type { BoardPage } from "@/lib/board";
import { formatCount, formatDollars } from "@/lib/format";
import { MIN_BID_CENTS, TAKEOVER_HOURS } from "@/lib/ranking";

const POLL_MS = 30_000;

export function Leaderboard({ initialBoard }: { initialBoard: BoardPage }) {
  const [board, setBoard] = useState(initialBoard);
  const [lastServerBoard, setLastServerBoard] = useState(initialBoard);
  const [refreshing, startRefresh] = useTransition();

  // A fresh server render (after a bid lands) must win over whatever we last
  // polled. Adjusting during render rather than in an effect avoids a wasted
  // pass showing stale rows. https://react.dev/reference/react/useState
  if (lastServerBoard !== initialBoard) {
    setLastServerBoard(initialBoard);
    setBoard(initialBoard);
  }

  const load = useCallback(async (page: number) => {
    const res = await fetch(`/api/leaderboard?page=${page}`, { cache: "no-store" });
    if (!res.ok) return;
    setBoard((await res.json()) as BoardPage);
  }, []);

  const refresh = useCallback(
    (page: number) => startRefresh(async () => void (await load(page))),
    [load],
  );

  useEffect(() => {
    const timer = setInterval(() => void load(board.page), POLL_MS);
    return () => clearInterval(timer);
  }, [load, board.page]);

  const amounts = board.entries.map((e) => e.amountCents);

  return (
    <div className="flex flex-col gap-3">
      <ClaimSection
        nextBidCents={board.nextBidCents}
        takeoverPriceCents={board.takeoverPriceCents}
        amounts={amounts}
      />

      <div>
        <div className="mb-1.5 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => refresh(board.page)}
            disabled={refreshing}
            aria-busy={refreshing}
            className="inline-flex cursor-pointer items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground disabled:cursor-not-allowed"
          >
            {refreshing ? <Spinner /> : <Spinner className="animate-none opacity-60" />}
            Refresh
          </button>
          <Pagination
            page={board.page}
            pageCount={board.pageCount}
            onPageChange={refresh}
            label="Ranking pages top"
          />
        </div>

        {board.takeoverEndsAt ? (
          <p className="mb-2 rounded-lg border border-primary/20 bg-primary/8 px-3 py-1.5 text-center text-xs text-pretty text-muted-foreground">
            <span className="font-semibold text-primary">Takeover in progress.</span> The first page
            is locked for {TAKEOVER_HOURS} hours — new bids join from page 2.
          </p>
        ) : null}

        <div
          id="leaderboard"
          className="board-shadow scroll-mt-6 rounded-2xl bg-card px-3 py-1.5 md:px-7 md:py-3"
        >
          {board.entries.length === 0 ? (
            <EmptyState />
          ) : (
            board.entries.map((entry) => <ListingRow key={entry.id} entry={entry} />)
          )}
        </div>

        {board.total > 0 ? (
          <div className="mt-2 flex items-center justify-between gap-3">
            <p className="text-xs text-muted-foreground tabular-nums">
              {formatCount(board.rangeStart)} - {formatCount(board.rangeEnd)} of{" "}
              {formatCount(board.total)}
            </p>
            <Pagination
              page={board.page}
              pageCount={board.pageCount}
              onPageChange={refresh}
              label="Ranking pages bottom"
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="px-2 py-14 text-center">
      <p className="text-lg font-bold">No one has claimed a rank yet.</p>
      <p className="mx-auto mt-1 max-w-sm text-sm text-pretty text-muted-foreground">
        The board is empty, so the top spot is going for{" "}
        <span className="font-semibold text-primary">{formatDollars(MIN_BID_CENTS)}</span>. Be the
        first.
      </p>
    </div>
  );
}
