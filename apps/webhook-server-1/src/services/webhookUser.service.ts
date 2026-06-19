import { prisma } from "../config/prisma";
import { CreateWebhookUserInput } from "../validation/webhookUser.validation";

export async function createOrUpdateWebhookUser(input: CreateWebhookUserInput) {
  // Upsert so a re-emitted webhook (e.g. retry) doesn't create duplicates
  return prisma.webhook_users.upsert({
    where: { webhook_id: input.webhookId },
    update: {
      webhook_secret: input.webhookSecret,
      name: input.name,
      email: input.email,
    },
    create: {
      webhook_id: input.webhookId,
      webhook_secret: input.webhookSecret,
      name: input.name,
      email: input.email,
    },
  });
}

export async function getWebhookUserByWebhookId(webhookId: string) {
  return prisma.webhook_users.findUnique({
    where: { webhook_id: webhookId },
  });
}
