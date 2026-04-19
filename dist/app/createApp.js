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
    app.use(cors({
        origin(origin, callback) {
            if (!origin) {
                callback(null, true);
                return;
            }
            const normalizedOrigin = origin.replace(/\/$/, "");
            const isAllowed = env.CORS_ORIGINS.some((allowed) => allowed.replace(/\/$/, "") === normalizedOrigin);
            if (isAllowed) {
                callback(null, true);
                return;
            }
            logger.warn({ origin, normalizedOrigin, allowedOrigins: env.CORS_ORIGINS }, "CORS origin denied");
            callback(new Error("CORS origin denied"));
        },
        methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
        credentials: true
    }));
    app.use(express.json({ limit: "1mb" }));
    app.use(cookieParser());
    app.use(attachAuthUser);
    app.use("/api", apiRouter);
    app.use(notFoundMiddleware);
    app.use(errorHandler);
    return app;
};
