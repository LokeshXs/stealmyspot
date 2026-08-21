"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import { GlobeIcon } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { submitBid, startTakeover } from "@/app/actions";
import { formatDollars, parseDollarsToCents } from "@/lib/format";
import { MIN_BID_CENTS, TAKEOVER_HOURS } from "@/lib/ranking";

interface ClaimSectionProps {
  nextBidCents: number;
  takeoverPriceCents: number;
  /** Published amounts, descending — enough to preview a rank without a round trip. */
  amounts: number[];
}

/**
 * Ranks a hypothetical bid against the board. Mirrors `previewRank` in
 * src/lib/ranking.ts; an equal bid ranks below the incumbent, so `>=` is correct.
 */
function rankFor(amountCents: number, amounts: number[]): number {
  return amounts.filter((a) => a >= amountCents).length + 1;
}

export function ClaimSection({ nextBidCents, takeoverPriceCents, amounts }: ClaimSectionProps) {
  const [amount, setAmount] = useState(() => String(Math.round(nextBidCents / 100)));
  const [identity, setIdentity] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const identityRef = useRef<HTMLInputElement>(null);

  const amountCents = useMemo(() => parseDollarsToCents(amount), [amount]);
  const validAmount = Number.isFinite(amountCents) && amountCents >= MIN_BID_CENTS;
  const rank = useMemo(
    () => (validAmount ? rankFor(amountCents, amounts) : 1),
    [validAmount, amountCents, amounts],
  );

  function step(delta: number) {
    const current = Number.isFinite(amountCents) ? amountCents : nextBidCents;
    const next = Math.max(MIN_BID_CENTS, current + delta * 100);
    setAmount(String(Math.round(next / 100)));
  }

  function run(action: () => Promise<{ error?: string } | void>) {
    setError(null);
    startTransition(async () => {
      const result = await action();
      // On success the action redirects, so reaching here means it failed.
      if (result && "error" in result && result.error) setError(result.error);
    });
  }

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!identity.trim()) {
      identityRef.current?.focus();
      setError("Enter a product URL or an @handle.");
      return;
    }
    run(() => submitBid({ identity, amountCents }));
  }

  function onTakeover() {
    if (!identity.trim()) {
      identityRef.current?.focus();
      setError("Enter the URL or @handle you want on top first.");
      return;
    }
    run(() => startTakeover({ identity }));
  }

  return (
    <section id="claim" className="scroll-mt-6">
      <h2 className="flex flex-wrap items-center justify-center gap-x-2 text-center text-[28px] font-bold tracking-[-0.03em] text-pretty md:text-[40px]">
        <span>Claim #{rank} for</span>
        <span className="inline-flex items-center gap-2">
          <Button
            type="button"
            variant="soft"
            size="icon"
            aria-label="Decrease bid by one dollar"
            onClick={() => step(-1)}
          >
            −
          </Button>

          {/*
            The input is sized by an invisible mirror span so the dashed underline
            hugs the number instead of a fixed-width box.
          */}
          <label className="relative inline-block text-primary underline decoration-dashed decoration-2 underline-offset-[6px]">
            <span className="sr-only">Amount in dollars</span>
            <span className="invisible tabular-nums whitespace-nowrap" aria-hidden="true">
              ${amount || "0"}
            </span>
            <span className="absolute inset-0 flex items-baseline">
              <span aria-hidden="true">$</span>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={amount}
                onChange={(e) => setAmount(e.target.value.replace(/[^0-9]/g, ""))}
                aria-label="Amount in dollars"
                className="w-full min-w-0 bg-transparent p-0 font-[inherit] text-[inherit] tracking-[inherit] tabular-nums outline-none"
              />
            </span>
          </label>

          <Button
            type="button"
            variant="soft"
            size="icon"
            aria-label="Increase bid by one dollar"
            onClick={() => step(1)}
          >
            +
          </Button>
        </span>
      </h2>

      <p className="mx-auto mt-2 max-w-md text-center text-sm leading-relaxed text-pretty text-muted-foreground">
        Your amount decides the rank. Paying less than the #1 price still puts you on the board at
        whatever place that bid can take.
      </p>

      <form onSubmit={onSubmit} className="mt-4 flex flex-col gap-3">
        <div className="flex flex-col items-stretch gap-2 md:flex-row md:items-center">
          <div className="relative min-w-0 flex-1">
            <span className="pointer-events-none absolute top-1/2 left-2.5 flex size-6 -translate-y-1/2 items-center justify-center rounded-full bg-muted text-muted-foreground">
              <GlobeIcon />
            </span>
            <Input
              ref={identityRef}
              id="identity"
              value={identity}
              onChange={(e) => setIdentity(e.target.value)}
              placeholder="Your product URL or @handle"
              autoComplete="off"
              spellCheck={false}
              aria-invalid={error ? true : undefined}
              className="pl-10"
            />
          </div>
          <Button type="submit" disabled={pending || !validAmount} className="w-full shrink-0 md:w-auto">
            {pending ? "Starting checkout…" : "Outbid"}
          </Button>
        </div>

        {error ? (
          <p role="alert" className="text-center text-sm text-destructive text-pretty">
            {error}
          </p>
        ) : (
          <p className="text-center text-xs leading-relaxed text-pretty text-muted-foreground">
            Already on the list? Enter the same URL or @handle and up your bid to get back to the top.
          </p>
        )}
      </form>

      <div className="mt-4 flex justify-center">
        <div className="mx-auto flex w-fit flex-col items-center justify-center gap-2 rounded-xl border border-primary/20 bg-primary/8 px-3 py-2 text-center text-sm sm:flex-row sm:gap-3">
          <p className="text-balance">
            <span className="font-semibold">
              <span className="text-primary">New:</span> Leaderboard takeover.
            </span>{" "}
            Own the first page for {TAKEOVER_HOURS} hours — {formatDollars(takeoverPriceCents)}
            <span className="text-muted-foreground"> (2× current #1)</span>
          </p>
          <Button type="button" size="sm" onClick={onTakeover} disabled={pending}>
            Take over
          </Button>
        </div>
      </div>
    </section>
  );
}
