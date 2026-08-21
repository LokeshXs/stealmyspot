import type { PresenceCounts } from "@/lib/presence";

export interface PresenceBaseline {
  online: number;
  lastHour: number;
}

const ONLINE_BASELINE = { min: 12, max: 20 } as const;
const LAST_HOUR_BASELINE = { min: 44, max: 60 } as const;

function randomInteger(min: number, max: number, random: () => number): number {
  return Math.floor(random() * (max - min + 1)) + min;
}

export function createPresenceBaseline(random: () => number = Math.random): PresenceBaseline {
  return {
    online: randomInteger(ONLINE_BASELINE.min, ONLINE_BASELINE.max, random),
    lastHour: randomInteger(LAST_HOUR_BASELINE.min, LAST_HOUR_BASELINE.max, random),
  };
}

export function addPresenceBaseline(
  counts: PresenceCounts,
  baseline: PresenceBaseline,
): PresenceCounts {
  return {
    online: counts.online + baseline.online,
    lastHour: counts.lastHour + baseline.lastHour,
  };
}
