import express from "express";
import {
  getAccountTypes,
  createAccountType,
  updateAccountType,
  deleteAccountType,
} from "../controllers/accountTypeController.js";
import { checkToken } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(checkToken);

router.get("/", getAccountTypes);
router.post("/", createAccountType);
router.put("/:id", updateAccountType);
router.delete("/:id", deleteAccountType);

export default router;
