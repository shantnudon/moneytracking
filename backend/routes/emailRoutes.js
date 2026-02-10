import express from "express";
import {
  saveEmailConfig,
  getEmailConfig,
  testEmailConfig,
} from "../controllers/emailController.js";
import { checkToken } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(checkToken);

router.post("/config", saveEmailConfig);
router.get("/config", getEmailConfig);
router.post("/config/test", testEmailConfig);

export default router;
