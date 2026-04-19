import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import { env } from "../config/env.js";
import { logger } from "../config/logger.js";
import { apiRouter } from "./router.js";
import { notFoundMiddleware } from "../middleware/notFound.js";
import { errorHandler } from "../middleware/errorHandler.js";
import { attachAuthUser } from "../middleware/auth.js";

export const createApp = () => {
  const app = express();

  app.use((req, _res, next) => {
    logger.debug({ method: req.method, path: req.path }, "Incoming request");
    next();
  });
  app.use(helmet());
  app.use(
    cors({
      origin(origin, callback) {
        if (!origin || env.CORS_ORIGINS.includes(origin)) {
          callback(null, true);
          return;
        }
        callback(new Error("CORS origin denied"));
      },
      methods: ["GET", "POST"],
      credentials: true
    })
  );

  app.use(express.json({ limit: "1mb" }));
  app.use(cookieParser());
  app.use(attachAuthUser);
  app.use("/api", apiRouter);
  app.use(notFoundMiddleware);
  app.use(errorHandler);

  return app;
};
