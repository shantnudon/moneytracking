import express from "express";
import {
  getAccountHistory,
  createHistoryEntry,
  getHistoryStats,
} from "../controllers/accountHistoryController.js";
import { checkToken } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(checkToken);

router.get("/:accountId", getAccountHistory);
router.post("/:accountId", createHistoryEntry);
router.get("/:accountId/stats", getHistoryStats);

export default router;
