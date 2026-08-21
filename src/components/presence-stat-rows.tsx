"use client";

import { usePresenceBaseline } from "@/components/presence-baseline-context";
import { addPresenceBaseline } from "@/lib/display-presence";
import { formatCount } from "@/lib/format";
import type { PresenceCounts } from "@/lib/presence";

function PresenceRow({ label, value }: { label: string; value: number }) {
  return (
    <tr className="rule-t">
      <th scope="row" className="py-3 pr-4 text-left text-sm font-normal text-muted-foreground">
        {label}
      </th>
      <td className="py-3 text-right text-base font-bold text-foreground tabular-nums">
        {formatCount(value)}
      </td>
    </tr>
  );
}

export function PresenceStatRows({ counts }: { counts: PresenceCounts }) {
  const baseline = usePresenceBaseline();
  const displayCounts = addPresenceBaseline(counts, baseline);

  return (
    <>
      <PresenceRow label="Reading now" value={displayCounts.online} />
      <PresenceRow label="Readers in the past hour" value={displayCounts.lastHour} />
    </>
  );
}
