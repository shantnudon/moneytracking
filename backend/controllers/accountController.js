import prisma from "../utils/prismaClient.js";
import { accountSchema } from "../validators/financeValidators.js";
import { recalculateAccountBalance } from "../utils/balanceUtils.js";

export const createAccount = async (req, res, next) => {
  try {
    const validatedData = accountSchema.parse(req.body);
    const {
      name,
      type,
      balance,
      startingBalance,
      startDate,
      trackHistoricData,
      currency,
      details,
      billingDay,
      dueDay,
      creditLimit,
      principal,
      interestRate,
      maturityDate,
      tenure,
    } = validatedData;
    const userId = req.user.id;

    const result = await prisma.$transaction(async (tx) => {
      const shouldCreateOpeningBalance =
        !trackHistoricData &&
        balance !== 0 &&
        !["Credit Card", "Investment", "Demat"].includes(type);
      const account = await tx.account.create({
        data: {
          name,
          type,
          balance,
          startingBalance: shouldCreateOpeningBalance
            ? 0
            : startingBalance !== undefined
              ? startingBalance
              : balance,
          startDate: startDate || new Date(new Date().setHours(0, 0, 0, 0)),
          trackHistoricData: trackHistoricData || false,
          currency,
          details: details ? JSON.stringify(details) : null,
          userId,
          billingDay,
          dueDay,
          creditLimit,
          principal,
          interestRate,
          maturityDate,
          tenure,
          history: {
            create: {
              balance: balance,
              source: "initial",
              date: startDate || new Date(),
            },
          },
        },
      });

      if (shouldCreateOpeningBalance) {
        const accountType = await tx.accountType.findFirst({
          where: {
            name: type,
            OR: [{ userId }, { userId: null }],
          },
        });

        const category =
          accountType?.category ||
          ([
            "savings",
            "checking",
            "demat",
            "asset",
            "Savings",
            "Checking",
            "Demat",
            "Asset",
          ].includes(type)
            ? "asset"
            : "liability");

        const transactionType = category === "asset" ? "income" : "expense";

        await tx.transaction.create({
          data: {
            description: "Opening Balance",
            amount: Math.abs(balance),
            date: startDate || new Date(new Date().setHours(0, 0, 0, 0)),
            type: transactionType,
            accountId: account.id,
            userId,
            status: "settled",
            source: "System",
            note: `System-generated opening balance transaction. This represents the account balance at the start of tracking of ${account.name}.`,
            metadata: JSON.stringify({
              isOpeningBalance: true,
              locked: true,
            }),
          },
        });
      }

      return account;
    });

    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
};

export const getAccounts = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const accounts = await prisma.account.findMany({
      where: { userId },
      orderBy: { name: "asc" },
    });
    res.json(accounts);
  } catch (error) {
    next(error);
  }
};

export const updateAccount = async (req, res, next) => {
  try {
    const { id } = req.params;
    const validatedData = accountSchema.partial().parse(req.body);
    const userId = req.user.id;

    const account = await prisma.account.updateMany({
      where: { id, userId },
      data: validatedData,
    });

    if (account.count === 0) {
      return res.status(404).json({ error: "Account not found" });
    }

    res.json({ message: "Account updated successfully" });
  } catch (error) {
    next(error);
  }
};

export const deleteAccount = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const account = await prisma.account.deleteMany({
      where: { id, userId },
    });

    if (account.count === 0) {
      return res.status(404).json({ error: "Account not found" });
    }

    res.json({ message: "Account deleted successfully" });
  } catch (error) {
    next(error);
  }
};

export const recalculateBalance = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { dryRun } = req.query;
    const userId = req.user.id;

    const result = await recalculateAccountBalance(
      id,
      userId,
      dryRun === "true",
    );

    res.json({
      message:
        dryRun === "true"
          ? "Recalculation check complete"
          : "Account balance recalculated successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const updateBalanceManually = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { balance, date, source } = req.body;
    const userId = req.user.id;

    const account = await prisma.account.findFirst({
      where: { id, userId },
    });

    if (!account) {
      return res.status(404).json({ error: "Account not found" });
    }

    await prisma.accountHistory.create({
      data: {
        accountId: id,
        balance: parseFloat(balance),
        date: date ? new Date(date) : new Date(),
        source: source || "manual",
      },
    });

    const updatedAccount = await prisma.account.update({
      where: { id },
      data: { balance: parseFloat(balance) },
    });

    res.json({
      message: "Balance updated manually",
      account: updatedAccount,
    });
  } catch (error) {
    next(error);
  }
};

export const getAccountWithInvestments = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const account = await prisma.account.findFirst({
      where: { id, userId },
      include: {
        investments: true,
        history: {
          orderBy: { date: "desc" },
          take: 10,
        },
      },
    });

    if (!account) {
      return res.status(404).json({ error: "Account not found" });
    }

    res.json(account);
  } catch (error) {
    next(error);
  }
};
