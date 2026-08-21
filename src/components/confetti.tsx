"use client";

import { motion, useReducedMotion } from "motion/react";

/**
 * A one-shot burst for a won bid. Deliberately deterministic — no Math.random
 * at render time, so the server and client agree and nothing hydration-warns.
 */
const PIECES = Array.from({ length: 28 }, (_, i) => {
  const angle = (i / 28) * Math.PI * 2;
  const spread = 120 + ((i * 37) % 90);
  return {
    id: i,
    x: Math.cos(angle) * spread,
    y: Math.sin(angle) * spread - 60,
    rotate: ((i * 53) % 360) - 180,
    delay: (i % 6) * 0.03,
    wide: i % 3 === 0,
  };
});

export function Confetti() {
  const reduceMotion = useReducedMotion();
  if (reduceMotion) return null;

  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-16 flex justify-center">
      <div className="relative size-0">
        {PIECES.map((piece) => (
          <motion.span
            key={piece.id}
            initial={{ opacity: 1, x: 0, y: 0, rotate: 0, scale: 0.6 }}
            animate={{
              opacity: [1, 1, 0],
              x: piece.x,
              y: [0, piece.y, piece.y + 260],
              rotate: piece.rotate,
              scale: 1,
            }}
            transition={{ duration: 1.9, delay: piece.delay, ease: [0.2, 0.7, 0.35, 1] }}
            className={
              piece.id % 2 === 0
                ? "absolute block rounded-[1px] bg-primary"
                : "absolute block rounded-[1px] bg-foreground"
            }
            style={{ width: piece.wide ? 9 : 5, height: piece.wide ? 5 : 9 }}
          />
        ))}
      </div>
    </div>
  );
}
