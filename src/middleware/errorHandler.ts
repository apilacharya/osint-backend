import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { ERROR_CODES, ERROR_TYPES } from "../config/constants.js";
import { isAppError } from "./errors.js";
import { logger } from "../config/logger.js";

export const errorHandler = (error: unknown, req: Request, res: Response, _next: NextFunction): void => {
  if (isAppError(error)) {
    res.status(error.status).json({
      success: false,
      data: null,
      meta: {},
      error: {
        code: error.code,
        type: error.type,
        message: error.message,
        details: error.details ?? {}
      }
    });
    return;
  }

  if (error instanceof ZodError) {
    res.status(400).json({
      success: false,
      data: null,
      meta: {},
      error: {
        code: ERROR_CODES.VALIDATION_ERROR,
        type: ERROR_TYPES.VALIDATION_ERROR,
        message: "Validation failed",
        details: { issues: error.issues }
      }
    });
    return;
  }

  logger.error({ err: error }, "Unhandled error");
  res.status(500).json({
    success: false,
    data: null,
    meta: {},
    error: {
      code: ERROR_CODES.INTERNAL_SERVER_ERROR,
      type: ERROR_TYPES.INTERNAL_SERVER_ERROR,
      message: "Internal server error",
      details: {}
    }
  });
};
