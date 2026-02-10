import bcrypt from "bcryptjs";
import * as crypto from "crypto";

import prisma from "../utils/prismaClient.js";
import logger from "../utils/logger.js";

// need to think about magic links and biometric login in the future

import {
  signupSchema,
  loginSchema,
  forgotPasswordSchema,
} from "../validators/authValidators.js";

const createSession = async (userId, req) => {
  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

  const session = await prisma.session.create({
    data: {
      userId,
      token,
      expiresAt,
      ipAddress: req.ip || req.headers["x-forwarded-for"] || "unknown",
      userAgent: req.headers["user-agent"] || "unknown",
    },
  });

  return session;
};

const getUserWithoutPassword = (user) => {
  const { password, ...userWithoutPassword } = user;
  return userWithoutPassword;
};

export const signup = async (req, res, next) => {
  try {
    const validatedData = signupSchema.parse(req.body);
    const { password, name, email } = validatedData;

    if (email) {
      const existingUserByEmail = await prisma.user.findUnique({
        where: { email: email },
      });
      if (existingUserByEmail) {
        return res.status(409).json({ message: "Email already in use" });
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email: email || null,
        name: name || null,
        password: hashedPassword,
        role: "USER",
        emailVerified: false,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        theme: true,
        isOnboardingCompleted: true,
        completedTours: true,
        notificationsEmail: true,
        notificationsNtfy: true,
        alertEmail: true,
        ntfyTopic: true,
        emailVerified: true,
        emailVerifiedAt: true,
      },
    });

    const session = await createSession(user.id, req);

    res
      .cookie("session_token", session.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      })
      .status(201)
      .json({ success: true, user, sessionId: session.id });

    logger.info(`User registered and logged in: ${user.email}`);
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const validatedData = loginSchema.parse(req.body);
    const { email, password } = validatedData;

    let user;
    if (email.includes("@")) {
      user = await prisma.user.findUnique({
        where: { email: email },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          password: true,
          theme: true,
          isOnboardingCompleted: true,
          completedTours: true,
          emailVerified: true,
          emailVerifiedAt: true,
          isActive: true,
        },
      });
    } else {
      return res.status(400).json({ message: "Invalid email address." });
    }

    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    if (!user.isActive) {
      return res.status(403).json({
        message: "Account has been deactivated. Please contact support.",
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const userWithoutPassword = getUserWithoutPassword(user);

    const session = await createSession(user.id, req);

    res
      .cookie("session_token", session.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      })
      .status(200)
      .json({
        success: true,
        user: userWithoutPassword,
        sessionId: session.id,
      });

    logger.info(`User logged in: ${userWithoutPassword.email}`);
  } catch (error) {
    logger.error("Login Error:", error);
    next(error);
  }
};

export const logout = async (req, res) => {
  try {
    const sessionToken = req.cookies.session_token;

    if (sessionToken) {
      await prisma.session.deleteMany({
        where: { token: sessionToken },
      });
    }

    res.clearCookie("session_token");
    return res
      .status(200)
      .json({ success: true, message: "Logged out successfully" });
  } catch (error) {
    logger.error("Logout Error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Error during logout" });
  }
};

export const verifySession = async (req, res) => {
  try {
    const sessionToken = req.cookies.session_token;

    if (!sessionToken) {
      return res
        .status(401)
        .json({ success: false, message: "No session found" });
    }

    const session = await prisma.session.findUnique({
      where: { token: sessionToken },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            theme: true,
            isOnboardingCompleted: true,
            completedTours: true,
            emailVerified: true,
            emailVerifiedAt: true,
            isActive: true,
          },
        },
      },
    });

    if (!session) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid session" });
    }

    if (new Date() > session.expiresAt) {
      await prisma.session.delete({ where: { id: session.id } });
      res.clearCookie("session_token");
      return res
        .status(401)
        .json({ success: false, message: "Session expired" });
    }

    return res.status(200).json({ success: true, user: session.user });
  } catch (error) {
    logger.error("Verify Session Error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Error verifying session" });
  }
};

export const refreshSession = async (req, res) => {
  try {
    const sessionToken = req.cookies.session_token;

    if (!sessionToken) {
      return res
        .status(401)
        .json({ success: false, message: "No session found" });
    }

    const session = await prisma.session.findUnique({
      where: { token: sessionToken },
    });

    if (!session) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid session" });
    }

    if (new Date() > session.expiresAt) {
      await prisma.session.delete({ where: { id: session.id } });
      res.clearCookie("session_token");
      return res
        .status(401)
        .json({ success: false, message: "Session expired" });
    }

    const newExpiresAt = new Date();
    newExpiresAt.setDate(newExpiresAt.getDate() + 7);

    const updatedSession = await prisma.session.update({
      where: { id: session.id },
      data: { expiresAt: newExpiresAt },
    });

    return res.status(200).json({
      success: true,
      message: "Session refreshed",
      expiresAt: updatedSession.expiresAt,
    });
  } catch (error) {
    logger.error("Refresh Session Error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Error refreshing session" });
  }
};

