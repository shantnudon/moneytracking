import prisma from "../utils/prismaClient.js";
import logger from "../utils/logger.js";

export const processDueSubscriptions = async () => {
  logger.info("Worker: Checking for due subscriptions...");

  try {
    const now = new Date();

    const dueSubscriptions = await prisma.subscription.findMany({
      where: {
        nextPaymentDate: {
          lte: now,
        },
      },
      include: {
        user: true,
      },
    });

    if (dueSubscriptions.length === 0) {
      logger.info("No subscriptions due for processing.");
      return;
    }

    for (const sub of dueSubscriptions) {
      await prisma.$transaction(async (tx) => {
        await tx.transaction.create({
          data: {
            description: `Subscription: ${sub.name}`,
            amount: sub.amount,
            date: sub.nextPaymentDate,
            type: sub.type,
            status: "unsettled",
            userId: sub.userId,
            source: "Subscription Auto-Debit",
            note: `Automatically generated from subscription "${sub.name}"`,
          },
        });

        const nextDate = new Date(sub.nextPaymentDate);
        switch (sub.frequency.toLowerCase()) {
          case "daily":
            nextDate.setDate(nextDate.getDate() + 1);
            break;
          case "weekly":
            nextDate.setDate(nextDate.getDate() + 7);
            break;
          case "monthly":
            nextDate.setMonth(nextDate.getMonth() + 1);
            break;
          case "quarterly":
            nextDate.setMonth(nextDate.getMonth() + 3);
            break;
          case "half-yearly":
            nextDate.setMonth(nextDate.getMonth() + 6);
            break;
          case "yearly":
            nextDate.setFullYear(nextDate.getFullYear() + 1);
            break;
          default:
            nextDate.setMonth(nextDate.getMonth() + 1);
        }

        await tx.subscription.update({
          where: { id: sub.id },
          data: {
            nextPaymentDate: nextDate,
          },
        });

        await tx.notification.create({
          data: {
            userId: sub.userId,
            title: "Subscription Due",
            message: `A new unsettled transaction of ${sub.amount} has been added for ${sub.name}.`,
            type: "INFO",
          },
        });
      });

      logger.info(
        `Processed subscription "${sub.name}" for User ID: ${sub.userId}`,
      );
    }
  } catch (error) {
    logger.error(`Subscription Worker Error: ${error.message}`);
  }
};
