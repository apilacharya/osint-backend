import type { NextFunction, Request, Response } from "express";
import type { ZodSchema } from "zod";
import { ZodError } from "zod";
import { ERROR_CODES, ERROR_TYPES } from "../config/constants.js";
import { createAppError } from "./errors.js";

export const validate =
  (schema: ZodSchema) =>
  (req: Request, _res: Response, next: NextFunction): void => {
    try {
      schema.parse({
        body: req.body,
        query: req.query,
        params: req.params
      });
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        next(
          createAppError({
            message: "Validation failed",
            status: 400,
            code: ERROR_CODES.VALIDATION_ERROR,
            type: ERROR_TYPES.VALIDATION_ERROR,
            details: { issues: error.issues }
          })
        );
        return;
      }
      next(error);
    }
  };
