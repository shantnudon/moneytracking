import express from "express";
import {
  getBudgets,
  createBudget,
  updateBudget,
  deleteBudget,
} from "../controllers/budgetController.js";
import { checkToken } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(checkToken);

router.get("/", getBudgets);
router.post("/", createBudget);
router.put("/:id", updateBudget);
router.delete("/:id", deleteBudget);

export default router;
