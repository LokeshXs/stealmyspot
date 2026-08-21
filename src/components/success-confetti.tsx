"use client";

import { useEffect, useRef } from "react";
import { Confetti, type ConfettiRef } from "@/components/confetti";

const CONFETTI_COLORS = ["#6d5cf6", "#17171f", "#ffffff"];

export function SuccessConfetti() {
  const confettiRef = useRef<ConfettiRef>(null);
  const firedRef = useRef(false);

  useEffect(() => {
    if (firedRef.current) return;
    firedRef.current = true;

    const leftTimer = window.setTimeout(() => {
      void confettiRef.current?.fire({
        particleCount: 56, angle: 58, spread: 55, startVelocity: 46, gravity: 0.9,
        ticks: 210, scalar: 0.9, origin: { x: 0.08, y: 0.64 }, colors: CONFETTI_COLORS,
      });
    }, 120);
    const rightTimer = window.setTimeout(() => {
      void confettiRef.current?.fire({
        particleCount: 56, angle: 122, spread: 55, startVelocity: 46, gravity: 0.9,
        ticks: 210, scalar: 0.9, origin: { x: 0.92, y: 0.64 }, colors: CONFETTI_COLORS,
      });
    }, 210);

    return () => {
      window.clearTimeout(leftTimer);
      window.clearTimeout(rightTimer);
    };
  }, []);

  return (
    <Confetti
      ref={confettiRef}
      manualstart
      globalOptions={{ resize: true, useWorker: true, disableForReducedMotion: true }}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-50 h-full w-full"
    />
  );
}
