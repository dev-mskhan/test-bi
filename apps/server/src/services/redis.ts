import { createClient } from "redis";
import { logger } from "./logger";

export const redisClient = createClient({
  url: process.env.REDIS_URL ?? "redis://localhost:6379",
});

redisClient.on("error", (err) => logger.error({ err }, "Redis error"));
redisClient.on("connect", () => logger.info("Redis connected"));

export async function connectRedis(): Promise<void> {
  if (!redisClient.isOpen) {
    await redisClient.connect();
  }
}