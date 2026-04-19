import type { Request, Response } from "express";
import { sendSuccess } from "../../middleware/http.js";
import { clearAuthCookie, setAuthCookie, signAuthToken } from "./authToken.js";
import { getAuthUserById, loginUser, registerUser } from "./authService.js";

export const registerHandler = async (req: Request, res: Response): Promise<void> => {
  const body = req.body as { name: string; email: string; password: string };
  const user = await registerUser(body);
  const token = signAuthToken({ sub: user.id, email: user.email });
  setAuthCookie(res, token);
  sendSuccess(res, { authenticated: true, user }, {}, 201);
};

export const loginHandler = async (req: Request, res: Response): Promise<void> => {
  const body = req.body as { email: string; password: string };
  const user = await loginUser(body);
  const token = signAuthToken({ sub: user.id, email: user.email });
  setAuthCookie(res, token);
  sendSuccess(res, { authenticated: true, user }, {}, 200);
};

export const meHandler = async (req: Request, res: Response): Promise<void> => {
  if (!req.authUser?.id) {
    sendSuccess(res, { authenticated: false, mode: "guest", user: null }, {}, 200);
    return;
  }

  const user = await getAuthUserById(req.authUser.id);
  if (!user) {
    sendSuccess(res, { authenticated: false, mode: "guest", user: null }, {}, 200);
    return;
  }

  sendSuccess(res, { authenticated: true, mode: "authenticated", user }, {}, 200);
};

export const logoutHandler = async (_req: Request, res: Response): Promise<void> => {
  clearAuthCookie(res);
  sendSuccess(res, { loggedOut: true }, {}, 200);
};
