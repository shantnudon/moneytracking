import prisma from "../utils/prismaClient.js";

async function main() {
  console.log("Starting system data seed...");

  await prisma.$transaction(async (tx) => {
    // 1. Currencies
    const currenciesData = [
      { code: "INR", label: "₹ RUPEE", symbol: "₹" },
      // { code: "USD", label: "$ DOLLAR", symbol: "$" },
      // { code: "EUR", label: "€ EURO", symbol: "€" },
      // { code: "GBP", label: "£ POUND", symbol: "£" },
    ];

    for (const curr of currenciesData) {
      await tx.currency.upsert({
        where: { code: curr.code },
        update: curr,
        create: curr,
      });
    }
    console.log("Currencies seeded");

    // 2. Investment Types
    const investmentTypesData = [
      { name: "Stocks" },
      { name: "Mutual Funds" },
      { name: "Crypto" },
      { name: "Fixed Deposit" },
    ];

    for (const type of investmentTypesData) {
      await tx.investmentType.upsert({
        where: { name: type.name },
        update: type,
        create: type,
      });
    }
    console.log("Investment Types seeded");

    // 3. Account Types (Global)
    const accountTypesData = [
      { name: "Savings", category: "asset" },
      { name: "Checking", category: "asset" },
      { name: "Credit Card", category: "liability" },
      { name: "Investment", category: "asset" },
      { name: "Cash", category: "asset" },
      { name: "Demat", category: "asset" },
      { name: "Loan", category: "liability" },
      { name: "Salary", category: "asset" },
      { name: "Fixed Deposit", category: "asset" },
    ];

    for (const type of accountTypesData) {
      const existing = await tx.accountType.findFirst({
        where: { name: type.name, userId: null },
      });
      if (existing) {
        await tx.accountType.update({
          where: { id: existing.id },
          data: { category: type.category },
        });
      } else {
        await tx.accountType.create({
          data: { ...type, userId: null },
        });
      }
    }
    console.log("Account Types seeded");

    // 4. Categories (Global)
    const categoriesData = [
      { name: "Food & Dining", type: "expense" },
      { name: "Shopping", type: "expense" },
      { name: "Transport", type: "expense" },
      { name: "Entertainment", type: "expense" },
      { name: "Utilities", type: "expense" },
      { name: "Investment", type: "expense" },
      { name: "Transfer", type: "transfer" },
      { name: "Health", type: "expense" },
      { name: "Rent", type: "expense" },
      { name: "Gift", type: "income" },
      { name: "Other", type: "expense" },
    ];

    for (const cat of categoriesData) {
      const existing = await tx.category.findFirst({
        where: { name: cat.name, userId: null },
      });
      if (existing) {
        await tx.category.update({
          where: { id: existing.id },
          data: { type: cat.type },
        });
      } else {
        await tx.category.create({
          data: { ...cat, userId: null },
        });
      }
    }
    console.log("Categories seeded");
  });

  console.log("System data seed completed successfully!");
}

main()
  .catch((e) => {
    console.error("System seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
