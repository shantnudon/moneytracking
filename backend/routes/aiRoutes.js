import express from "express";
import { processChatMessage } from "../controllers/aiController.js";
import { checkToken } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/chat", checkToken, processChatMessage);

export default router;
