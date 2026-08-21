import { paymentProvider } from "@/lib/env";
import { mockProvider } from "./mock";
import type { PaymentProvider } from "./provider";

/**
 * Resolves the configured provider. The Dodo module is imported lazily so a
 * `PAYMENT_PROVIDER=mock` setup never needs Dodo credentials to be present.
 */
export async function getPaymentProvider(): Promise<PaymentProvider> {
  if (paymentProvider === "dodo") {
    const { dodoProvider } = await import("./dodo");
    return dodoProvider;
  }
  return mockProvider;
}

export type { PaymentProvider, CreateCheckoutInput, CreateCheckoutResult } from "./provider";
