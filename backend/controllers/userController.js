import prisma from "../utils/prismaClient.js";
import { userSettingsSchema } from "../validators/userValidators.js";

export const getUserSettings = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        currency: true,
        name: true,
        email: true,
        theme: true,
        completedTours: true,
        notificationsEmail: true,
        alertEmail: true,
        notificationsNtfy: true,
        ntfyTopic: true,
        isOnboardingCompleted: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(user);
  } catch (error) {
    next(error);
  }
};

export const updateUserSettings = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const validatedData = userSettingsSchema.partial().parse(req.body);

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: validatedData,
      select: {
        currency: true,
        name: true,
        email: true,
        theme: true,
        completedTours: true,
        notificationsEmail: true,
        alertEmail: true,
        notificationsNtfy: true,
        ntfyTopic: true,
        isOnboardingCompleted: true,
      },
    });

    res.json({ success: true, user: updatedUser });
  } catch (error) {
    next(error);
  }
};

export const completeTour = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { tourKey } = req.params;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { completedTours: true },
    });

    if (!user.completedTours.includes(tourKey)) {
      await prisma.user.update({
        where: { id: userId },
        data: {
          completedTours: {
            push: tourKey,
          },
        },
      });
    }

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
};

export const resetTours = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { tourKey } = req.body;

    let user = null;
    if (tourKey) {
      user = await prisma.user.findUnique({
        where: { id: userId },
        select: { completedTours: true },
      });
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        completedTours: {
          set:
            tourKey && user
              ? user.completedTours.filter((k) => k !== tourKey)
              : [],
        },
      },
      select: {
        currency: true,
        name: true,
        email: true,
        theme: true,
        completedTours: true,
        notificationsEmail: true,
        alertEmail: true,
        notificationsNtfy: true,
        ntfyTopic: true,
      },
    });

    res.json({ success: true, user: updatedUser });
  } catch (error) {
    next(error);
  }
};
