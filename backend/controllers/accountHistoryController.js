import prisma from "../utils/prismaClient.js";
import { accountHistorySchema } from "../validators/investmentValidators.js";
// TODO : Add Zod validation for the request body and query parameters

export const getAccountHistory = async (req, res, next) => {
  try {
    const { accountId } = req.params;
    const { startDate, endDate } = req.query;
    const userId = req.user.id;

    const account = await prisma.account.findFirst({
      where: {
        id: accountId,
        userId,
      },
    });

    if (!account) {
      return res.status(404).json({ error: "Account not found" });
    }

    const where = {
      accountId: accountId,
    };

    if (startDate || endDate) {
      where.date = {};
      if (startDate) {
        where.date.gte = new Date(startDate);
      }
      if (endDate) {
        where.date.lte = new Date(endDate);
      }
    }

    const history = await prisma.accountHistory.findMany({
      where,
      orderBy: { date: "asc" },
    });

    res.json(history);
  } catch (error) {
    next(error);
  }
};

export const createHistoryEntry = async (req, res, next) => {
  try {
    const { accountId } = req.params;
    const { balance } = req.body;
    const userId = req.user.id;

    const account = await prisma.account.findFirst({
      where: {
        id: accountId,
        userId,
      },
    });

    if (!account) {
      return res.status(404).json({ error: "Account not found" });
    }

    await prisma.account.update({
      where: { id: accountId },
      data: { balance: parseFloat(balance) },
    });

    const historyEntry = await prisma.accountHistory.create({
      data: {
        accountId: accountId,
        balance: parseFloat(balance),
        source: "manual",
      },
    });

    res.status(201).json(historyEntry);
  } catch (error) {
    next(error);
  }
};

export const getHistoryStats = async (req, res, next) => {
  try {
    const { accountId } = req.params;
    const { startDate, endDate, interval = "day" } = req.query;
    const userId = req.user.id;

    const account = await prisma.account.findFirst({
      where: {
        id: accountId,
        userId,
      },
    });

    if (!account) {
      return res.status(404).json({ error: "Account not found" });
    }

    const where = {
      accountId: accountId,
    };

    if (startDate || endDate) {
      where.date = {};
      if (startDate) {
        where.date.gte = new Date(startDate);
      }
      if (endDate) {
        where.date.lte = new Date(endDate);
      }
    }

    const history = await prisma.accountHistory.findMany({
      where,
      orderBy: { date: "asc" },
    });

    const chartData = history.map((entry) => ({
      date: entry.date.toISOString().split("T")[0],
      balance: entry.balance,
      source: entry.source,
    }));

    res.json({
      data: chartData,
      currentBalance: account.balance,
      accountName: account.name,
    });
  } catch (error) {
    next(error);
  }
};
