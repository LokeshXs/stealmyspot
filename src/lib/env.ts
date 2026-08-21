/**
 * Env access in one place. Server-only values are read lazily so that importing
 * a module from a client component never trips a missing-var error at build time.
 */

function required(name: string, value: string | undefined): string {
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

export type PaymentProviderName = "mock" | "dodo";

export const paymentProvider: PaymentProviderName =
  process.env.PAYMENT_PROVIDER === "dodo" ? "dodo" : "mock";

export const appUrl =
  process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ?? "http://localhost:3000";

const siteName = process.env.NEXT_PUBLIC_SITE_NAME ?? "Steal My Spot";

/** Branding is env-driven so the name and its accent can move without a deploy. */
export const branding = {
  name: siteName,
  /**
   * The trailing word that carries the accent colour in the wordmark. Defaults
   * to the last word, which keeps a one-word name working, while the env var
   * stays available if the accent belongs somewhere else.
   */
  accent: process.env.NEXT_PUBLIC_SITE_ACCENT ?? siteName.split(/\s+/).at(-1) ?? siteName,
  tagline:
    process.env.NEXT_PUBLIC_TAGLINE ??
    "Every spot on this list is for sale. Yours included.",
  taglineEmphasis:
    process.env.NEXT_PUBLIC_TAGLINE_EMPHASIS ??
    "Outbid the number beside a name and the spot is yours.",
};

export const siteTitle = branding.name;

/**
 * Splits the name into the part that stays ink and the part that takes the
 * accent, so the wordmark, the footer and the social card all agree.
 */
export function splitBrandName(): { lead: string; accent: string } {
  const { name, accent } = branding;
  if (!accent || !name.endsWith(accent)) return { lead: name, accent: "" };
  return { lead: name.slice(0, name.length - accent.length), accent };
}

/** Credentials for creating checkouts. Only read on the checkout path. */
export function dodoEnv() {
  return {
    apiKey: required("DODO_PAYMENTS_API_KEY", process.env.DODO_PAYMENTS_API_KEY),
    productId: required("DODO_PRODUCT_ID", process.env.DODO_PRODUCT_ID),
    environment:
      process.env.DODO_PAYMENTS_ENVIRONMENT === "live_mode"
        ? ("live_mode" as const)
        : ("test_mode" as const),
  };
}

/**
 * The webhook only needs the signing secret — kept separate so a missing
 * DODO_PRODUCT_ID can never turn a signature check into a 500.
 */
export function dodoWebhookKey(): string | null {
  return process.env.DODO_PAYMENTS_WEBHOOK_KEY || null;
}
