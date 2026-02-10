import express from "express";
import prisma from "../utils/prismaClient.js";
import {
  signup,
  login,
  logout,
  forgotPassword,
  resetPassword,
  checkResetToken,
  verifySession,
  refreshSession,
  getUserSessions,
  revokeSession,
  revokeAllOtherSessions,
} from "../controllers/authController.js";

import { checkToken, rateLimitLogin } from "../middleware/authMiddleware.js";
import { checkPendingBillsAndNotify } from "../services/notificationService.js";

const router = express.Router();

// Public routes with rate limiting
router.post("/signup", rateLimitLogin, signup);
router.post("/login", rateLimitLogin, login);
router.post("/logout", logout);

// Password reset routes
router.post("/forgotpassword", forgotPassword);
router.post("/reset-password/:token", resetPassword);
router.get("/check-reset-token/:token", checkResetToken);

// Session management routes
router.get("/verify-session", verifySession);
router.post("/refresh-session", refreshSession);

// Protected routes
router.get("/me", checkToken, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isOnboardingCompleted: true,
        currency: true,
        theme: true,
        completedTours: true,
        notificationsEmail: true,
        notificationsNtfy: true,
        ntfyTopic: true,
        emailVerified: true,
        emailVerifiedAt: true,
      },
    });

    checkPendingBillsAndNotify(user.id).catch((err) =>
      logger.error("Notification trigger failed:", err),
    );

    return res.status(200).json({
      success: true,
      user: user,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

// Session management for logged-in users
router.get("/sessions", checkToken, getUserSessions);
router.delete("/sessions/:sessionId", checkToken, revokeSession);
router.delete(
  "/sessions/revoke-all-others",
  checkToken,
  revokeAllOtherSessions,
);

export default router;
