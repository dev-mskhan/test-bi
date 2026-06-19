const WEBHOOK_SERVER_URL =
  process.env.WEBHOOK_SERVER_URL ?? "http://localhost:5002";

interface EmitUserCreatedPayload {
  webhookId: string;
  name: string;
  email: string;
  role: string;
}

export async function emitUserCreatedWebhook(
  payload: EmitUserCreatedPayload,
): Promise<void> {
  try {
    const response = await fetch(
      `${WEBHOOK_SERVER_URL}/webhooks/user-created`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      },
    );

    if (!response.ok) {
      const body = await response.text();
      console.error(
        `[webhook-emitter] webhook-server-1 responded with ${response.status}: ${body}`,
      );
      return;
    }

    console.log(
      `[webhook-emitter] user-created webhook delivered for webhookId=${payload.webhookId}`,
    );
  } catch (error) {
    // Intentionally non-blocking: a failed webhook emit should not fail signup.
    console.error(
      "[webhook-emitter] Failed to emit user-created webhook:",
      error,
    );
  }
}
