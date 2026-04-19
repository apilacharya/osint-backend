import type { Request, Response, NextFunction } from "express";
import { notFoundError } from "./errors.js";

export const notFoundMiddleware = (_req: Request, _res: Response, next: NextFunction): void => {
  next(notFoundError("Route not found"));
};

