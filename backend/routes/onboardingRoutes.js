import express from "express";
import { completeOnboarding } from "../controllers/onboardingController.js";
import { checkToken } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", checkToken, completeOnboarding);

export default router;
