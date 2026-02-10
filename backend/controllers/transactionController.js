import prisma from "../utils/prismaClient.js";
import { transactionSchema } from "../validators/financeValidators.js";
import { updateBalancesForTransaction } from "../utils/balanceUtils.js";
import { z } from "zod";
import logger from "../utils/logger.js";

export const getTransactions = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const {
      status,
      limit = 10,
      page = 1,
      startDate,
      endDate,
      search,
      sortBy = "date",
      sortOrder = "desc",
      type,
      accountId,
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    const where = { userId };
    if (status) {
      where.status = status;
    }

    if (accountId) {
      where.OR = [
        { accountId: accountId },
        { destinationAccountId: accountId },
      ];
    }

    if (type) {
      if (type === "expenses") {
        where.type = { in: ["expense", "transfer"] };
      } else {
        where.type = type;
      }
    }

    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        where.date.lte = end;
      }
    }

    if (search) {
      where.OR = [
        { description: { contains: search, mode: "insensitive" } },
        { budget: { name: { contains: search, mode: "insensitive" } } },
      ];
    }

    let orderBy = { [sortBy]: sortOrder };
    if (sortBy === "category") {
      orderBy = { category: { name: sortOrder } };
    } else if (sortBy === "budget") {
      orderBy = { budget: { name: sortOrder } };
    } else if (sortBy === "account") {
      orderBy = { account: { name: sortOrder } };
    }

    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        orderBy,
        skip,
        take,
        include: {
          budget: true,
          account: true,
          category: true,
          destinationAccount: true,
        },
      }),
      prisma.transaction.count({ where }),
    ]);

    res.json({
      transactions,
      pagination: {
        total,
        page: parseInt(page),
        limit: take,
        totalPages: Math.ceil(total / take),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const createTransaction = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const validatedData = transactionSchema.parse(req.body);
    const {
      description,
      amount,
      date,
      type,
      accountId,
      budgetId,
      categoryId,
      status,
      destinationAccountId,
      bankTransactionId,
      note,
    } = validatedData;

    if (accountId) {
      const account = await prisma.account.findFirst({
        where: { id: accountId, userId },
      });
      if (!account) {
        return res
          .status(403)
          .json({ error: "Unauthorized: Account does not belong to user" });
      }

      if (new Date(date) < new Date(account.startDate)) {
        return res.status(400).json({
          error: `Transaction date cannot be earlier than account tracking date (${new Date(account.startDate).toLocaleDateString()})`,
        });
      }
    }

    if (destinationAccountId) {
      const destAccount = await prisma.account.findFirst({
        where: { id: destinationAccountId, userId },
      });
      if (!destAccount) {
        return res.status(403).json({
          error: "Unauthorized: Destination account does not belong to user",
        });
      }

      if (new Date(date) < new Date(destAccount.startDate)) {
        return res.status(400).json({
          error: `Transaction date cannot be earlier than destination account tracking date (${new Date(destAccount.startDate).toLocaleDateString()})`,
        });
      }
    }

    if (budgetId) {
      const budget = await prisma.budget.findFirst({
        where: { id: budgetId, userId },
      });
      if (!budget) {
        return res
          .status(403)
          .json({ error: "Unauthorized: Budget does not belong to user" });
      }
    }

    if (categoryId) {
      const category = await prisma.category.findFirst({
        where: {
          id: categoryId,
          OR: [{ userId }, { userId: null }],
        },
      });
      if (!category) {
        return res
          .status(403)
          .json({ error: "Unauthorized: Category does not belong to user" });
      }
    }

    if (bankTransactionId) {
      const existing = await prisma.transaction.findUnique({
        where: { bankTransactionId },
      });
      if (existing) {
        return res.status(400).json({
          error:
            "Duplicate Transaction: A record with this Bank Transaction ID already exists.",
        });
      }
    }

    const transaction = await prisma.$transaction(async (tx) => {
      const newTransaction = await tx.transaction.create({
        data: {
          description,
          amount,
          date,
          type,
          accountId,
          destinationAccountId,
          budgetId,
          categoryId,
          status,
          userId,
          bankTransactionId,
          note,
        },
        include: {
          budget: true,
          account: true,
          destinationAccount: true,
          category: true,
        },
      });

      await updateBalancesForTransaction(newTransaction, "create", null, tx);

      return newTransaction;
    });

    res.status(201).json(transaction);
  } catch (error) {
    next(error);
  }
};

export const bulkCreateTransactions = async (req, res, next) => {
  try {
    const userId = req.user.id;
    logger.info("Bulk Create Request Body Length:", req.body.length);
    const transactionsData = z.array(transactionSchema).parse(req.body);
    logger.info("Parsed Transactions Data Length:", transactionsData.length);

    const [userAccounts, userBudgets, userCategories] = await Promise.all([
      prisma.account.findMany({
        where: { userId },
        select: { id: true, startDate: true },
      }),
      prisma.budget.findMany({ where: { userId }, select: { id: true } }),
      prisma.category.findMany({
        where: { OR: [{ userId }, { userId: null }] },
        select: { id: true },
      }),
    ]);

    const accountMap = new Map(userAccounts.map((a) => [a.id, a]));
    const budgetIds = new Set(userBudgets.map((b) => b.id));
    const categoryIds = new Set(userCategories.map((c) => c.id));

    const result = await prisma.$transaction(async (tx) => {
      const createdTransactions = [];
      const skippedTransactions = [];

      for (const tData of transactionsData) {
        const {
          description,
          amount,
          date,
          type,
          accountId,
          budgetId,
          categoryId,
          status,
          destinationAccountId,
          bankTransactionId,
          note,
        } = tData;

        if (accountId && !accountMap.has(accountId)) {
          throw new Error(
            `Unauthorized: Account ID ${accountId} does not belong to user`,
          );
        }
        if (
          accountId &&
          new Date(date) < new Date(accountMap.get(accountId).startDate)
        ) {
          throw new Error(
            `Transaction date for "${description}" cannot be earlier than account tracking date.`,
          );
        }

        if (destinationAccountId && !accountMap.has(destinationAccountId)) {
          throw new Error(
            `Unauthorized: Destination Account ID ${destinationAccountId} does not belong to user`,
          );
        }
        if (
          destinationAccountId &&
          new Date(date) <
            new Date(accountMap.get(destinationAccountId).startDate)
        ) {
          throw new Error(
            `Transaction date for "${description}" cannot be earlier than destination account tracking date.`,
          );
        }

        if (budgetId && !budgetIds.has(budgetId)) {
          throw new Error(
            `Unauthorized: Budget ID ${budgetId} does not belong to user`,
          );
        }
        if (categoryId && !categoryIds.has(categoryId)) {
          throw new Error(
            `Unauthorized: Category ID ${categoryId} does not belong to user`,
          );
        }

        if (bankTransactionId) {
          const existing = await tx.transaction.findUnique({
            where: { bankTransactionId },
          });
          if (existing) {
            logger.info(
              `Duplicate bankTransactionId ${bankTransactionId} found. Skipping...`,
            );
            skippedTransactions.push({ bankTransactionId, description });
            continue;
          }
        }

        const newTransaction = await tx.transaction.create({
          data: {
            description,
            amount,
            date,
            type,
            accountId,
            destinationAccountId,
            budgetId,
            categoryId,
            status,
            userId,
            bankTransactionId,
            note,
          },
          include: {
            budget: true,
            account: true,
            destinationAccount: true,
            category: true,
          },
        });

        await updateBalancesForTransaction(newTransaction, "create", null, tx);
        createdTransactions.push(newTransaction);
      }
      return { createdTransactions, skippedTransactions };
    });

    res.status(201).json({
      success: true,
      created: result.createdTransactions.length,
      skipped: result.skippedTransactions.length,
      transactions: result.createdTransactions,
      skippedDetails: result.skippedTransactions,
    });
  } catch (error) {
    next(error);
  }
};

export const updateTransaction = async (req, res, next) => {
  try {
    const { id } = req.params;
    const validatedData = transactionSchema.partial().parse(req.body);
    const { budgetId, accountId, categoryId, status, destinationAccountId } =
      validatedData;
    const userId = req.user.id;

    const oldTransaction = await prisma.transaction.findUnique({
      where: { id },
    });

    if (!oldTransaction || oldTransaction.userId !== userId) {
      return res.status(404).json({ error: "Transaction not found" });
    }

    const transactionDate = validatedData.date
      ? new Date(validatedData.date)
      : new Date(oldTransaction.date);

    if (accountId || (!accountId && oldTransaction.accountId)) {
      const targetAccountId = accountId || oldTransaction.accountId;
      const account = await prisma.account.findFirst({
        where: { id: targetAccountId, userId },
      });
      if (account && transactionDate < new Date(account.startDate)) {
        return res.status(400).json({
          error: `Transaction date cannot be earlier than account tracking date (${new Date(account.startDate).toLocaleDateString()})`,
        });
      }
    }

    if (
      destinationAccountId ||
      (!destinationAccountId && oldTransaction.destinationAccountId)
    ) {
      const targetDestId =
        destinationAccountId || oldTransaction.destinationAccountId;
      const destAccount = await prisma.account.findFirst({
        where: { id: targetDestId, userId },
      });
      if (destAccount && transactionDate < new Date(destAccount.startDate)) {
        return res.status(400).json({
          error: `Transaction date cannot be earlier than destination account tracking date (${new Date(destAccount.startDate).toLocaleDateString()})`,
        });
      }
    }

    if (budgetId) {
      const budget = await prisma.budget.findFirst({
        where: { id: budgetId, userId },
      });
      if (!budget) {
        return res
          .status(403)
          .json({ error: "Unauthorized: Budget does not belong to user" });
      }
    }

    if (categoryId) {
      const category = await prisma.category.findFirst({
        where: {
          id: categoryId,
          OR: [{ userId }, { userId: null }],
        },
      });
      if (!category) {
        return res
          .status(403)
          .json({ error: "Unauthorized: Category does not belong to user" });
      }
    }

    if (validatedData.bankTransactionId) {
      const existing = await prisma.transaction.findUnique({
        where: { bankTransactionId: validatedData.bankTransactionId },
      });
      if (existing && existing.id !== id) {
        return res.status(400).json({
          error:
            "Duplicate Transaction: A record with this Bank Transaction ID already exists.",
        });
      }
    }

    const data = { ...validatedData };

    if (budgetId && accountId && !status) {
      data.status = "settled";
    }

    const transaction = await prisma.$transaction(async (tx) => {
      const oldTransaction = await tx.transaction.findUnique({
        where: { id },
      });

      if (!oldTransaction || oldTransaction.userId !== userId) {
        throw new Error("Transaction not found");
      }

      const metadata = oldTransaction.metadata
        ? JSON.parse(oldTransaction.metadata)
        : {};
      if (metadata.isOpeningBalance) {
        const allowedFields = ["amount", "categoryId", "note"];
        const requestedFields = Object.keys(validatedData);
        const restrictedFields = requestedFields.filter(
          (f) => !allowedFields.includes(f),
        );

        if (restrictedFields.length > 0) {
          throw new Error(
            `Cannot modify ${restrictedFields.join(", ")} for opening balance transaction. Only amount, category, and note can be updated.`,
          );
        }
      }

      const updatedTransaction = await tx.transaction.update({
        where: { id, userId },
        data,
        include: {
          budget: true,
          account: true,
          destinationAccount: true,
          category: true,
        },
      });

      await updateBalancesForTransaction(
        updatedTransaction,
        "update",
        oldTransaction,
        tx,
      );

      return updatedTransaction;
    });

    res.json({ message: "Transaction updated successfully", transaction });
  } catch (error) {
    next(error);
  }
};

export const getUnlistedTransactions = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const transactions = await prisma.transaction.findMany({
      where: {
        userId,
        OR: [{ status: "unsettled" }, { budgetId: null }],
      },
      orderBy: { date: "desc" },
      include: {
        account: true,
        budget: true,
        category: true,
      },
    });
    res.json(transactions);
  } catch (error) {
    next(error);
  }
};

