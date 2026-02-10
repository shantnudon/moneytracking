import prisma from "../utils/prismaClient.js";
import logger from "../utils/logger.js";

export const checkToken = async (req, res, next) => {
  try {
    const sessionToken = req.cookies.session_token;

    if (!sessionToken) {
      return res
        .status(401)
        .json({ success: false, message: "No session token provided" });
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
            isActive: true,
            emailVerified: true,
          },
        },
      },
    });

    if (!session) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid session token" });
    }

    if (new Date() > session.expiresAt) {
      await prisma.session.delete({ where: { id: session.id } });
      res.clearCookie("session_token");
      return res
        .status(401)
        .json({ success: false, message: "Session has expired" });
    }

    if (!session.user.isActive) {
      return res.status(403).json({
        success: false,
        message: "Account has been deactivated",
      });
    }

    req.user = session.user;
    req.sessionId = session.id;

    const hoursSinceUpdate =
      (new Date() - new Date(session.updatedAt)) / (1000 * 60 * 60);
    if (hoursSinceUpdate >= 1) {
      await prisma.session.update({
        where: { id: session.id },
        data: { updatedAt: new Date() },
      });
    }

    next();
  } catch (error) {
    logger.error("Auth Middleware Error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Authentication error" });
  }
};

export const isAdmin = (req, res, next) => {
  if (req.user && req.user.role === "ADMIN") {
    next();
  } else {
    return res
      .status(403)
      .json({ success: false, message: "Access denied. Admin only." });
  }
};

export const requireEmailVerification = (req, res, next) => {
  if (req.user) {
    next();
  } else {
    return res.status(403).json({
      success: false,
      message: "Email verification required to access this resource.",
    });
  }
};

const loginAttempts = new Map();

export const rateLimitLogin = (req, res, next) => {
  const identifier = req.body.email || req.ip;
  const now = Date.now();
  const windowMs = 15 * 60 * 1000; // 15 minutes
  const maxAttempts = 5;

  if (!loginAttempts.has(identifier)) {
    loginAttempts.set(identifier, []);
  }

  const attempts = loginAttempts.get(identifier);

  const recentAttempts = attempts.filter(
    (timestamp) => now - timestamp < windowMs,
  );
  loginAttempts.set(identifier, recentAttempts);

  if (recentAttempts.length >= maxAttempts) {
    return res.status(429).json({
      success: false,
      message: "Too many login attempts. Please try again later.",
    });
  }

  recentAttempts.push(now);
  loginAttempts.set(identifier, recentAttempts);

  next();
};

export const cleanupExpiredSessions = async () => {
  try {
    const result = await prisma.session.deleteMany({
      where: {
        expiresAt: { lt: new Date() },
      },
    });
    logger.info(`Cleaned up ${result.count} expired sessions`);
  } catch (error) {
    logger.error("Session Cleanup Error:", error);
  }
};
