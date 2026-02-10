import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

import logger from "./utils/logger.js";
import { env } from "./config/env.js";

import authRoutes from "./routes/authRoutes.js";
import emailRoutes from "./routes/emailRoutes.js";
import healthRoutes from "./routes/healthRoutes.js";
import accountsRoutes from "./routes/accountRoutes.js";
import transactionsRoutes from "./routes/transactionsRoutes.js";
import budgetsRoutes from "./routes/budgetRoutes.js";
import subscriptionRoutes from "./routes/subscriptionRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import onboardingRoutes from "./routes/onboardingRoutes.js";
import categoryRoutes from "./routes/categoryRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import aiRoutes from "./routes/aiRoutes.js";
import investmentRoutes from "./routes/investmentRoutes.js";
import accountHistoryRoutes from "./routes/accountHistoryRoutes.js";
import accountTypeRoutes from "./routes/accountTypeRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";

const app = express();

app.use((req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    const duration = Date.now() - start;
    logger.info(
      `${req.method} ${req.originalUrl} ${res.statusCode} - ${duration}ms`,
    );
  });
  next();
});

app.use(cors());
app.use(cookieParser());
app.use(express.json());
app.use("/uploads", express.static("uploads"));

app.get("/", (req, res) => {
  res.json({ message: "Money Tracker API is running" });
});

app.get("/api/config", (req, res) => {
  res.json({ enableAI: env.ENABLE_AI });
});

app.use("/api/auth", authRoutes);
app.use("/api/email", emailRoutes);
app.use("/api", healthRoutes);
app.use("/api/accounts", accountsRoutes);
app.use("/api/transactions", transactionsRoutes);
app.use("/api/budgets", budgetsRoutes);
app.use("/api/subscriptions", subscriptionRoutes);
app.use("/api/user", userRoutes);
app.use("/api/onboarding", onboardingRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/admin", adminRoutes);

// TODO: move this complete thing to the user frontend where the user can either use GEMINI or their own Ollama self hosted AI agent to make things work. Need to look at the cron setup and then make sure that the app has the option to accomodate both the things as per user requirements
if (env.ENABLE_AI) {
  app.use("/api/ai", aiRoutes);
}

app.use("/api/investments", investmentRoutes);
app.use("/api/account-history", accountHistoryRoutes);
app.use("/api/account-types", accountTypeRoutes);
app.use("/api/notifications", notificationRoutes);

/* Error handler */
app.use((err, req, res, next) => {
  if (err.name === "ZodError") {
    return res.status(400).json({
      success: false,
      message: "Validation Error",
      errors: (err.errors || err.issues || []).map((e) => ({
        path: e.path.join("."),
        message: e.message,
      })),
    });
  }

  logger.error(err.message, {
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
  });

  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
});

export default app;