export const forgotPassword = async (req, res, next) => {
  try {
    const validatedData = forgotPasswordSchema.parse(req.body);
    const { identifier } = validatedData;

    const user = await prisma.user.findFirst({
      where: {
        OR: [{ email: identifier }],
      },
    });

    if (user) {
      const resetToken = crypto.randomBytes(32).toString("hex");

      const expiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000); // 2 hours

      await prisma.verificationToken.create({
        data: {
          identifier: user.email,
          token: resetToken,
          expiresAt,
        },
      });

      const resetURL = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
      const message = `You have requested a password reset for your MoneyTracker account. Please click the following link to reset your password. This link is valid for 2 hours.\n\n${resetURL}\n\nIf you did not request this, please ignore this email.`;

      try {
        // TODO: Implement email sending
        logger.info("Password reset URL:", resetURL);
      } catch (err) {
        logger.error("FORGOT PASSWORD EMAIL SENDING ERROR:", err);
        await prisma.verificationToken.deleteMany({
          where: { token: resetToken },
        });
      }
    } else {
      logger.info(
        `Password reset requested for a non-existent identifier: ${identifier}`,
      );
    }

    res.status(200).json({
      message:
        "If an account with that email exists, a password reset link has been sent.",
    });
  } catch (error) {
    next(error);
  }
};

export const checkResetToken = async (req, res, next) => {
  try {
    const { token } = req.params;

    const verificationToken = await prisma.verificationToken.findFirst({
      where: {
        token,
        expiresAt: { gt: new Date() },
      },
    });

    if (!verificationToken) {
      return res
        .status(400)
        .json({ message: "Token is invalid or has expired." });
    }

    res.status(200).json({ message: "Token is valid." });
  } catch (error) {
    next(error);
  }
};

export const resetPassword = async (req, res, next) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    if (!password || password.length < 6) {
      return res
        .status(400)
        .json({ message: "Password must be at least 6 characters long." });
    }

    const verificationToken = await prisma.verificationToken.findFirst({
      where: {
        token,
        expiresAt: { gt: new Date() },
      },
    });

    if (!verificationToken) {
      return res
        .status(400)
        .json({ message: "Token is invalid or has expired." });
    }

    const user = await prisma.user.findUnique({
      where: { email: verificationToken.identifier },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      },
    });

    if (!user) {
      return res.status(400).json({ message: "User not found." });
    }

    const newHashedPassword = await bcrypt.hash(password, 10);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: newHashedPassword,
      },
    });

    await prisma.verificationToken.deleteMany({
      where: { identifier: user.email },
    });

    await prisma.session.deleteMany({
      where: { userId: user.id },
    });

    const session = await createSession(user.id, req);

    res
      .cookie("session_token", session.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      })
      .status(200)
      .json({
        user: user,
        sessionId: session.id,
        message: "Password reset successful.",
      });
  } catch (error) {
    next(error);
  }
};

export const getUserSessions = async (req, res) => {
  try {
    const userId = req.user.id;

    const sessions = await prisma.session.findMany({
      where: {
        userId,
        expiresAt: { gt: new Date() },
      },
      select: {
        id: true,
        ipAddress: true,
        userAgent: true,
        createdAt: true,
        expiresAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return res.status(200).json({ success: true, sessions });
  } catch (error) {
    logger.error("Get User Sessions Error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Error fetching sessions" });
  }
};

export const revokeSession = async (req, res) => {
  try {
    const userId = req.user.id;
    const { sessionId } = req.params;

    const session = await prisma.session.findUnique({
      where: { id: sessionId },
    });

    if (!session || session.userId !== userId) {
      return res
        .status(404)
        .json({ success: false, message: "Session not found" });
    }

    await prisma.session.delete({
      where: { id: sessionId },
    });

    return res
      .status(200)
      .json({ success: true, message: "Session revoked successfully" });
  } catch (error) {
    logger.error("Revoke Session Error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Error revoking session" });
  }
};

export const revokeAllOtherSessions = async (req, res) => {
  try {
    const userId = req.user.id;
    const currentSessionToken = req.cookies.session_token;

    const currentSession = await prisma.session.findUnique({
      where: { token: currentSessionToken },
    });

    if (!currentSession) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid current session" });
    }

    const result = await prisma.session.deleteMany({
      where: {
        userId,
        id: { not: currentSession.id },
      },
    });

    return res.status(200).json({
      success: true,
      message: `${result.count} session(s) revoked successfully`,
    });
  } catch (error) {
    logger.error("Revoke All Other Sessions Error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Error revoking sessions" });
  }
};
