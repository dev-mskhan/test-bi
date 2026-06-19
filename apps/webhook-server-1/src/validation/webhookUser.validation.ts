import { z } from "zod";

export const createWebhookUserSchema = z.object({
  webhookId: z.string().min(1, "webhookId is required"),
  webhookSecret: z.string().min(1, "webhookSecret is required"),
  name: z.string().min(1, "name is required"),
  email: z.string().email("email must be valid"),
});

export type CreateWebhookUserInput = z.infer<typeof createWebhookUserSchema>;

export const webhookIdParamSchema = z.object({
  webhookId: z.string().min(1, "webhookId is required"),
});
