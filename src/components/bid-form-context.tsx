"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react";
import type { ListingPreviewResponse } from "@/app/api/listing-preview/route";
import { useBoard } from "@/components/board-context";
import { submitBid } from "@/app/actions";
import { parseDollarsToCents } from "@/lib/format";
import { normalizeIdentitySync } from "@/lib/identity";
import { MAX_BID_CENTS, MIN_BID_CENTS } from "@/lib/ranking";

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
  identityPreview: ListingPreviewResponse | null;
  identityPreviewLoading: boolean;
  step: (delta: number) => void;
  amountCents: number;
  validAmount: boolean;
  /** Where this bid would land if it were paid right now. */
  rank: number;
  pending: boolean;
  error: string | null;
  submit: () => void;
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
  const [identity, setIdentityValue] = useState("");
  const [identityPreview, setIdentityPreview] = useState<ListingPreviewResponse | null>(null);
  const [identityPreviewLoading, setIdentityPreviewLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const identityRef = useRef<HTMLInputElement | null>(null);
  const previewCache = useRef(new Map<string, ListingPreviewResponse>());

  function setIdentity(value: string) {
    setIdentityValue(value);
    setIdentityPreview(null);
    setIdentityPreviewLoading(false);
  }

  useEffect(() => {
    const input = identity.trim();
    if (!input || input.length > 300 || !normalizeIdentitySync(input).ok) return;

    const cached = previewCache.current.get(input);
    if (cached) {
      const task = window.setTimeout(() => setIdentityPreview(cached), 0);
      return () => window.clearTimeout(task);
    }

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setIdentityPreviewLoading(true);
      try {
        const response = await fetch(`/api/listing-preview?identity=${encodeURIComponent(input)}`, {
          signal: controller.signal,
        });
        if (!response.ok) return;
        const preview = (await response.json()) as ListingPreviewResponse;
        previewCache.current.set(input, preview);
        setIdentityPreview(preview);
      } catch (error) {
        if (!(error instanceof DOMException && error.name === "AbortError")) {
          setIdentityPreview(null);
        }
      } finally {
        if (!controller.signal.aborted) setIdentityPreviewLoading(false);
      }
    }, 500);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [identity]);

  const amounts = board.rankingAmountsCents;
  const amountCents = useMemo(() => parseDollarsToCents(amount), [amount]);
  const validAmount =
    Number.isFinite(amountCents) &&
    amountCents >= MIN_BID_CENTS &&
    amountCents <= MAX_BID_CENTS;
  const rank = useMemo(
    () => validAmount ? rankFor(amountCents, amounts) : 1,
    [validAmount, amountCents, amounts],
  );

  function step(delta: number) {
    const current = Number.isFinite(amountCents) ? amountCents : board.nextBidCents;
    // Clamped both ends: a stepper is a deliberate nudge, so it should never
    // hand back a number the server is going to refuse.
    const next = Math.min(MAX_BID_CENTS, Math.max(MIN_BID_CENTS, current + delta * 100));
    setAmount(String(Math.round(next / 100)));
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

  return (
    <BidFormContext
      value={{
        amount,
        setAmount,
        identity,
        setIdentity,
        identityPreview,
        identityPreviewLoading,
        step,
        amountCents,
        validAmount,
        rank,
        pending,
        error,
        submit,
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
