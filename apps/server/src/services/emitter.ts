const WEBHOOK_SERVER_URL =
  process.env.WEBHOOK_SERVER_URL ?? "http://localhost:8000"; // webhook-service ka URL (ngrok wala)

interface EmitUserCreatedPayload {
  webhookId: string;
  webhookSecret: string;
  name: string;
  email: string;
  role: string;
}

export async function emitUserCreatedWebhook(
  payload: EmitUserCreatedPayload,
): Promise<void> {
  try {
    const response = await fetch(
      `${WEBHOOK_SERVER_URL}/webhooks/user-created`,  // same endpoint
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      },
    );

    if (!response.ok) {
      const body = await response.text();
      console.error(`[webhook-emitter] responded with ${response.status}: ${body}`);
      return;
    }

    console.log(`[webhook-emitter] user-created webhook delivered for webhookId=${payload.webhookId}`);
  } catch (error) {
    console.error("[webhook-emitter] Failed to emit user-created webhook:", error);
  }
}