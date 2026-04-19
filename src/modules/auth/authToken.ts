import jwt from "jsonwebtoken";
import type { Response } from "express";
import { env } from "../../config/env.js";

type AuthTokenPayload = {
  sub: string;
  email: string;
};

type SameSiteOption = "lax" | "strict" | "none";

const getSameSiteOption = (): SameSiteOption => {
  return env.NODE_ENV === "production" ? "none" : "lax";
};

const cookieOptions = {
  httpOnly: true,
  secure: env.NODE_ENV === "production",
  sameSite: getSameSiteOption(),
  path: "/",
  maxAge: 7 * 24 * 60 * 60 * 1000
};

export const signAuthToken = (payload: AuthTokenPayload): string =>
  jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions["expiresIn"]
  });

export const verifyAuthToken = (token: string): AuthTokenPayload =>
  jwt.verify(token, env.JWT_SECRET) as AuthTokenPayload;

export const setAuthCookie = (res: Response, token: string): void => {
  res.cookie(env.AUTH_COOKIE_NAME, token, cookieOptions);
};

export const clearAuthCookie = (res: Response): void => {
  res.clearCookie(env.AUTH_COOKIE_NAME, cookieOptions);
};
