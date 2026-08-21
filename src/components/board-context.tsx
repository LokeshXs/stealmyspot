"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  useTransition,
} from "react";
import type { BoardPage } from "@/lib/board";

const POLL_MS = 30_000;

interface BoardContextValue {
  board: BoardPage;
  refreshing: boolean;
  refresh: (page?: number) => void;
  /** Seconds since the board last came back from the server. */
  staleSeconds: number;
}

const BoardContext = createContext<BoardContextValue | null>(null);

/**
 * Holds the live board so the bid composer and the listing table can sit in
 * sibling columns and still agree on what the current ranks are.
 */
export function BoardProvider({
  initialBoard,
  children,
}: {
  initialBoard: BoardPage;
  children: React.ReactNode;
}) {
  const [board, setBoard] = useState(initialBoard);
  const [lastServerBoard, setLastServerBoard] = useState(initialBoard);
  const [fetchedAt, setFetchedAt] = useState(0);
  const [staleSeconds, setStaleSeconds] = useState(0);
  const [refreshing, startRefresh] = useTransition();

  // A fresh server render (after a bid lands) must win over whatever we last
  // polled. Adjusting during render rather than in an effect avoids a wasted
  // pass showing stale rows. https://react.dev/reference/react/useState
  if (lastServerBoard !== initialBoard) {
    setLastServerBoard(initialBoard);
    setBoard(initialBoard);
    setFetchedAt(0);
  }

  const load = useCallback(async (page: number) => {
    const res = await fetch(`/api/leaderboard?page=${page}`, { cache: "no-store" });
    if (!res.ok) return;
    setBoard((await res.json()) as BoardPage);
    setFetchedAt(performance.now());
  }, []);

  const refresh = useCallback(
    (page?: number) => startRefresh(async () => void (await load(page ?? board.page))),
    [load, board.page],
  );

  useEffect(() => {
    const timer = setInterval(() => void load(board.page), POLL_MS);
    return () => clearInterval(timer);
  }, [load, board.page]);

  // Drives the "updated Ns ago" readout in the dateline.
  useEffect(() => {
    const tick = setInterval(() => {
      setStaleSeconds(Math.floor((performance.now() - fetchedAt) / 1000));
    }, 1_000);
    return () => clearInterval(tick);
  }, [fetchedAt]);

  return (
    <BoardContext value={{ board, refreshing, refresh, staleSeconds }}>{children}</BoardContext>
  );
}

export function useBoard(): BoardContextValue {
  const value = useContext(BoardContext);
  if (!value) throw new Error("useBoard must be used inside a <BoardProvider>");
  return value;
}
