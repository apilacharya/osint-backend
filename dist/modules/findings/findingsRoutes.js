import { Router } from "express";
import { getFindingById } from "./findingsController.js";
import { asyncHandler } from "../../middleware/http.js";
import { validate } from "../../middleware/validate.js";
import { findingIdSchema } from "../../validators/reportValidators.js";
import { requireAuth } from "../../middleware/auth.js";
const router = Router();
router.get("/:id", requireAuth, validate(findingIdSchema), asyncHandler(getFindingById));
export { router as findingsRoutes };
