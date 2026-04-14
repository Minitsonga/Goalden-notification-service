import { Router } from "express";
import { sendEmail, sendSelection } from "../controllers/internal.controller.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

router.post("/send-email", asyncHandler(sendEmail));
router.post("/send-selection", asyncHandler(sendSelection));

export default router;
