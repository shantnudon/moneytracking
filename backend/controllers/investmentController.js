import prisma from "../utils/prismaClient.js";
import {
  investmentSchema,
  updateInvestmentSchema,
} from "../validators/investmentValidators.js";
import {
  getStockPrice,
  getMultiplePrices,
  searchSymbols,
} from "../services/yahooFinanceService.js";
import logger from "../utils/logger.js";

// there are soo many moving parts in this functions.. need have this in the docs for sure. also need to think about how to handle the case where price fetching fails - i think so if the fetch fails we can just take the entry for the user to input the price and have a setting where the user can choose to search automatically via the cron we have or they wanna input the price by themselves.

export const createInvestment = async (req, res, next) => {
  try {
    const validatedData = investmentSchema.parse(req.body);
    const userId = req.user.id;
    const { sourceAccountId, ...investmentData } = validatedData;

    const account = await prisma.account.findFirst({
      where: {
        id: validatedData.accountId,
        userId,
        type: {
          equals: "demat",
          mode: "insensitive",
        },
      },
    });

    if (!account) {
      return res.status(404).json({ error: "Demat account not found" });
    }

    let currentPrice = 0;
    try {
      const priceData = await getStockPrice(validatedData.symbol);
      currentPrice = priceData.price;
    } catch (error) {
      logger.warn(
        `Could not fetch initial price for ${validatedData.symbol}:`,
        error.message,
      );
      currentPrice = validatedData.buyPrice;
    }

    const result = await prisma.$transaction(async (tx) => {
      const investment = await tx.investment.create({
        data: {
          ...investmentData,
          currentPrice,
          lastPriceUpdate: new Date(),
        },
      });

      if (sourceAccountId) {
        const transactionAmount =
          validatedData.quantity * validatedData.buyPrice;

        const newTransaction = await tx.transaction.create({
          data: {
            description: `Buy ${validatedData.quantity} ${validatedData.symbol} (${validatedData.name})`,
            amount: transactionAmount,
            date: new Date(validatedData.buyDate),
            type: "transfer",
            accountId: sourceAccountId,
            destinationAccountId: validatedData.accountId,
            userId,
            status: "settled",
            source: "Investment",
          },
        });

        const { updateBalancesForTransaction } =
          await import("../utils/balanceUtils.js");
        await updateBalancesForTransaction(newTransaction, "create", null, tx);

        const marketValue = validatedData.quantity * currentPrice;
        const balanceAdjustment = marketValue - transactionAmount;

        if (balanceAdjustment !== 0) {
          await tx.account.update({
            where: { id: validatedData.accountId },
            data: { balance: { increment: balanceAdjustment } },
          });

          const updatedAccount = await tx.account.findUnique({
            where: { id: validatedData.accountId },
          });

          await tx.accountHistory.create({
            data: {
              accountId: validatedData.accountId,
              balance: updatedAccount.balance,
              source: "investment",
              date: new Date(),
            },
          });
        }
      } else {
        const transactionAmount =
          validatedData.quantity * validatedData.buyPrice;

        const newTransaction = await tx.transaction.create({
          data: {
            description: `Portfolio Addition: ${validatedData.symbol} (${validatedData.name})`,
            amount: transactionAmount,
            date: new Date(validatedData.buyDate),
            type: "income",
            accountId: validatedData.accountId,
            userId,
            status: "settled",
            source: "Investment",
          },
        });

        const { updateBalancesForTransaction } =
          await import("../utils/balanceUtils.js");
        await updateBalancesForTransaction(newTransaction, "create", null, tx);

        const marketValue = validatedData.quantity * currentPrice;
        const balanceAdjustment = marketValue - transactionAmount;

        if (balanceAdjustment !== 0) {
          await tx.account.update({
            where: { id: validatedData.accountId },
            data: { balance: { increment: balanceAdjustment } },
          });

          const updatedAccount = await tx.account.findUnique({
            where: { id: validatedData.accountId },
          });

          await tx.accountHistory.create({
            data: {
              accountId: validatedData.accountId,
              balance: updatedAccount.balance,
              source: "investment",
              date: new Date(),
            },
          });
        }
      }

      return investment;
    });

    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
};

export const getInvestmentsByAccount = async (req, res, next) => {
  try {
    const { accountId } = req.params;
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

    const investments = await prisma.investment.findMany({
      where: { accountId: accountId },
      orderBy: { createdAt: "desc" },
    });

    const totalInvested = investments.reduce(
      (sum, inv) => sum + inv.quantity * inv.buyPrice,
      0,
    );
    const currentValue = investments.reduce(
      (sum, inv) => sum + inv.quantity * inv.currentPrice,
      0,
    );
    const totalGainLoss = currentValue - totalInvested;
    const totalGainLossPercent =
      totalInvested > 0 ? (totalGainLoss / totalInvested) * 100 : 0;

    res.json({
      investments,
      summary: {
        totalInvested,
        currentValue,
        totalGainLoss,
        totalGainLossPercent: totalGainLossPercent.toFixed(2),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const updateInvestment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const validatedData = updateInvestmentSchema.parse(req.body);
    const userId = req.user.id;

    const investment = await prisma.investment.findFirst({
      where: { id },
      include: { account: true },
    });

    if (!investment || investment.account.userId !== userId) {
      return res.status(404).json({ error: "Investment not found" });
    }

    const updated = await prisma.investment.update({
      where: { id },
      data: validatedData,
    });

    res.json(updated);
  } catch (error) {
    next(error);
  }
};

export const deleteInvestment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const investment = await prisma.investment.findFirst({
      where: { id },
      include: { account: true },
    });

    if (!investment || investment.account.userId !== userId) {
      return res.status(404).json({ error: "Investment not found" });
    }

    const investmentValue = investment.quantity * investment.currentPrice;
    await prisma.account.update({
      where: { id: investment.accountId },
      data: { balance: { decrement: investmentValue } },
    });

    await prisma.investment.delete({
      where: { id },
    });

    const updatedAccount = await prisma.account.findUnique({
      where: { id: investment.accountId },
    });

    await prisma.accountHistory.create({
      data: {
        accountId: investment.accountId,
        balance: updatedAccount.balance,
        source: "investment",
      },
    });

    res.json({ message: "Investment deleted successfully" });
  } catch (error) {
    next(error);
  }
};

export const refreshPrices = async (req, res, next) => {
  try {
    const { accountId } = req.params;
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

    const investments = await prisma.investment.findMany({
      where: { accountId: accountId },
    });

    if (investments.length === 0) {
      return res.json({ message: "No investments to refresh", updated: 0 });
    }

    const symbols = investments.map((inv) => inv.symbol);
    const prices = await getMultiplePrices(symbols);

    let updated = 0;
    let oldTotalValue = 0;
    let newTotalValue = 0;

    for (const investment of investments) {
      const priceData = prices[investment.symbol];

      if (priceData && priceData.success) {
        oldTotalValue += investment.quantity * investment.currentPrice;
        newTotalValue += investment.quantity * priceData.price;

        await prisma.investment.update({
          where: { id: investment.id },
          data: {
            currentPrice: priceData.price,
            lastPriceUpdate: new Date(),
          },
        });
        updated++;
      }
    }

    const balanceDiff = newTotalValue - oldTotalValue;
    const updatedAccount = await prisma.account.update({
      where: { id: accountId },
      data: { balance: { increment: balanceDiff } },
    });

    await prisma.accountHistory.create({
      data: {
        accountId: accountId,
        balance: updatedAccount.balance,
        source: "investment",
      },
    });

    res.json({
      message: "Prices refreshed successfully",
      updated,
      total: investments.length,
      balanceChange: balanceDiff,
    });
  } catch (error) {
    next(error);
  }
};

export const searchInvestments = async (req, res, next) => {
  try {
    const { query } = req.query;
    if (!query) {
      return res.status(400).json({ error: "Query parameter is required" });
    }
    const results = await searchSymbols(query);
    res.json(results);
  } catch (error) {
    next(error);
  }
};

export const getInvestmentQuote = async (req, res, next) => {
  try {
    const { symbol } = req.query;
    if (!symbol) {
      return res.status(400).json({ error: "Symbol parameter is required" });
    }
    const quote = await getStockPrice(symbol);
    res.json(quote);
  } catch (error) {
    next(error);
  }
};
