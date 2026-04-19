import rateLimit from "express-rate-limit";
import { env } from "../config/env.js";
import { ERROR_CODES, ERROR_TYPES } from "../config/constants.js";
const buildLimiter = (max) => rateLimit({
    windowMs: env.RATE_LIMIT_WINDOW_MS,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (_req, res) => {
        res.status(429).json({
            success: false,
            data: null,
            meta: {},
            error: {
                code: ERROR_CODES.RATE_LIMIT_EXCEEDED,
                type: ERROR_TYPES.RATE_LIMIT_EXCEEDED,
                message: "Too many requests. Please retry later.",
                details: {}
            }
        });
    }
});
export const searchWriteLimiter = buildLimiter(env.SEARCH_RATE_LIMIT_MAX);
export const reportWriteLimiter = buildLimiter(env.REPORT_RATE_LIMIT_MAX);
export const guestSearchLimiter = rateLimit({
    windowMs: env.RATE_LIMIT_WINDOW_MS,
    max: env.GUEST_SEARCH_RATE_LIMIT_MAX,
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => Boolean(req.authUser?.id),
    handler: (_req, res) => {
        res.status(429).json({
            success: false,
            data: null,
            meta: {},
            error: {
                code: ERROR_CODES.RATE_LIMIT_EXCEEDED,
                type: ERROR_TYPES.RATE_LIMIT_EXCEEDED,
                message: "Guest search rate limit exceeded. Sign in for higher limits.",
                details: {}
            }
        });
    }
});
