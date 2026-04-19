import type { NextFunction, Request, Response } from "express";
import { env } from "../config/env.js";
import { verifyAuthToken } from "../modules/auth/authToken.js";
import { authenticationRequiredError } from "./errors.js";

export const attachAuthUser = (req: Request, _res: Response, next: NextFunction): void => {
  const token = req.cookies?.[env.AUTH_COOKIE_NAME];
  if (!token || typeof token !== "string") {
    next();
    return;
  }

  try {
    const payload = verifyAuthToken(token);
    req.authUser = {
      id: payload.sub,
      email: payload.email
    };
  } catch {
    req.authUser = undefined;
  }
  next();
};

export const requireAuth = (req: Request, _res: Response, next: NextFunction): void => {
  if (!req.authUser?.id) {
    next(authenticationRequiredError());
    return;
  }

  next();
};
