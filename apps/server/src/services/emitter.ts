import axios from "axios";
import crypto from "crypto";

const WEBHOOK_SERVER_URL = process.env.WEBHOOK_SERVER_URL!;
const WEBHOOK_SECRET     = process.env.WEBHOOK_SECRET!;
const WEBHOOK_ID         = process.env.WEBHOOK_ID!;

export type UserEventType =
  | "user.registered"
  | "user.login"
  | "user.logout"
  | "user.password_changed"
  | "user.deleted";

export interface WebhookPayload {
  event:     UserEventType;
  timestamp: string;
  data:      Record<string, unknown>;
}

export async function emitUserEvent(
  event: UserEventType,
  data:  Record<string, unknown>
): Promise<void> {
  if (!WEBHOOK_SERVER_URL || !WEBHOOK_SECRET || !WEBHOOK_ID) {
    console.warn("⚠️  Webhook env vars not set, skipping emit");
    return;
  }

  const payload: WebhookPayload = {
    event,
    timestamp: new Date().toISOString(),
    data,
  };

  const body      = JSON.stringify(payload);
  const signature = crypto
    .createHmac("sha256", WEBHOOK_SECRET)
    .update(body)
    .digest("hex");

  try {
    await axios.post(
      `${WEBHOOK_SERVER_URL}/webhooks/ingest/${WEBHOOK_ID}`,
      payload,
      {
        headers: {
          "Content-Type":        "application/json",
          "x-webhook-signature": signature,
          "x-webhook-timestamp": payload.timestamp,
        },
        timeout: 5_000,
      }
    );
    console.log(`📡 Webhook emitted: ${event}`);
  } catch (err) {
    console.error(`⚠️  Webhook emit failed for ${event}:`, err);
  }
}