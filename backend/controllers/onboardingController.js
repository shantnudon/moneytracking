import prisma from "../utils/prismaClient.js";
import logger from "../utils/logger.js";
import { onboardingSchema } from "../validators/userValidators.js";

export const completeOnboarding = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const validatedData = onboardingSchema.parse(req.body);
    const {
      username,
      currency,
      theme,
      bankAccounts,
      creditCards,
      loans,
      investments,
      otherExpenses,
      otherIncomeSources,
    } = validatedData;

    const safeNum = (val) => {
      const parsed = parseFloat(val);
      return isNaN(parsed) ? 0 : parsed;
    };

    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: userId },
        data: {
          name: username,
          currency: currency || "INR",
          theme: theme || "light",
          isOnboardingCompleted: true,
        },
      });

      for (const acc of bankAccounts) {
        await tx.account.create({
          data: {
            name: acc.name,
            type: acc.accountType?.toLowerCase() || "savings",
            balance: safeNum(acc.balance),
            currency: acc.currency || currency || "INR",
            maskNumber: acc.accountNumber || null,
            user: { connect: { id: userId } },
          },
        });
      }

      for (const card of creditCards) {
        const cardBalance = safeNum(card.balance);
        await tx.card.create({
          data: {
            issuer: card.bankName || "Unknown",
            last4: card.accountNumber || "0000",
            dueAmount: cardBalance,
            dueDate: card.billDueDate ? new Date(card.billDueDate) : new Date(),
            user: { connect: { id: userId } },
          },
        });

        await tx.account.create({
          data: {
            name: `${card.bankName} ${card.name || "Card"}`,
            type: "expense",
            balance: -cardBalance,
            currency: currency || "INR",
            user: { connect: { id: userId } },
          },
        });
      }

      for (const loan of loans) {
        const principal = safeNum(loan.principalAmount);
        await tx.account.create({
          data: {
            name: loan.name,
            type: "loan",
            balance: -principal,
            currency: currency || "INR",
            details: JSON.stringify({
              emiAmount: safeNum(loan.emiAmount),
            }),
            user: { connect: { id: userId } },
          },
        });
      }

      for (const inv of investments) {
        await tx.account.create({
          data: {
            name: inv.name,
            type: inv.investmentType === "Stocks" ? "demat" : "asset",
            balance: safeNum(inv.balance),
            currency: currency || "INR",
            details: JSON.stringify(inv),
            user: { connect: { id: userId } },
          },
        });
      }

      const allSubscriptions = [
        ...otherExpenses.map((e) => ({ ...e, type: "expense" })),
        ...otherIncomeSources.map((inc) => ({ ...inc, type: "income" })),
      ];

      for (const sub of allSubscriptions) {
        await tx.subscription.create({
          data: {
            name: sub.name,
            amount: safeNum(sub.amount),
            type: sub.type,
            frequency: sub.frequency?.toLowerCase() || "monthly",
            startDate: new Date(),
            nextPaymentDate: new Date(),
            user: { connect: { id: userId } },
          },
        });
      }
    });

    res.json({ success: true, message: "Onboarding completed successfully" });
  } catch (error) {
    next(error);
  }
};
