"use client";

import { motion, useReducedMotion } from "motion/react";
import { ArrowRight, GlobeIcon } from "@/components/icons";
import { RollingNumber } from "@/components/rolling-number";
import { useBidForm, digitsOnly } from "@/components/bid-form-context";
import { useBoard } from "@/components/board-context";
import { Button } from "@/components/ui/button";
import { formatDollars } from "@/lib/format";
import { MIN_BID_CENTS } from "@/lib/ranking";
import { cn } from "@/lib/utils";

/**
 * The eye magnet. A huge nudgeable number, one field, one button — everything
 * needed to place a bid, above the fold and impossible to miss.
 */
export function BidHero({ sentinelRef }: { sentinelRef: React.Ref<HTMLDivElement> }) {
  const { board } = useBoard();
  const {
    amount,
    setAmount,
    identity,
    setIdentity,
    step,
    validAmount,
    rank,
    pending,
    error,
    submit,
    identityRef,
  } = useBidForm();
  const reduceMotion = useReducedMotion();

  const takesTop = rank === 1;
  const dollars = Number.parseInt(digitsOnly(amount) || "0", 10);

  return (
    <section className="py-10 sm:py-14">
      <div className="mx-auto flex max-w-2xl flex-col items-center text-center">
        <p className="text-xs font-bold tracking-[0.18em] text-muted-foreground uppercase">
          {board.total === 0
            ? "Nobody has claimed a place yet"
            : `${board.total} ${board.total === 1 ? "entry" : "entries"} · top ${formatDollars(board.topBidCents)}`}
        </p>

        <h2 className="mt-3 text-4xl leading-[1.05] font-black tracking-[-0.04em] text-balance sm:text-6xl">
          Claim{" "}
          <span className="marker-stroke">
            position{" "}
            <motion.span
              key={rank}
              initial={reduceMotion ? false : { scale: 0.72, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 500, damping: 24 }}
              className="inline-block text-primary tabular-nums"
            >
              #{rank}
            </motion.span>
          </span>
        </h2>

        {/* The number itself. Everything above is setup; this is the product. */}
        <div className="mt-8 flex w-full items-center justify-center gap-3 sm:gap-5">
          <Button
            type="button"
            variant="chunkyOutline"
            size="stepLg"
            aria-label="Lower by one dollar"
            onClick={() => step(-1)}
            disabled={dollars <= MIN_BID_CENTS / 100}
          >
            −
          </Button>

          <label className="relative flex min-w-0 flex-1 items-center justify-center">
            <span className="sr-only">Amount in whole dollars</span>

            {/*
              A transparent input sits over the rolled figure so the digits can
              animate while the field stays fully editable and focusable.
            */}
            <span
              aria-hidden="true"
              className={cn(
                "pointer-events-none block text-[clamp(3.5rem,16vw,7.5rem)] leading-none font-black tracking-[-0.05em]",
                takesTop ? "text-primary" : "text-foreground",
              )}
            >
              <RollingNumber value={dollars} />
            </span>

            <input
              id="bid-amount"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={amount}
              onChange={(e) => setAmount(digitsOnly(e.target.value))}
              aria-label="Amount in whole dollars"
              className="absolute inset-0 h-full w-full cursor-text bg-transparent text-center text-[clamp(3.5rem,16vw,7.5rem)] leading-none font-black tracking-[-0.05em] text-transparent caret-primary outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
            />
          </label>

          <Button
            type="button"
            variant="chunkyOutline"
            size="stepLg"
            aria-label="Raise by one dollar"
            onClick={() => step(1)}
          >
            +
          </Button>
        </div>

        <p className="mt-3 text-sm text-muted-foreground">
          {takesTop ? "Takes first place outright." : "Any amount takes the highest place it can afford."}
        </p>

        {/* Sentinel: the sticky bar appears once this scrolls out of view. */}
        <div ref={sentinelRef} aria-hidden="true" className="h-px w-full" />

        <form
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
          className="mt-6 flex w-full flex-col gap-3 sm:flex-row"
        >
          <div className="relative min-w-0 flex-1">
            <span className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-muted-foreground">
              <GlobeIcon className="size-4" />
            </span>
            <input
              ref={identityRef}
              id="identity"
              value={identity}
              onChange={(e) => setIdentity(e.target.value)}
              placeholder="your address or @handle"
              autoComplete="off"
              spellCheck={false}
              aria-invalid={error ? true : undefined}
              className="h-14 w-full min-w-0 rounded-md border border-foreground bg-card pr-4 pl-10 text-base transition-colors outline-none placeholder:text-muted-foreground/70 focus-visible:ring-2 focus-visible:ring-ring/50 aria-invalid:border-destructive"
            />
          </div>

          <Button
            type="submit"
            variant="chunky"
            size="lg"
            disabled={pending || !validAmount}
            className="shrink-0 sm:w-auto"
          >
            {pending ? "Opening checkout…" : "Place bid"}
          </Button>
        </form>

        <div className="mt-4 flex min-h-5 items-center justify-center">
          {error ? (
            <p role="alert" className="text-sm font-medium text-destructive text-pretty">
              {error}
            </p>
          ) : (
            <p
              aria-live="polite"
              className={cn(
                "inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-sm font-semibold tabular-nums transition-colors",
                takesTop ? "bg-primary/15 text-primary" : "text-muted-foreground",
              )}
            >
              <ArrowRight className="size-3.5" />
              lands at #{rank}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
