// prompt: "Create a seed script that creates a user, categories, accounts, transactions, budgets, and investments based on the following schema 
// ``....``` 
// The script should be idempotent and can be run multiple times without creating duplicate entries. It should also reset balances and transactions to ensure a fresh start each time. Additionally, it should create some sample transactions for the past 3 months to provide meaningful data for testing and development. The script should also include error handling and logging to track the seeding process."

import prisma from "../utils/prismaClient.js";
import bcrypt from "bcryptjs";
import { updateBalancesForTransaction } from "../utils/balanceUtils.js";

async function main() {
  const email = "aa@aa.com";
  const password = "qazx123";
  const hashedPassword = await bcrypt.hash(password, 10);

  console.log("Starting massive fresh seed...");

  await prisma.$transaction(async (tx) => {
    // 1. Create User
    let user = await tx.user.findUnique({
      where: { email },
    });

    if (!user) {
      user = await tx.user.create({
        data: {
          email,
          password: hashedPassword,
          name: "Admin User",
          role: "ADMIN",
          currency: "INR",
          isOnboardingCompleted: true,
        },
      });
      console.log(`Created user: ${user.email}`);
    } else {
      console.log(`User already exists: ${user.email}`);
    }

    // 2. Create Categories
    const categoriesData = [
      { name: "Salary", type: "income" },
      { name: "Gym Spends", type: "expense" },
      { name: "Protein", type: "expense" },
      { name: "Money Sent Home", type: "expense" },
      { name: "Food & Dining", type: "expense" },
      { name: "Utilities", type: "expense" },
      { name: "Investment", type: "expense" },
      { name: "Transfer", type: "transfer" },
      { name: "Shopping", type: "expense" },
      { name: "Transport", type: "expense" },
      { name: "Entertainment", type: "expense" },
    ];

    const categories = {};
    for (const cat of categoriesData) {
      let category = await tx.category.findFirst({
        where: { name: cat.name, userId: user.id },
      });
      if (!category) {
        category = await tx.category.create({
          data: { ...cat, userId: user.id },
        });
      }
      categories[cat.name] = category;
    }
    console.log("Categories seeded");

    // 3. Create Accounts
    const accountsData = [
      {
        name: "Savings Account",
        type: "savings",
        balance: 0,
        currency: "INR",
        maskNumber: "4455",
      },
      { name: "Cash-in-hand", type: "asset", balance: 0, currency: "INR" },
      { name: "Zerodha", type: "demat", balance: 0, currency: "INR" },
    ];

    const accounts = {};
    for (const acc of accountsData) {
      let account = await tx.account.findFirst({
        where: { name: acc.name, userId: user.id },
      });
      if (!account) {
        account = await tx.account.create({
          data: { ...acc, userId: user.id },
        });
      } else {
        account = await tx.account.update({
          where: { id: account.id },
          data: { balance: 0 },
        });
      }
      accounts[acc.name] = account;
    }
    console.log("Accounts seeded");

    // Clear existing transactions, history, and investments for this user to ensure fresh seed
    await tx.transaction.deleteMany({ where: { userId: user.id } });
    await tx.accountHistory.deleteMany({
      where: {
        accountId: { in: Object.values(accounts).map((a) => a.id) },
      },
    });
    await tx.investment.deleteMany({
      where: {
        accountId: { in: Object.values(accounts).map((a) => a.id) },
      },
    });
    console.log("Old transactions, history, and investments cleared");

    // 4. Create Investments
    const oldDate = new Date();
    oldDate.setDate(oldDate.getDate() - 5); // 5 days ago
    const investmentsData = [
      {
        accountId: accounts["Zerodha"].id,
        type: "stock",
        symbol: "RELIANCE.NS",
        name: "Reliance Industries",
        quantity: 10,
        buyPrice: 2300.5,
        buyDate: oldDate,
        currentPrice: 2700.0,
      },
      {
        accountId: accounts["Zerodha"].id,
        type: "stock",
        symbol: "TCS.NS",
        name: "Tata Consultancy Services",
        quantity: 5,
        buyPrice: 3200.0,
        buyDate: oldDate,
        currentPrice: 3800.0,
      },
    ];

    for (const inv of investmentsData) {
      const existingInv = await tx.investment.findFirst({
        where: { symbol: inv.symbol, accountId: inv.accountId },
      });
      if (!existingInv) {
        await tx.investment.create({ data: inv });

        // Create a transfer transaction for the purchase
        const transactionAmount = inv.quantity * inv.buyPrice;
        const invTx = await tx.transaction.create({
          data: {
            description: `Buy ${inv.quantity} ${inv.symbol} (${inv.name})`,
            amount: transactionAmount,
            date: inv.buyDate,
            type: "transfer",
            accountId: accounts["Savings Account"].id,
            destinationAccountId: inv.accountId,
            userId: user.id,
            status: "settled",
            source: "Investment",
          },
        });
        await updateBalancesForTransaction(invTx, "create", null, tx);

        // Adjust for market value if currentPrice > buyPrice
        const marketValue = inv.quantity * inv.currentPrice;
        const gain = marketValue - transactionAmount;
        if (gain !== 0) {
          await tx.account.update({
            where: { id: inv.accountId },
            data: { balance: { increment: gain } },
          });

          const updatedAcc = await tx.account.findUnique({
            where: { id: inv.accountId },
          });
          await tx.accountHistory.create({
            data: {
              accountId: inv.accountId,
              balance: updatedAcc.balance,
              source: "investment",
              date: new Date(),
            },
          });
        }
      }
    }
    console.log("Investments seeded with transactions");

    // 5. Create Budgets
    const budgetsData = [
      { name: "Fitness Budget", amount: 5000, categoryName: "Gym Spends" },
      { name: "Food Budget", amount: 15000, categoryName: "Food & Dining" },
    ];

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    for (const b of budgetsData) {
      const existingBudget = await tx.budget.findFirst({
        where: { name: b.name, userId: user.id },
      });
      if (!existingBudget) {
        await tx.budget.create({
          data: {
            name: b.name,
            amount: b.amount,
            startDate: startOfMonth,
            endDate: endOfMonth,
            userId: user.id,
            categoryId: categories[b.categoryName]?.id,
          },
        });
      }
    }
    console.log("Budgets seeded");

    // 6. Generate 100+ Transactions over 3 months
    console.log("Generating 120 transactions...");
    const descriptions = {
      "Food & Dining": [
        "Zomato Order",
        "Swiggy Dinner",
        "Starbucks Coffee",
        "Grocery Store",
        "Pizza Hut",
        "Local Dhaba",
        "Fruit Market",
      ],
      Shopping: [
        "Amazon Purchase",
        "Myntra Clothes",
        "Nike Shoes",
        "Electronics Store",
        "Supermarket",
        "Decathlon",
      ],
      Transport: [
        "Uber Ride",
        "Ola Cab",
        "Petrol Pump",
        "Metro Recharge",
        "Auto Fare",
      ],
      Entertainment: [
        "Netflix Subscription",
        "Movie Tickets",
        "Gaming Store",
        "Spotify Premium",
        "Bowling Alley",
      ],
      Utilities: [
        "Electricity Bill",
        "Water Bill",
        "Internet Recharge",
        "Mobile Postpaid",
        "Gas Cylinder",
      ],
      "Gym Spends": ["Gym Membership", "Personal Training", "Yoga Class"],
      Protein: ["Whey Protein", "Creatine", "Multivitamins", "BCAA"],
    };

    const expenseCategories = [
      "Food & Dining",
      "Shopping",
      "Transport",
      "Entertainment",
      "Utilities",
      "Gym Spends",
      "Protein",
    ];
    const accountNames = ["Savings Account", "Cash-in-hand"];

    for (let i = 0; i < 120; i++) {
      // Random date within last 90 days
      const date = new Date();
      date.setDate(date.getDate() - Math.floor(Math.random() * 90));

      const categoryName =
        expenseCategories[Math.floor(Math.random() * expenseCategories.length)];
      const descList = descriptions[categoryName];
      const description = descList[Math.floor(Math.random() * descList.length)];
      const amount = Math.floor(Math.random() * 2000) + 50;
      const accountName =
        accountNames[Math.floor(Math.random() * accountNames.length)];

      const newTx = await tx.transaction.create({
        data: {
          description,
          amount,
          type: "expense",
          date,
          userId: user.id,
          categoryId: categories[categoryName].id,
          accountId: accounts[accountName].id,
          status: "settled",
          bankTransactionId: `TXN-${Date.now()}-${i}`,
          note: `Randomly generated ${categoryName} expense.`,
        },
      });
      await updateBalancesForTransaction(newTx, "create", null, tx);
    }

    // Add some monthly salaries
    for (let m = 0; m < 3; m++) {
      const salaryDate = new Date();
      salaryDate.setMonth(salaryDate.getMonth() - m);
      salaryDate.setDate(1);

      const sTx = await tx.transaction.create({
        data: {
          description: "Monthly Salary Credit",
          amount: 120000,
          type: "income",
          date: salaryDate,
          userId: user.id,
          categoryId: categories["Salary"].id,
          accountId: accounts["Savings Account"].id,
          status: "settled",
          bankTransactionId: `SAL-${salaryDate.getTime()}`,
          note: "Monthly salary credit.",
        },
      });
      await updateBalancesForTransaction(sTx, "create", null, tx);

      // Add a transfer each month
      const transferDate = new Date(salaryDate);
      transferDate.setDate(5);
      const tTx = await tx.transaction.create({
        data: {
          description: "ATM Withdrawal",
          amount: 10000,
          type: "transfer",
          date: transferDate,
          userId: user.id,
          categoryId: categories["Transfer"].id,
          accountId: accounts["Savings Account"].id,
          destinationAccountId: accounts["Cash-in-hand"].id,
          status: "settled",
          bankTransactionId: `ATM-${transferDate.getTime()}`,
          note: "Cash withdrawal for monthly expenses.",
        },
      });
      await updateBalancesForTransaction(tTx, "create", null, tx);

      // Add money sent home each month
      const homeDate = new Date(salaryDate);
      homeDate.setDate(10);
      const hTx = await tx.transaction.create({
        data: {
          description: "Money Sent Home",
          amount: 30000,
          type: "expense",
          date: homeDate,
          userId: user.id,
          categoryId: categories["Money Sent Home"].id,
          accountId: accounts["Savings Account"].id,
          status: "settled",
          bankTransactionId: `HOME-${homeDate.getTime()}`,
          note: "Monthly support to parents.",
        },
      });
      await updateBalancesForTransaction(hTx, "create", null, tx);
    }

    console.log("Massive transactions seeded");

    // 7. Currencies & Investment Types
    const currenciesData = [
      { code: "INR", label: "₹ RUPEE", symbol: "₹" },
      { code: "USD", label: "$ DOLLAR", symbol: "$" },
    ];

    for (const curr of currenciesData) {
      await tx.currency.upsert({
        where: { code: curr.code },
        update: curr,
        create: curr,
      });
    }

    const investmentTypesData = [{ name: "Stocks" }, { name: "Mutual Funds" }];

    for (const type of investmentTypesData) {
      await tx.investmentType.upsert({
        where: { name: type.name },
        update: type,
        create: type,
      });
    }

    const accountTypesData = [
      { name: "Savings", category: "asset" },
      { name: "Checking", category: "asset" },
      { name: "Credit Card", category: "liability" },
      { name: "Cash", category: "asset" },
      { name: "Demat", category: "asset" },
      { name: "Investment", category: "asset" },
      { name: "Loan", category: "liability" },
      { name: "Wallet", category: "asset" },
    ];

    for (const type of accountTypesData) {
      await tx.accountType.upsert({
        where: {
          name_userId: {
            name: type.name,
            userId: null,
          },
        },
        update: { category: type.category },
        create: { ...type, userId: null },
      });
    }
    console.log("Currencies, Investment Types, and Account Types seeded");
  });

  console.log("Massive seed completed successfully!");
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
