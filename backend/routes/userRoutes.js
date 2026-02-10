import express from "express";
import {
  getUserSettings,
  updateUserSettings,
  completeTour,
  resetTours,
} from "../controllers/userController.js";
import { checkToken } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(checkToken);

router.get("/settings", getUserSettings);
router.put("/settings", updateUserSettings);
router.post("/tour/:tourKey", completeTour);
router.post("/tours/reset", resetTours);

export default router;
