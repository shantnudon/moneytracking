import prisma from "../utils/prismaClient.js";

export const getAccountTypes = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const types = await prisma.accountType.findMany({
      where: {
        OR: [{ userId: userId }, { userId: null }],
      },
      orderBy: { name: "asc" },
    });
    res.json({ success: true, data: types });
  } catch (error) {
    next(error);
  }
};

export const createAccountType = async (req, res, next) => {
  try {
    const { name, category } = req.body;
    const userId = req.user.id;

    const type = await prisma.accountType.create({
      data: {
        name,
        category: category || "asset",
        userId,
      },
    });
    res.status(201).json({ success: true, data: type });
  } catch (error) {
    next(error);
  }
};

export const updateAccountType = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, category } = req.body;
    const userId = req.user.id;

    const existing = await prisma.accountType.findUnique({
      where: { id },
    });

    if (!existing) {
      return res
        .status(404)
        .json({ success: false, error: "Account type not found" });
    }

    if (existing.userId === null) {
      return res.status(403).json({
        success: false,
        error: "System account types cannot be modified",
      });
    }

    if (existing.userId !== userId) {
      return res.status(403).json({ success: false, error: "Unauthorized" });
    }

    const type = await prisma.accountType.update({
      where: { id },
      data: { name, category },
    });
    res.json({ success: true, data: type });
  } catch (error) {
    next(error);
  }
};

export const deleteAccountType = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const existing = await prisma.accountType.findUnique({
      where: { id },
    });

    if (!existing) {
      return res
        .status(404)
        .json({ success: false, error: "Account type not found" });
    }

    if (existing.userId === null) {
      return res.status(403).json({
        success: false,
        error: "System account types cannot be deleted",
      });
    }

    if (existing.userId !== userId) {
      return res.status(403).json({ success: false, error: "Unauthorized" });
    }

    await prisma.accountType.delete({
      where: { id },
    });
    res.json({ success: true, message: "Account type deleted" });
  } catch (error) {
    next(error);
  }
};
