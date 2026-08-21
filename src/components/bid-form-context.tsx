"use client";

import {
  createContext,
  useContext,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react";
import { useBoard } from "@/components/board-context";
import { startTakeover, submitBid } from "@/app/actions";
import { parseDollarsToCents } from "@/lib/format";
import { MIN_BID_CENTS } from "@/lib/ranking";

/**
 * Ranks a hypothetical bid against the visible board. Mirrors `previewRank` in
 * src/lib/ranking.ts — an equal bid ranks below the incumbent, so `>=` is right.
 */
function rankFor(amountCents: number, amounts: number[]): number {
  return amounts.filter((a) => a >= amountCents).length + 1;
}

interface BidFormValue {
  amount: string;
  setAmount: (value: string) => void;
  identity: string;
  setIdentity: (value: string) => void;
  step: (delta: number) => void;
  amountCents: number;
  validAmount: boolean;
  /** Where this bid would land if it were paid right now. */
  rank: number;
  pending: boolean;
  error: string | null;
  submit: () => void;
  takeover: () => void;
  /** Focused when a submit is attempted with an empty address. */
  identityRef: React.RefObject<HTMLInputElement | null>;
}

const BidFormContext = createContext<BidFormValue | null>(null);

/**
 * The hero band and the sticky bar are two renderings of one form. Amount and
 * address live here so editing either surface updates both.
 */
export function BidFormProvider({ children }: { children: React.ReactNode }) {
  const { board } = useBoard();
  const [amount, setAmount] = useState(() => String(Math.round(board.nextBidCents / 100)));
  const [identity, setIdentity] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const identityRef = useRef<HTMLInputElement | null>(null);

  const amounts = useMemo(() => board.entries.map((e) => e.amountCents), [board.entries]);
  const amountCents = useMemo(() => parseDollarsToCents(amount), [amount]);
  const validAmount = Number.isFinite(amountCents) && amountCents >= MIN_BID_CENTS;
  const rank = useMemo(
    () => (validAmount ? rankFor(amountCents, amounts) : 1),
    [validAmount, amountCents, amounts],
  );

  function step(delta: number) {
    const current = Number.isFinite(amountCents) ? amountCents : board.nextBidCents;
    setAmount(String(Math.round(Math.max(MIN_BID_CENTS, current + delta * 100) / 100)));
  }

  function run(action: () => Promise<{ error?: string } | void>) {
    setError(null);
    startTransition(async () => {
      const result = await action();
      // A successful action redirects, so reaching here means it failed.
      if (result && "error" in result && result.error) setError(result.error);
    });
  }

  function requireIdentity(message: string): boolean {
    if (identity.trim()) return true;
    identityRef.current?.focus();
    identityRef.current?.scrollIntoView({ block: "center", behavior: "smooth" });
    setError(message);
    return false;
  }

  function submit() {
    if (!requireIdentity("Enter an address or an @handle first.")) return;
    run(() => submitBid({ identity, amountCents }));
  }

  function takeover() {
    if (!requireIdentity("Enter the address you want held on page one.")) return;
    run(() => startTakeover({ identity }));
  }

  return (
    <BidFormContext
      value={{
        amount,
        setAmount,
        identity,
        setIdentity,
        step,
        amountCents,
        validAmount,
        rank,
        pending,
        error,
        submit,
        takeover,
        identityRef,
      }}
    >
      {children}
    </BidFormContext>
  );
}

export function useBidForm(): BidFormValue {
  const value = useContext(BidFormContext);
  if (!value) throw new Error("useBidForm must be used inside a <BidFormProvider>");
  return value;
}

/** Strips anything that is not a digit — bids are whole dollars. */
export function digitsOnly(value: string): string {
  return value.replace(/[^0-9]/g, "");
}
