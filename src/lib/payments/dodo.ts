import "server-only";

import DodoPayments from "dodopayments";
import { appUrl, dodoEnv } from "@/lib/env";
import type { CreateCheckoutInput, CreateCheckoutResult, PaymentProvider } from "./provider";

let client: DodoPayments | null = null;

function dodo(): DodoPayments {
  if (!client) {
    const { apiKey, environment } = dodoEnv();
    client = new DodoPayments({ bearerToken: apiKey, environment });
  }
  return client;
}

/**
 * Bids are arbitrary amounts, so every checkout reuses one **Pay What You Want**
 * product and sets the price per session via `product_cart[].amount` (in cents).
 * See DODO_PRODUCT_ID in .env.example for the required dashboard setup.
 */
export const dodoProvider: PaymentProvider = {
  name: "dodo",

  async createCheckout(input: CreateCheckoutInput): Promise<CreateCheckoutResult> {
    const { productId } = dodoEnv();

    const session = await dodo().checkoutSessions.create({
      product_cart: [
        { product_id: productId, quantity: 1, amount: input.amountCents },
      ],
      return_url: `${appUrl}/success?bid=${input.bidId}`,
      // The webhook reads these back to find the bid. Dodo echoes metadata verbatim.
      metadata: {
        bidId: input.bidId,
        listingId: input.listingId,
        identityKey: input.identityKey,
        totalAmountCents: String(input.totalAmountCents),
        kind: input.kind,
      },
      feature_flags: {
        allow_discount_code: false,
        always_create_new_customer: false,
      },
      customization: {
        show_order_details: true,
        theme: "light",
      },
    });

    if (!session.checkout_url) {
      throw new Error("Dodo returned a session with no checkout_url");
    }

    return { sessionId: session.session_id, url: session.checkout_url };
  },
};
