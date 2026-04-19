import { Router } from "express";
import { asyncHandler } from "../../utils/http.js";
import { validate } from "../../middleware/validate.js";
import { resourceQuerySchema } from "../../validators/query.validators.js";
import { queryResourceHandler } from "./query.controller.js";
const router = Router();
router.post("/", validate(resourceQuerySchema), asyncHandler(queryResourceHandler));
export { router as queryRoutes };
