import { NextResponse } from "next/server";
import { verifyWebhookPayload } from "@dodopayments/core/webhook";
import { db } from "@/lib/db";
import { dodoWebhookKey } from "@/lib/env";
import { failBid, fulfillBid } from "@/lib/payments/fulfill";

// Signature verification needs the raw body, so this must not be edge-rendered.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface PaymentData {
  payload_type?: string;
  payment_id?: string;
  metadata?: Record<string, string> | null;
  customer?: { email?: string | null } | null;
}

export async function POST(request: Request) {
  const webhookKey = dodoWebhookKey();
  if (!webhookKey) {
    return NextResponse.json(
      { error: "Webhooks are not configured" },
      { status: 503 },
    );
  }

  const body = await request.text();
  const headers = Object.fromEntries(request.headers.entries());

  let payload: { type: string; data: PaymentData };
  try {
    payload = (await verifyWebhookPayload({ webhookKey, headers, body })) as typeof payload;
  } catch (error) {
    // The verifier both checks the HMAC and parses the body against Dodo's Zod
    // schemas. Only the former is an auth failure — a body we can't parse is a
    // 400, so schema drift never looks like a stolen secret.
    //
    // The library's WebhookVerificationError loses its `name` through bundling,
    // so the message is the only reliable discriminator. These strings come from
    // the vendored Standard Webhooks implementation.
    const message = error instanceof Error ? error.message : "";
    const isSignatureFailure =
      message.includes("No matching signature found") ||
      message.includes("Missing required headers") ||
      message.includes("Invalid Signature Headers") ||
      message.includes("Message timestamp too");

    return NextResponse.json(
      { error: isSignatureFailure ? "Invalid signature" : "Invalid payload" },
      { status: isSignatureFailure ? 401 : 400 },
    );
  }

  // Dodo retries a delivery up to 8 times and may deliver out of order, so the
  // `webhook-id` header is recorded first and a repeat is acknowledged untouched.
  const webhookId = headers["webhook-id"];
  if (webhookId) {
    try {
      await db.webhookEvent.create({
        data: {
          id: webhookId,
          type: payload.type,
          payload: JSON.parse(body) as object,
        },
      });
    } catch {
      return NextResponse.json({ received: true, duplicate: true });
    }
  }

  const bidId = payload.data?.metadata?.bidId;

  switch (payload.type) {
    case "payment.succeeded": {
      if (bidId) {
        await fulfillBid(
          bidId,
          payload.data.payment_id ?? null,
          payload.data.customer?.email ?? null,
        );
      }
      break;
    }
    case "payment.failed":
    case "payment.cancelled": {
      if (bidId) await failBid(bidId);
      break;
    }
    default:
      // Everything else (refunds, disputes, subscriptions) is recorded but unhandled.
      break;
  }

  if (webhookId) {
    await db.webhookEvent.update({
      where: { id: webhookId },
      data: { processedAt: new Date() },
    });
  }

  return NextResponse.json({ received: true });
}
