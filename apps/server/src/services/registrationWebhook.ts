import { ApiError } from "../utils/ApiError";

const REGISTRATION_WEBHOOK_URL = process.env.REGISTRATION_WEBHOOK_URL ?? "http://localhost:4300/api/registration/register";
const REGISTRATION_WEBHOOK_SECRET = process.env.REGISTRATION_WEBHOOK_SECRET;

export async function registerThroughWebhook(payload: { name: string; email: string; password: string }) {
  if (!REGISTRATION_WEBHOOK_SECRET) {
    throw new ApiError(500, "Registration webhook secret is not configured");
  }

  const timestamp = Date.now().toString();
  const response = await fetch(REGISTRATION_WEBHOOK_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-webhook-secret": REGISTRATION_WEBHOOK_SECRET,
      "x-webhook-timestamp": timestamp,
    },
    body: JSON.stringify(payload),
  });

  const text = await response.text();
  let result: any;

  try {
    result = JSON.parse(text);
  } catch {
    throw new ApiError(502, `Registration webhook returned invalid JSON: ${text}`);
  }

  if (!response.ok || result?.success === false) {
    const message = result?.message || response.statusText || "Webhook registration failed";
    throw new ApiError(502, `Registration webhook failed: ${message}`);
  }

  if (!result?.data) {
    throw new ApiError(502, "Registration webhook returned missing data");
  }

  return result.data;
}
