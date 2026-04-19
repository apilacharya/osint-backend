import { Router } from "express";
import { omniSearch } from "./searchController.js";
import { asyncHandler } from "../../middleware/http.js";

const router = Router();
router.get("/", asyncHandler(omniSearch));

export { router as searchRoutes };
