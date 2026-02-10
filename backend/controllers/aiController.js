import { GoogleGenerativeAI } from "@google/generative-ai";
import prisma from "../utils/prismaClient.js";
import logger from "../utils/logger.js";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// TODO : Instead of using only Google AI we should be able to use multiple AI providers like OpenAI and Anthropic as well, we can create a wrapper class for this and then use that wrapper class in the controller, this will also help us to easily switch between different AI providers in the future if needed. But do i need to have multiple packages to manage that? or is there a particular package that can handle multiple AI providers?

// in the homelabindia discord there were some good suggesions about this, we can use a local model but the problem will be the conext window that the AI will have.. can we just use a dumb 3B model and do the rest? 

// we should have something like the user can choose the model they wanna use from the frontend and the backend have to adjust accordingly.. one more thing to be looked upon is the cost of runnning models using API and the system capabilities of running local model, immich is doing a machine learning model maybe the docker compose should have thing like limit CPU and RAM for the AI model if we wanna combine a model in there..


export const processChatMessage = async (req, res, next) => {
  try {
    const { message } = req.body;
    const userId = req.user.id;

    if (!message) {
      return res
        .status(400)
        .json({ success: false, message: "Message is required" });
    }

    const [categories, accounts, budgets, transactions] = await Promise.all([
      prisma.category.findMany({ where: { userId } }),
      prisma.account.findMany({ where: { userId } }),
      prisma.budget.findMany({ where: { userId } }),
      prisma.transaction.findMany({
        where: {
          userId,
          date: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          },
        },
        include: { category: true },
      }),
    ]);

    const categorySummary = categories
      .map((cat) => {
        const spent = transactions
          .filter((t) => t.categoryId === cat.id && t.type === "expense")
          .reduce((sum, t) => sum + t.amount, 0);
        return { name: cat.name, spent };
      })
      .filter((c) => c.spent > 0);

    const context = {
      categories: categories.map((c) => ({
        id: c.id,
        name: c.name,
        type: c.type,
      })),
      accounts: accounts.map((a) => ({
        id: a.id,
        name: a.name,
        type: a.type,
        balance: a.balance,
        details: a.details ? JSON.parse(a.details) : null,
      })),
      budgets: budgets.map((b) => ({ id: b.id, name: b.name })),
      categorySpending: categorySummary,
      currency: req.user.currency || "INR",
      currentDate: new Date().toISOString(),
    };

    const model = genAI.getGenerativeModel({
      model: "gemini-3-flash-preview",
      systemInstruction: `You are a financial assistant for a money tracking app. 
        Your goal is to parse user messages into transaction data or provide financial insights.
        
        Available Categories: ${JSON.stringify(context.categories)}
        Available Accounts: ${JSON.stringify(context.accounts)}
        Available Budgets: ${JSON.stringify(context.budgets)}
        Category Spending (This Month): ${JSON.stringify(
          context.categorySpending,
        )}
        User Currency: ${context.currency}
        Current Date: ${context.currentDate}

        Rules:
        1. If the user wants to log a transaction, return:
           {
             "intent": "CREATE_TRANSACTION",
             "data": {
               "description": "string",
               "amount": number,
               "type": "income" | "expense",
               "categoryId": number | null,
               "accountId": number | null,
               "budgetId": number | null,
               "date": "ISO string",
               "status": "settled" | "unsettled"
             },
             "reply": "A brief confirmation message in a cool, minimalist tone."
           }
        2. If the user asks for insights (e.g., "most spent category", "investment performance"), use the provided context to answer:
           - For "most spent category", look at 'Category Spending'.
           - For "investment performance", look at 'accounts' where type is 'demat' or 'asset' and check their 'details'.
           Return:
           {
             "intent": "CHAT",
             "reply": "Your detailed analytical response."
           }
        3. Always try to match the category, account, and budget to the provided IDs. Use camelCase for all JSON keys.
        4. Return ONLY the JSON object.`,
    });

    // TODO : now i just need to add option for the AI to create account and other things, we need to ask follow up questions for this, like if the user says that he wanna open a new account by the name of CANARA BANK then the AI has to ask like what is this account for what balance and all the things that are required by the backend. but how will i handle the multiple account type? should i ask the accoint type first and then do the rest?

    const result = await model.generateContent(message);
    const response = await result.response;
    let text = response.text();

    text = text
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    let aiResult;
    try {
      aiResult = JSON.parse(text);
    } catch (e) {
      logger.error("AI JSON Parse Error:", text);
      return res.json({
        success: true,
        intent: "CHAT",
        reply:
          "I had a bit of trouble structuring that data. Could you try rephrasing?",
      });
    }

    if (aiResult.intent === "CREATE_TRANSACTION" && aiResult.data) {
      const rawData = aiResult.data;

      const transactionData = {
        description: rawData.description,
        amount: parseFloat(rawData.amount),
        type: rawData.type || "expense",
        categoryId: rawData.categoryId || rawData.category_id || null,
        accountId: rawData.accountId || rawData.account_id || null,
        budgetId: rawData.budgetId || rawData.budget_id || null,
        status: rawData.status || "settled",
        date: new Date(rawData.date || new Date()),
      };

      if (!transactionData.amount || !transactionData.description) {
        return res.json({
          success: true,
          intent: "CHAT",
          reply:
            "I couldn't quite catch the amount or description. Could you be more specific?",
        });
      }

      const transaction = await prisma.transaction.create({
        data: {
          ...transactionData,
          userId,
        },
        include: {
          category: true,
          account: true,
          budget: true,
        },
      });

      return res.json({
        success: true,
        intent: "CREATE_TRANSACTION",
        transaction,
        reply: aiResult.reply || "Transaction logged successfully.",
      });
    }

    res.json({
      success: true,
      intent: aiResult.intent || "CHAT",
      reply: aiResult.reply || "I'm here to help with your finances.",
    });
  } catch (error) {
    logger.error("AI Processing Error:", error);
    res.status(500).json({
      success: false,
      message: "AI service failed to process request",
    });
  }
};
