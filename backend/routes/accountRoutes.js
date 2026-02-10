import express from "express";
import {
  createAccount,
  getAccounts,
  updateAccount,
  deleteAccount,
  recalculateBalance,
  updateBalanceManually,
  getAccountWithInvestments,
} from "../controllers/accountController.js";
import { getAccountHistory } from "../controllers/accountHistoryController.js";
import { checkToken } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(checkToken);

router.post("/", createAccount);
router.get("/", getAccounts);
router.put("/:id", updateAccount);
router.delete("/:id", deleteAccount);
router.post("/:id/recalculate", recalculateBalance);
router.post("/:id/balance", updateBalanceManually);
router.get("/:accountId/history", getAccountHistory);
router.get("/:id/details", getAccountWithInvestments);

export default router;
