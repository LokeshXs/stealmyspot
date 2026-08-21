"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import { ArrowRight, GlobeIcon } from "@/components/icons";
import { useBoard } from "@/components/board-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { startTakeover, submitBid } from "@/app/actions";
import { formatDollars, parseDollarsToCents } from "@/lib/format";
import { MIN_BID_CENTS, TAKEOVER_HOURS } from "@/lib/ranking";

/**
 * Ranks a hypothetical bid against the visible board. Mirrors `previewRank` in
 * src/lib/ranking.ts — an equal bid ranks below the incumbent, so `>=` is right.
 */
function rankFor(amountCents: number, amounts: number[]): number {
  return amounts.filter((a) => a >= amountCents).length + 1;
}

function Panel({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-md border border-border">
      <h2 className="rule-b px-3 py-2 font-mono text-[10px] tracking-[0.14em] text-muted-foreground uppercase">
        {label}
      </h2>
      <div className="p-3">{children}</div>
    </section>
  );
}

export function BidComposer() {
  const { board } = useBoard();
  const [amount, setAmount] = useState(() => String(Math.round(board.nextBidCents / 100)));
  const [identity, setIdentity] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const identityRef = useRef<HTMLInputElement>(null);

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

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!identity.trim()) {
      identityRef.current?.focus();
      setError("Enter an address or an @handle.");
      return;
    }
    run(() => submitBid({ identity, amountCents }));
  }

  function onTakeover() {
    if (!identity.trim()) {
      identityRef.current?.focus();
      setError("Enter the address you want held on page one.");
      return;
    }
    run(() => startTakeover({ identity }));
  }

  return (
    <div className="flex flex-col gap-3">
      <Panel label="Claim a position">
        <form onSubmit={onSubmit} className="flex flex-col gap-3">
          <div>
            <label
              htmlFor="bid-amount"
              className="mb-1.5 block text-xs font-medium text-muted-foreground"
            >
              Your number
            </label>
            <div className="flex items-stretch">
              <Button
                type="button"
                variant="outline"
                size="step"
                aria-label="Lower by one dollar"
                onClick={() => step(-1)}
                className="rounded-r-none"
              >
                −
              </Button>
              <div className="flex min-w-0 flex-1 items-center border-y border-input bg-background px-3">
                <span aria-hidden="true" className="font-mono text-sm text-muted-foreground">
                  $
                </span>
                <input
                  id="bid-amount"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value.replace(/[^0-9]/g, ""))}
                  aria-label="Amount in whole dollars"
                  className="w-full min-w-0 bg-transparent px-1 font-mono text-base tabular-nums outline-none"
                />
              </div>
              <Button
                type="button"
                variant="outline"
                size="step"
                aria-label="Raise by one dollar"
                onClick={() => step(1)}
                className="rounded-l-none"
              >
                +
              </Button>
            </div>
          </div>

          <div>
            <label
              htmlFor="identity"
              className="mb-1.5 block text-xs font-medium text-muted-foreground"
            >
              What to list
            </label>
            <div className="relative">
              <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted-foreground">
                <GlobeIcon />
              </span>
              <Input
                ref={identityRef}
                id="identity"
                value={identity}
                onChange={(e) => setIdentity(e.target.value)}
                placeholder="address or @handle"
                autoComplete="off"
                spellCheck={false}
                aria-invalid={error ? true : undefined}
                className="pl-8"
              />
            </div>
          </div>

          <p
            aria-live="polite"
            className="flex items-center gap-1.5 font-mono text-xs text-muted-foreground tabular-nums"
          >
            <ArrowRight className="text-primary" />
            {validAmount ? (
              <>
                lands at <span className="font-medium text-primary">#{rank}</span>
              </>
            ) : (
              <>minimum {formatDollars(MIN_BID_CENTS)}</>
            )}
          </p>

          <Button type="submit" disabled={pending || !validAmount} className="w-full">
            {pending ? "Opening checkout…" : "Place bid"}
          </Button>

          {error ? (
            <p role="alert" className="text-xs leading-relaxed text-destructive text-pretty">
              {error}
            </p>
          ) : (
            <p className="text-xs leading-relaxed text-pretty text-muted-foreground">
              Any amount takes the highest place it can afford. Already listed? Enter the same
              address and raise your number — you pay only the gap.
            </p>
          )}
        </form>
      </Panel>

      <Panel label="Front page">
        <p className="text-xs leading-relaxed text-pretty text-muted-foreground">
          Hold every place on page one for {TAKEOVER_HOURS} hours. Costs twice the standing top
          number; nobody can move onto the page until it lapses.
        </p>
        <div className="mt-3 flex items-center justify-between gap-3">
          <span className="font-mono text-sm text-foreground tabular-nums">
            {formatDollars(board.takeoverPriceCents)}
          </span>
          <Button type="button" variant="outline" size="sm" onClick={onTakeover} disabled={pending}>
            Reserve
          </Button>
        </div>
      </Panel>
    </div>
  );
}
