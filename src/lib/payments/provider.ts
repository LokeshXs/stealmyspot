import type { BidKind } from "@/generated/prisma/enums";

export interface CreateCheckoutInput {
  bidId: string;
  listingId: string;
  identityKey: string;
  /** What we charge now — the difference, on a re-bid. */
  amountCents: number;
  /** The total bid the listing will hold once paid. Sets the rank. */
  totalAmountCents: number;
  kind: BidKind;
  label: string;
}

export interface CreateCheckoutResult {
  sessionId: string;
  url: string;
}

export interface PaymentProvider {
  readonly name: string;
  createCheckout(input: CreateCheckoutInput): Promise<CreateCheckoutResult>;
}
