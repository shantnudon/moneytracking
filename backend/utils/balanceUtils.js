import prisma from "./prismaClient.js";

export const calculateBalanceChange = (transaction) => {
  const { type, amount } = transaction;

  let sourceChange = 0;
  let destinationChange = 0;

  switch (type) {
    case "income":
      sourceChange = amount;
      break;
    case "expense":
      sourceChange = -amount;
      break;
    case "transfer":
      sourceChange = -amount;
      destinationChange = amount;
      break;
    default:
      throw new Error(`Unknown transaction type: ${type}`);
  }

  return { sourceChange, destinationChange };
};

export const updateAccountBalance = async (
  accountId,
  amount,
  prismaClient = prisma,
  date = new Date(),
) => {
  if (!accountId) return;

  const account = await prismaClient.account.findUnique({
    where: { id: accountId },
  });

  if (!account) return;

  const isInvestmentAccount = ["investment", "demat"].includes(
    account.type.toLowerCase(),
  );

  if (
    !isInvestmentAccount &&
    account.startDate &&
    new Date(date) < new Date(account.startDate)
  ) {
    return;
  }

  const updatedAccount = await prismaClient.account.update({
    where: { id: accountId },
    data: {
      balance: {
        increment: amount,
      },
    },
  });

  await prismaClient.accountHistory.create({
    data: {
      accountId: accountId,
      balance: updatedAccount.balance,
      date: date,
      source: "transaction",
    },
  });
};

export const updateBalancesForTransaction = async (
  transaction,
  operation,
  oldTransaction = null,
  prismaClient = prisma,
) => {
  if (operation === "delete" || operation === "update") {
    if (!oldTransaction) {
      throw new Error(
        "oldTransaction is required for delete/update operations",
      );
    }

    const { sourceChange, destinationChange } =
      calculateBalanceChange(oldTransaction);

    if (oldTransaction.accountId) {
      await updateAccountBalance(
        oldTransaction.accountId,
        -sourceChange,
        prismaClient,
        oldTransaction.date,
      );
    }
    if (oldTransaction.destinationAccountId) {
      await updateAccountBalance(
        oldTransaction.destinationAccountId,
        -destinationChange,
        prismaClient,
        oldTransaction.date,
      );
    }
  }

  if (operation === "create" || operation === "update") {
    const { sourceChange, destinationChange } =
      calculateBalanceChange(transaction);

    if (transaction.accountId) {
      await updateAccountBalance(
        transaction.accountId,
        sourceChange,
        prismaClient,
        transaction.date,
      );
    }
    if (transaction.destinationAccountId) {
      await updateAccountBalance(
        transaction.destinationAccountId,
        destinationChange,
        prismaClient,
        transaction.date,
      );
    }
  }
};

export const recalculateAccountBalance = async (
  accountId,
  userId,
  dryRun = false,
  prismaClient = prisma,
) => {
  const account = await prismaClient.account.findFirst({
    where: { id: accountId, userId },
  });

  if (!account) {
    throw new Error("Account not found");
  }

  const transactionFilters = {
    userId,
  };

  if (!account.trackHistoricData && account.startDate) {
    transactionFilters.date = { gte: account.startDate };
  }

  const sourceTransactions = await prismaClient.transaction.findMany({
    where: {
      accountId,
      ...transactionFilters,
    },
  });

  const destinationTransactions = await prismaClient.transaction.findMany({
    where: {
      destinationAccountId: accountId,
      ...transactionFilters,
    },
  });

  let transactionsChange = 0;

  for (const transaction of sourceTransactions) {
    const { sourceChange } = calculateBalanceChange(transaction);
    transactionsChange += sourceChange;
  }

  for (const transaction of destinationTransactions) {
    const { destinationChange } = calculateBalanceChange(transaction);
    transactionsChange += destinationChange;
  }

  let initialBalance = account.startingBalance || 0;
  const openingBalanceTx = sourceTransactions.find((t) => {
    if (t.description === "Opening Balance") return true;
    try {
      const meta = JSON.parse(t.metadata || "{}");
      return meta.isOpeningBalance === true;
    } catch {
      return false;
    }
  });

  let isDoubleCounted = false;
  if (
    openingBalanceTx &&
    Math.abs(initialBalance - openingBalanceTx.amount) < 0.01
  ) {
    initialBalance = 0;
    isDoubleCounted = true;
  }

  let totalChange = initialBalance + transactionsChange;

  if (account.type === "demat") {
    const investments = await prismaClient.investment.findMany({
      where: { accountId },
    });
    const investmentValue = investments.reduce(
      (sum, inv) => sum + inv.quantity * inv.currentPrice,
      0,
    );
    totalChange = investmentValue;
  }

  if (dryRun) {
    return {
      currentBalance: account.balance,
      calculatedBalance: totalChange,
      startingBalance: isDoubleCounted ? 0 : account.startingBalance || 0,
      transactionsChange: transactionsChange,
      deviation: totalChange - account.balance,
      wasDoubleCounted: isDoubleCounted,
    };
  }

  const updatedAccount = await prismaClient.account.update({
    where: { id: accountId },
    data: {
      balance: totalChange,
      startingBalance: isDoubleCounted ? 0 : account.startingBalance,
    },
  });

  await prismaClient.accountHistory.create({
    data: {
      accountId: accountId,
      balance: totalChange,
      date: new Date(),
      source: "recalculation",
    },
  });

  return updatedAccount;
};
