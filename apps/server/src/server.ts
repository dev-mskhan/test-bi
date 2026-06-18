import "dotenv/config";
import app from "./app";
import { prisma } from "./services/prisma";
import { connectRedis } from "./services/redis";
import { bootScheduler } from "./workflow/scheduler";
import { logger } from "./services/logger";

const PORT = Number(process.env.PORT ?? 3000);

async function bootstrap() {
  try {
    // 1. DB ping
    await prisma.$queryRaw`SELECT 1`;
    logger.info("PostgreSQL connected");

    // 2. Redis
    await connectRedis();

    // 3. Boot cron scheduler — picks up all active workflows from DB
    await bootScheduler();

    // 4. Start HTTP server
    app.listen(PORT, () => {
      logger.info(`Server running on http://localhost:${PORT}`);
    });
  } catch (err) {
    logger.error({ err }, "Bootstrap failed");
    process.exit(1);
  }
}

// Graceful shutdown
process.on("SIGTERM", async () => {
  logger.info("SIGTERM — shutting down");
  await prisma.$disconnect();
  process.exit(0);
});

process.on("SIGINT", async () => {
  await prisma.$disconnect();
  process.exit(0);
});

bootstrap();