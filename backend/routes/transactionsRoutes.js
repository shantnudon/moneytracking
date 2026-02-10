import express from "express";
import {
  getTransactions,
  createTransaction,
  bulkCreateTransactions,
  updateTransaction,
  getUnlistedTransactions,
  deleteTransaction,
  uploadBillAndParse,
  getPendingBills,
  snoozeBill,
  getUnsettledCount,
} from "../controllers/transactionController.js";
import { checkToken } from "../middleware/authMiddleware.js";
import { uploadBill } from "../middleware/uploadMiddleware.js";

const router = express.Router();

router.use(checkToken);

router.get("/", getTransactions);
router.post("/", createTransaction);
router.post("/bulk", bulkCreateTransactions);
router.get("/unlisted", getUnlistedTransactions);
router.post("/upload-bill", uploadBill.single("bill"), uploadBillAndParse);
router.get("/pending-bills", getPendingBills);
router.get("/unsettled-count", getUnsettledCount);
router.put("/:id/snooze", snoozeBill);
router.put("/:id", updateTransaction);
router.delete("/:id", deleteTransaction);

export default router;
