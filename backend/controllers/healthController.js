import prisma from "../utils/prismaClient.js";

export const checkHealth = async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;

    res.status(200).json({
      status: "UP",
      database: "healthy",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error("Health Check Failed:", error);

    res.status(503).json({
      status: "DOWN",
      database: "disconnected",
      error: error.message,
    });
  }
};