export const deleteTransaction = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    await prisma.$transaction(async (tx) => {
      const transaction = await tx.transaction.findUnique({
        where: { id },
      });

      if (!transaction || transaction.userId !== userId) {
        throw new Error("Transaction not found");
      }

      const metadata = transaction.metadata
        ? JSON.parse(transaction.metadata)
        : {};
      if (metadata.isOpeningBalance) {
        throw new Error(
          "Cannot delete opening balance transaction. This is a system-generated transaction required for account integrity.",
        );
      }

      await tx.transaction.delete({
        where: { id },
      });

      await updateBalancesForTransaction(
        transaction,
        "delete",
        transaction,
        tx,
      );
    });

    res.status(200).json({ message: "Transaction deleted successfully" });
  } catch (error) {
    next(error);
  }
};

export const uploadBillAndParse = async (req, res, next) => {
  try {
    const userId = req.user.id;

    if (!req.file) {
      return res.status(400).json({ error: "No bill file uploaded" });
    }

    const filePath = req.file.path;
    const fileName = req.file.filename;

    const { parseBillWithAI } = await import("../utils/billParser.js");

    const parseResult = await parseBillWithAI(filePath);

    if (!parseResult.success) {
      logger.warn("Bill parsing failed:", parseResult.error);
    }

    const { amount, description, date, merchant } = parseResult.data;

    const transaction = await prisma.transaction.create({
      data: {
        description: merchant ? `${description} - ${merchant}` : description,
        amount: parseResult.success ? amount : 0,
        date: new Date(date),
        type: "expense",
        status: "unsettled",
        userId,
        billAttachment: fileName,
        source: "Bill Upload",
        note: parseResult.success
          ? `AI Generated: Parsed bill from ${
              merchant || "unknown merchant"
            } for ${amount}.`
          : "AI Generated: Uploaded bill (parsing failed).",
        metadata: JSON.stringify({
          parseSuccess: parseResult.success,
          parseError: parseResult.error || null,
          merchant: merchant,
          originalFileName: req.file.originalname,
        }),
      },
      include: {
        budget: true,
        account: true,
        category: true,
      },
    });

    res.status(201).json({
      message: "Bill uploaded and parsed successfully",
      transaction,
      parseResult: {
        success: parseResult.success,
        parsedAmount: amount,
        parsedDescription: description,
        parsedDate: date,
        merchant: merchant,
      },
    });
  } catch (error) {
    logger.error("Error in uploadBillAndParse:", error);
    next(error);
  }
};

export const getPendingBills = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const now = new Date();

    const pendingBills = await prisma.transaction.findMany({
      where: {
        userId,
        status: "unsettled",
        source: "STATEMENT_PDF",
        OR: [{ reminderAt: null }, { reminderAt: { lte: now } }],
      },
      orderBy: { date: "desc" },
    });

    res.json(pendingBills);
  } catch (error) {
    next(error);
  }
};

export const snoozeBill = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { hours = 24 } = req.body;

    const reminderDate = new Date();
    reminderDate.setHours(reminderDate.getHours() + hours);

    const updated = await prisma.transaction.update({
      where: { id, userId },
      data: { reminderAt: reminderDate },
    });

    res.json({
      message: `Bill snoozed for ${hours} hours`,
      transaction: updated,
    });
  } catch (error) {
    next(error);
  }
};

export const getUnsettledCount = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const count = await prisma.transaction.count({
      where: {
        userId,
        status: "unsettled",
      },
    });
    res.json({ count });
  } catch (error) {
    next(error);
  }
};
