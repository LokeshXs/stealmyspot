import type { CreateCheckoutInput, CreateCheckoutResult, PaymentProvider } from "./provider";

/**
 * Local stand-in for a hosted checkout. Lets the entire bid → pay → rank flow be
 * built and tested with no Dodo account, no API key and no tunnel.
 *
 * The URL is relative on purpose: dev servers move ports, and a same-origin
 * redirect should never depend on NEXT_PUBLIC_APP_URL being right.
 */
export const mockProvider: PaymentProvider = {
  name: "mock",

  async createCheckout(input: CreateCheckoutInput): Promise<CreateCheckoutResult> {
    return {
      sessionId: `mock_${input.bidId}`,
      url: `/checkout/${input.bidId}`,
    };
  },
};
