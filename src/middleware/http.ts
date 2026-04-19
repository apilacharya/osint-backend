import type { NextFunction, Request, Response } from "express";

export const sendSuccess = <T>(res: Response, data: T, meta: Record<string, unknown> = {}, status = 200) => {
  res.status(status).json({
    success: true,
    data,
    meta,
    error: null
  });
};

export const asyncHandler =
  (handler: (req: Request, res: Response, next: NextFunction) => Promise<void>) =>
  (req: Request, res: Response, next: NextFunction): void => {
    handler(req, res, next).catch(next);
  };

