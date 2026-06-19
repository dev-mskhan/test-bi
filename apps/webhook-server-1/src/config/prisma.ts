import { PrismaClient } from "@prisma/client";

// Prevent multiple PrismaClient instances in dev (ts-node-dev hot reload)
declare global {
  // eslint-disable-next-line no-var
  var __webhookPrisma: PrismaClient | undefined;
}

export const prisma =
  global.__webhookPrisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  global.__webhookPrisma = prisma;
}
