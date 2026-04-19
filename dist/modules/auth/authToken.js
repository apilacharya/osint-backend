import jwt from "jsonwebtoken";
import { env } from "../../config/env.js";
const getSameSiteOption = () => {
    return env.NODE_ENV === "production" ? "none" : "lax";
};
const cookieOptions = {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: getSameSiteOption(),
    path: "/",
    maxAge: 7 * 24 * 60 * 60 * 1000
};
export const signAuthToken = (payload) => jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN
});
export const verifyAuthToken = (token) => jwt.verify(token, env.JWT_SECRET);
export const setAuthCookie = (res, token) => {
    res.cookie(env.AUTH_COOKIE_NAME, token, cookieOptions);
};
export const clearAuthCookie = (res) => {
    res.clearCookie(env.AUTH_COOKIE_NAME, cookieOptions);
};
