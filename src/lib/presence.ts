import "server-only";

import { db } from "@/lib/db";

/**
 * Live visitor counter. The original site outsources this to a third-party
 * analytics script; we keep it in our own table so there's nothing to sign up for.
 */

const ONLINE_WINDOW_MS = 60_000;
const HOUR_MS = 60 * 60 * 1000;
const PRUNE_AFTER_MS = 2 * HOUR_MS;

export interface PresenceCounts {
  online: number;
  lastHour: number;
}

export async function recordHeartbeat(sessionId: string): Promise<PresenceCounts> {
  const now = new Date();

  await db.presence.upsert({
    where: { sessionId },
    create: { sessionId, firstSeenAt: now, lastSeenAt: now },
    update: { lastSeenAt: now },
  });

  // Cheap opportunistic cleanup — no cron needed.
  await db.presence.deleteMany({
    where: { lastSeenAt: { lt: new Date(now.getTime() - PRUNE_AFTER_MS) } },
  });

  return getPresenceCounts();
}

export async function getPresenceCounts(): Promise<PresenceCounts> {
  const now = Date.now();
  const [online, lastHour] = await Promise.all([
    db.presence.count({
      where: { lastSeenAt: { gte: new Date(now - ONLINE_WINDOW_MS) } },
    }),
    db.presence.count({
      where: { firstSeenAt: { gte: new Date(now - HOUR_MS) } },
    }),
  ]);
  return { online, lastHour };
}
