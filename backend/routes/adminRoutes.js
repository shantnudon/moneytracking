import express from "express";
import {
  getCurrencies,
  createCurrency,
  updateCurrency,
  deleteCurrency,
  getInvestmentTypes,
  createInvestmentType,
  updateInvestmentType,
  deleteInvestmentType,
} from "../controllers/adminController.js";
import { checkToken, isAdmin } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/currencies", checkToken, getCurrencies);
router.get("/investment-types", checkToken, getInvestmentTypes);

router.post("/currencies", checkToken, isAdmin, createCurrency);
router.put("/currencies/:id", checkToken, isAdmin, updateCurrency);
router.delete("/currencies/:id", checkToken, isAdmin, deleteCurrency);

router.post("/investment-types", checkToken, isAdmin, createInvestmentType);
router.put("/investment-types/:id", checkToken, isAdmin, updateInvestmentType);
router.delete(
  "/investment-types/:id",
  checkToken,
  isAdmin,
  deleteInvestmentType,
);

export default router;
