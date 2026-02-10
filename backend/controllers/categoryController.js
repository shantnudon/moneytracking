import prisma from "../utils/prismaClient.js";
import { z } from "zod";

// TODO : need to move the Zod schema from here to validators.. this was just done to quickly check the zod implementation in the controller.

const categorySchema = z.object({
  name: z.string().min(1, "Name is required"),
  type: z.enum(["income", "expense"]).default("expense"),
});

export const getCategories = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const categories = await prisma.category.findMany({
      where: {
        OR: [{ userId: userId }, { userId: null }],
      },
      orderBy: { name: "asc" },
    });
    res.json(categories);
  } catch (error) {
    next(error);
  }
};

export const createCategory = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const validatedData = categorySchema.parse(req.body);

    const category = await prisma.category.create({
      data: {
        ...validatedData,
        userId,
      },
    });
    res.status(201).json(category);
  } catch (error) {
    next(error);
  }
};

export const updateCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const validatedData = categorySchema.partial().parse(req.body);

    const existing = await prisma.category.findUnique({
      where: { id },
    });

    if (!existing) {
      return res
        .status(404)
        .json({ success: false, error: "Category not found" });
    }

    if (existing.userId === null) {
      return res
        .status(403)
        .json({
          success: false,
          error: "System categories cannot be modified",
        });
    }

    if (existing.userId !== userId) {
      return res.status(403).json({ success: false, error: "Unauthorized" });
    }

    const category = await prisma.category.update({
      where: { id },
      data: validatedData,
    });

    res.json({ message: "Category updated successfully", category });
  } catch (error) {
    next(error);
  }
};

export const deleteCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const existing = await prisma.category.findUnique({
      where: { id },
    });

    if (!existing) {
      return res
        .status(404)
        .json({ success: false, error: "Category not found" });
    }

    if (existing.userId === null) {
      return res
        .status(403)
        .json({ success: false, error: "System categories cannot be deleted" });
    }

    if (existing.userId !== userId) {
      return res.status(403).json({ success: false, error: "Unauthorized" });
    }

    await prisma.category.delete({
      where: { id },
    });

    res.json({ message: "Category deleted successfully" });
  } catch (error) {
    next(error);
  }
};
