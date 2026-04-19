import { notFoundError } from "./errors.js";
export const notFoundMiddleware = (_req, _res, next) => {
    next(notFoundError("Route not found"));
};
