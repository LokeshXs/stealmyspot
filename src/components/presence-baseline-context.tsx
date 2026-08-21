"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { PresenceBaseline } from "@/lib/display-presence";

const PresenceBaselineContext = createContext<PresenceBaseline | null>(null);

export function PresenceBaselineProvider({
  initialBaseline,
  children,
}: {
  initialBaseline: PresenceBaseline;
  children: ReactNode;
}) {
  return (
    <PresenceBaselineContext value={initialBaseline}>{children}</PresenceBaselineContext>
  );
}

export function usePresenceBaseline(): PresenceBaseline {
  const baseline = useContext(PresenceBaselineContext);

  if (!baseline) {
    throw new Error("usePresenceBaseline must be used within a PresenceBaselineProvider");
  }

  return baseline;
}
