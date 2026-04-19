import { createApp } from "./app/createApp.js";
import { env } from "./config/env.js";
import { logger } from "./config/logger.js";
import { prisma } from "./db/prisma.js";

const app = createApp();

const start = async () => {
  await prisma.$connect();
  app.listen(env.PORT, () => {
    logger.info(`Backend listening on port ${env.PORT}`);
  });
};

start().catch((error) => {
  logger.error({ err: error }, "Failed to start backend");
  process.exit(1);
});

