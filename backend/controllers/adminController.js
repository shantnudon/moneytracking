import prisma from "../utils/prismaClient.js";

export const getCurrencies = async (req, res) => {
  try {
    const currencies = await prisma.currency.findMany();
    res.json({ success: true, data: currencies });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createCurrency = async (req, res) => {
  try {
    const { code, label, symbol } = req.body;
    const currency = await prisma.currency.create({
      data: { code, label, symbol },
    });
    res.json({ success: true, data: currency });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateCurrency = async (req, res) => {
  try {
    const { id } = req.params;
    const { code, label, symbol } = req.body;
    const currency = await prisma.currency.update({
      where: { id },
      data: { code, label, symbol },
    });
    res.json({ success: true, data: currency });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteCurrency = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.currency.delete({
      where: { id },
    });
    res.json({ success: true, message: "Currency deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getInvestmentTypes = async (req, res) => {
  try {
    const types = await prisma.investmentType.findMany();
    res.json({ success: true, data: types });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createInvestmentType = async (req, res) => {
  try {
    const { name } = req.body;
    const type = await prisma.investmentType.create({
      data: { name },
    });
    res.json({ success: true, data: type });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateInvestmentType = async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    const type = await prisma.investmentType.update({
      where: { id },
      data: { name },
    });
    res.json({ success: true, data: type });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteInvestmentType = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.investmentType.delete({
      where: { id },
    });
    res.json({ success: true, message: "Investment type deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getAccountTypes = async (req, res) => {
  try {
    const types = await prisma.accountType.findMany({
      orderBy: { name: "asc" },
    });
    res.json({ success: true, data: types });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createAccountType = async (req, res) => {
  try {
    const { name } = req.body;
    const type = await prisma.accountType.create({
      data: { name },
    });
    res.json({ success: true, data: type });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateAccountType = async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    const type = await prisma.accountType.update({
      where: { id },
      data: { name },
    });
    res.json({ success: true, data: type });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteAccountType = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.accountType.delete({
      where: { id },
    });
    res.json({ success: true, message: "Account type deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
