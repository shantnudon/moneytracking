import prisma from "../utils/prismaClient.js";
import { subscriptionSchema } from "../validators/financeValidators.js";

export const getSubscriptions = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const subscriptions = await prisma.subscription.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
    res.json(subscriptions);
  } catch (error) {
    next(error);
  }
};

export const createSubscription = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const validatedData = subscriptionSchema.parse(req.body);

    const subscription = await prisma.subscription.create({
      data: {
        ...validatedData,
        userId,
      },
    });
    res.status(201).json(subscription);
  } catch (error) {
    next(error);
  }
};

export const updateSubscription = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const validatedData = subscriptionSchema.partial().parse(req.body);

    const subscription = await prisma.subscription.updateMany({
      where: { id, userId },
      data: validatedData,
    });

    if (subscription.count === 0) {
      return res.status(404).json({ error: "Subscription not found" });
    }

    res.json({ message: "Subscription updated successfully" });
  } catch (error) {
    next(error);
  }
};

export const deleteSubscription = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const subscription = await prisma.subscription.deleteMany({
      where: { id, userId },
    });

    if (subscription.count === 0) {
      return res.status(404).json({ error: "Subscription not found" });
    }

    res.json({ message: "Subscription deleted successfully" });
  } catch (error) {
    next(error);
  }
};
