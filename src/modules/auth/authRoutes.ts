import { Router } from "express";
import { asyncHandler } from "../../middleware/http.js";
import { validate } from "../../middleware/validate.js";
import { loginSchema, registerSchema } from "../../validators/authValidators.js";
import { loginHandler, logoutHandler, meHandler, registerHandler } from "./authController.js";

const router = Router();

router.post("/register", validate(registerSchema), asyncHandler(registerHandler));
router.post("/login", validate(loginSchema), asyncHandler(loginHandler));
router.post("/logout", asyncHandler(logoutHandler));
router.get("/me", asyncHandler(meHandler));

export { router as authRoutes };
