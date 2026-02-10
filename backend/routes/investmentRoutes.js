import express from "express";
import {
  createInvestment,
  getInvestmentsByAccount,
  updateInvestment,
  deleteInvestment,
  refreshPrices,
  searchInvestments,
  getInvestmentQuote,
} from "../controllers/investmentController.js";
import { checkToken } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(checkToken);

router.post("/", createInvestment);
router.get("/account/:accountId", getInvestmentsByAccount);
router.put("/:id", updateInvestment);
router.delete("/:id", deleteInvestment);
router.post("/refresh/:accountId", refreshPrices);
router.get("/search", searchInvestments);
router.get("/quote", getInvestmentQuote);

export default router;
