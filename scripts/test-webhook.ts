/**
 * Exercises the Dodo webhook route without a Dodo account: signs a payload with
 * DODO_PAYMENTS_WEBHOOK_KEY exactly the way Standard Webhooks does, then posts it.
 *
 *   pnpm tsx scripts/test-webhook.ts <bidId> [--bad-signature]
 */
import "dotenv/config";
import { createHmac, randomUUID } from "node:crypto";

const bidId = process.argv[2];
const bad = process.argv.includes("--bad-signature");
/** Reuse a fixed webhook-id to simulate one of Dodo's up-to-8 retries. */
const replayId = process.argv.find((a) => a.startsWith("--replay="))?.split("=")[1];
const url = `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/dodo`;
const secret = process.env.DODO_PAYMENTS_WEBHOOK_KEY ?? "";

if (!bidId) throw new Error("usage: tsx scripts/test-webhook.ts <bidId>");
if (!secret) throw new Error("DODO_PAYMENTS_WEBHOOK_KEY must be set to test webhooks");

const now = new Date().toISOString();

// A schema-complete Payment payload — the verifier parses as well as authenticates.
const body = JSON.stringify({
  business_id: "biz_test",
  type: "payment.succeeded",
  timestamp: now,
  data: {
    payload_type: "Payment",
    payment_id: `pay_${randomUUID()}`,
    business_id: "biz_test",
    brand_id: "brd_test",
    billing: { city: "San Francisco", country: "US", state: "CA", street: "1 Main St", zipcode: "94100" },
    created_at: now,
    currency: "USD",
    customer: { email: "buyer@example.com", customer_id: "cus_test", name: "Buyer" },
    digital_products_delivered: true,
    disputes: [],
    refunds: [],
    is_update_payment_method: false,
    payment_provider: "stripe",
    retry_attempt: 0,
    settlement_amount: 999_999,
    settlement_currency: "USD",
    // Dodo is merchant of record: total_amount includes tax and is deliberately
    // far larger than the bid, proving rank comes from our own record, not this.
    total_amount: 999_999,
    tax: 900_099,
    status: "succeeded",
    metadata: { bidId },
  },
});

const webhookId = replayId ?? `msg_${randomUUID()}`;
const timestamp = Math.floor(Date.now() / 1000).toString();

// Standard Webhooks: base64 HMAC-SHA256 over "<id>.<timestamp>.<body>".
const key = secret.startsWith("whsec_") ? secret.slice(6) : secret;
const signature = createHmac("sha256", Buffer.from(key, "base64"))
  .update(`${webhookId}.${timestamp}.${body}`)
  .digest("base64");

async function main() {
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "webhook-id": webhookId,
      "webhook-timestamp": timestamp,
      "webhook-signature": bad ? "v1,deadbeef" : `v1,${signature}`,
    },
    body,
  });
  console.log(`${bad ? "BAD signature" : "valid signature"} -> ${res.status}`, await res.text());
}

void main();
