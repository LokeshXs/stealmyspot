"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { RollingNumber } from "@/components/rolling-number";
import { IdentityPreviewIcon } from "@/components/identity-preview-icon";
import { useBidForm, digitsOnly } from "@/components/bid-form-context";
import { Button } from "@/components/ui/button";
import { MIN_BID_CENTS } from "@/lib/ranking";

/**
 * Follows the reader down the page once the hero has scrolled away, so the one
 * action that matters is never off-screen. Same form state as the hero.
 */
export function StickyBidBar({ visible }: { visible: boolean }) {
  // The amount is nudged with the steppers here; the hero owns the text field.
  const {
    amount,
    identity,
    setIdentity,
    identityPreview,
    identityPreviewLoading,
    step,
    validAmount,
    pending,
    submit,
  } = useBidForm();
  const reduceMotion = useReducedMotion();

  const dollars = Number.parseInt(digitsOnly(amount) || "0", 10);

  return (
    <AnimatePresence>
      {visible ? (
        <motion.div
          initial={reduceMotion ? { opacity: 0 } : { y: "110%" }}
          animate={reduceMotion ? { opacity: 1 } : { y: "0%" }}
          exit={reduceMotion ? { opacity: 0 } : { y: "110%" }}
          transition={{ type: "spring", stiffness: 320, damping: 34 }}
          className="fixed inset-x-0 bottom-0 z-40 border-t border-foreground bg-card/95 backdrop-blur"
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              submit();
            }}
            className="mx-auto flex w-full max-w-6xl items-center gap-2 px-4 py-2.5 sm:gap-3 sm:px-6"
          >
            <div className="flex shrink-0 items-center gap-1.5">
              <Button
                type="button"
                variant="chunkyOutline"
                size="step"
                aria-label="Lower by one dollar"
                onClick={() => step(-1)}
                disabled={dollars <= MIN_BID_CENTS / 100}
                className="max-sm:size-9"
              >
                −
              </Button>
              <span className="min-w-[3.5ch] text-center text-xl font-black tabular-nums sm:text-2xl">
                <RollingNumber value={dollars} />
              </span>
              <Button
                type="button"
                variant="chunkyOutline"
                size="step"
                aria-label="Raise by one dollar"
                onClick={() => step(1)}
                className="max-sm:size-9"
              >
                +
              </Button>
            </div>

            <div className="relative min-w-0 flex-1">
              <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted-foreground">
                <IdentityPreviewIcon
                  preview={identityPreview}
                  loading={identityPreviewLoading}
                />
              </span>
              <input
                value={identity}
                onChange={(e) => setIdentity(e.target.value)}
                placeholder="address or @handle"
                autoComplete="off"
                spellCheck={false}
                aria-label="What to list"
                className="h-10 w-full min-w-0 rounded-md border border-border bg-background pr-3 pl-9 text-sm outline-none placeholder:text-muted-foreground/70 focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40"
              />
            </div>

           

            <Button
              type="submit"
              variant="chunky"
              size="sm"
              disabled={pending || !validAmount}
              className="shrink-0 sm:h-10 sm:px-5"
            >
              {pending ? "…" : "Place bid"}
            </Button>
          </form>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
