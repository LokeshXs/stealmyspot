"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";

/**
 * A figure whose digits roll when the value changes.
 *
 * Each character gets a stable key of `position:character`, so only the digits
 * that actually changed animate — nudging $128 to $129 rolls the last digit and
 * leaves the rest still.
 */
export function RollingNumber({
  value,
  prefix = "$",
  className,
}: {
  value: number;
  prefix?: string;
  className?: string;
}) {
  const reduceMotion = useReducedMotion();
  const text = Math.round(value).toLocaleString("en-US");

  if (reduceMotion) {
    return (
      <span className={cn("tabular-nums", className)}>
        {prefix}
        {text}
      </span>
    );
  }

  const chars = text.split("");

  return (
    // Splitting into per-digit spans would otherwise be announced as "$ 1 1",
    // so the whole figure is exposed once as a label and the digits are hidden.
    <span
      role="text"
      aria-label={`${prefix}${text}`}
      className={cn("inline-flex items-center tabular-nums", className)}
    >
      <span aria-hidden="true" className="contents">
      {prefix ? <span>{prefix}</span> : null}
      {chars.map((char, index) => {
        // Position is measured from the right so that gaining a digit does not
        // re-key — and therefore re-animate — every digit before it.
        const fromEnd = chars.length - index;
        return (
          <span
            key={`${fromEnd}`}
            className="relative inline-block overflow-hidden"
            style={{ width: char === "," ? "0.28em" : "0.62em" }}
          >
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.span
                key={char}
                initial={{ y: "-100%", opacity: 0 }}
                animate={{ y: "0%", opacity: 1 }}
                exit={{ y: "100%", opacity: 0 }}
                transition={{ type: "spring", stiffness: 420, damping: 32, mass: 0.6 }}
                className="inline-block w-full text-center"
              >
                {char}
              </motion.span>
            </AnimatePresence>
          </span>
        );
      })}
      </span>
    </span>
  );
}
