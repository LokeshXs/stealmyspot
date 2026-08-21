/** Display helpers shared by server and client components. */

export function formatDollars(cents: number): string {
  return `$${Math.round(cents / 100).toLocaleString("en-US")}`;
}

export function formatCount(value: number): string {
  return value.toLocaleString("en-US");
}

const UNITS: [limit: number, seconds: number, name: Intl.RelativeTimeFormatUnit][] = [
  [60, 1, "second"],
  [3600, 60, "minute"],
  [86400, 3600, "hour"],
  [604800, 86400, "day"],
  [2629800, 604800, "week"],
  [31557600, 2629800, "month"],
  [Number.POSITIVE_INFINITY, 31557600, "year"],
];

const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

/** "9 hours ago", "yesterday", "24 minutes ago" — matches the original's row meta. */
export function timeAgo(date: Date | string, now: Date = new Date()): string {
  const then = typeof date === "string" ? new Date(date) : date;
  const seconds = Math.round((now.getTime() - then.getTime()) / 1000);
  if (seconds < 45) return "just now";

  for (const [limit, divisor, unit] of UNITS) {
    if (seconds < limit) {
      return rtf.format(-Math.round(seconds / divisor), unit);
    }
  }
  return rtf.format(-Math.round(seconds / 31557600), "year");
}

/** Parses a user-typed dollar amount ("1,250", "$1250", "1250") into cents. */
export function parseDollarsToCents(input: string): number {
  const digits = input.replace(/[^0-9]/g, "");
  if (!digits) return Number.NaN;
  const dollars = Number.parseInt(digits, 10);
  if (!Number.isFinite(dollars)) return Number.NaN;
  return dollars * 100;
}
