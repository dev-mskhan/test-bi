import { Request, Response } from "express";
import {
  createWebhookUserSchema,
  webhookIdParamSchema,
} from "../validation/webhookUser.validation";
import {
  createOrUpdateWebhookUser,
  getWebhookUserByWebhookId,
} from "../services/webhookUser.service";

export async function handleUserCreated(req: Request, res: Response) {
  const parsed = createWebhookUserSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      message: "Invalid payload",
      errors: parsed.error.flatten().fieldErrors,
    });
  }

  try {
    const record = await createOrUpdateWebhookUser(parsed.data);

    return res.status(201).json({
      success: true,
      message: "Webhook user stored",
      data: {
        webhookId: record.webhook_id,
        name: record.name,
        email: record.email,
        createdAt: record.created_at,
      },
    });
  } catch (error) {
    console.error("[webhook-server-1] Failed to store webhook user:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to store webhook user",
    });
  }
}

export async function handleGetWebhookUser(req: Request, res: Response) {
  const parsed = webhookIdParamSchema.safeParse(req.params);

  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      message: "Invalid webhookId",
    });
  }

  try {
    const record = await getWebhookUserByWebhookId(parsed.data.webhookId);

    if (!record) {
      return res.status(404).json({
        success: false,
        message: "Webhook user not found",
      });
    }

    return res.status(200).json({
      webhookId: record.webhook_id,
      name: record.name,
      email: record.email,
      createdAt: record.created_at,
    });
  } catch (error) {
    console.error("[webhook-server-1] Failed to fetch webhook user:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch webhook user",
    });
  }
}
