import prisma from "../utils/prismaClient.js";
import { budgetSchema } from "../validators/financeValidators.js";
import logger from "../utils/logger.js";

// TODO: implement logger in here 

export const getBudgets = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const budgets = await prisma.budget.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: {
        category: {
          include: {
            transactions: {
              where: { type: "expense" },
              select: { id: true, amount: true, date: true, type: true },
            },
          },
        },
        transactions: {
          where: { type: "expense" },
          select: { id: true, amount: true, date: true, type: true },
        },
      },
    });

    const budgetsWithSpent = budgets.map((budget) => {
      const txMap = new Map();
      budget.transactions.forEach((t) => txMap.set(t.id, t));
      if (budget.category && budget.category.transactions) {
        budget.category.transactions.forEach((t) => txMap.set(t.id, t));
      }

      const allTransactions = Array.from(txMap.values());
      let relevantTransactions = allTransactions;
      const now = new Date();

      if (budget.frequency === "monthly") {
        relevantTransactions = allTransactions.filter((t) => {
          const d = new Date(t.date);
          return (
            d.getMonth() === now.getMonth() &&
            d.getFullYear() === now.getFullYear()
          );
        });
      } else if (budget.frequency === "yearly") {
        relevantTransactions = allTransactions.filter((t) => {
          const d = new Date(t.date);
          return d.getFullYear() === now.getFullYear();
        });
      } else if (budget.frequency === "daily") {
        relevantTransactions = allTransactions.filter((t) => {
          const d = new Date(t.date);
          return d.toDateString() === now.toDateString();
        });
      } else if (budget.frequency === "weekly") {
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay());
        startOfWeek.setHours(0, 0, 0, 0);
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        endOfWeek.setHours(23, 59, 59, 999);

        relevantTransactions = allTransactions.filter((t) => {
          const d = new Date(t.date);
          return d >= startOfWeek && d <= endOfWeek;
        });
      } else if (
        budget.frequency === "custom" &&
        budget.startDate &&
        budget.endDate
      ) {
        relevantTransactions = allTransactions.filter((t) => {
          const d = new Date(t.date);
          return (
            d >= new Date(budget.startDate) && d <= new Date(budget.endDate)
          );
        });
      }

      const spent = relevantTransactions.reduce((sum, t) => sum + t.amount, 0);
      const { transactions, ...budgetData } = budget;
      return { ...budgetData, spent };
    });

    res.json(budgetsWithSpent);
  } catch (error) {
    next(error);
  }
};

export const createBudget = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const validatedData = budgetSchema.parse(req.body);

    if (validatedData.categoryId) {
      const category = await prisma.category.findFirst({
        where: {
          id: validatedData.categoryId,
          OR: [{ userId }, { userId: null }],
        },
      });
      if (!category) {
        return res
          .status(403)
          .json({ error: "Unauthorized: Category does not belong to user" });
      }
    }

    const budget = await prisma.budget.create({
      data: {
        ...validatedData,
        userId,
      },
    });
    res.status(201).json(budget);
  } catch (error) {
    next(error);
  }
};

export const updateBudget = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const validatedData = budgetSchema.partial().parse(req.body);

    if (validatedData.categoryId) {
      const category = await prisma.category.findFirst({
        where: {
          id: validatedData.categoryId,
          OR: [{ userId }, { userId: null }],
        },
      });
      if (!category) {
        return res
          .status(403)
          .json({ error: "Unauthorized: Category does not belong to user" });
      }
    }

    const budget = await prisma.budget.updateMany({
      where: { id, userId },
      data: validatedData,
    });

    if (budget.count === 0) {
      return res.status(404).json({ error: "Budget not found" });
    }

    res.json({ message: "Budget updated successfully" });
  } catch (error) {
    next(error);
  }
};

export const deleteBudget = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const budget = await prisma.budget.deleteMany({
      where: { id, userId },
    });

    if (budget.count === 0) {
      return res.status(404).json({ error: "Budget not found" });
    }

    res.json({ message: "Budget deleted successfully" });
  } catch (error) {
    next(error);
  }
};
