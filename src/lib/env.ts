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

/** Branding is env-driven — the real name is still undecided. */
export const branding = {
  name: process.env.NEXT_PUBLIC_SITE_NAME ?? "outbid",
  tld: process.env.NEXT_PUBLIC_SITE_TLD ?? ".lol",
  tagline:
    process.env.NEXT_PUBLIC_TAGLINE ??
    "One list, ordered by price. The only thing holding a position is the number beside it.",
  taglineEmphasis:
    process.env.NEXT_PUBLIC_TAGLINE_EMPHASIS ??
    "Nothing here is editorial. Every place on this page was paid for.",
};

export const siteTitle = `${branding.name}${branding.tld}`;

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
