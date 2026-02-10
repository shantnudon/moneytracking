import express from "express";
import {
  getSubscriptions,
  createSubscription,
  updateSubscription,
  deleteSubscription,
} from "../controllers/subscriptionController.js";
import { checkToken } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(checkToken);

router.get("/", getSubscriptions);
router.post("/", createSubscription);
router.put("/:id", updateSubscription);
router.delete("/:id", deleteSubscription);

export default router;
