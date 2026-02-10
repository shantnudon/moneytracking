// prompt : " Based on the text email provided below create me a regex helper function that can extract the transaction details such as amount, date, description, and account information. The function should be robust enough to handle variations in email formats from different banks and financial institutions."

// -----------------------------------------------------------------

// sample email
// Subject : Transaction alert for your ICICI Bank Credit Card

// Dear Customer,

// Your ICICI Bank Credit Card XX2008 has been used for a transaction of INR 210.00 on Dec 11, 2025 at 10:48:34. Info: AMAZON PAY IN E COMMERCE.

// The Available Credit Limit on your card is INR 4,88,221.07 and Total Credit Limit is INR 5,00,000.00. The above limits are a total of the limits of all the Credit Cards issued to the primary card holder, including any supplementary cards.

// In case you have not done this transaction, to report it please call on 18002662 or SMS BLOCK space 2008 to 9215676766 from your registered mobile number and if you are outside India, call on 04071403333.

// In case you require any further information, you may call our Customer Care or write to us at customer.care@icicibank.com

// Contact your RM @ Express Relationship Banking 022-44400000.

// Never share your OTP, URN, CVV or passwords with anyone even if the person claims to be a bank employee.

// Sincerely,

// Team ICICI Bank
// This is an auto-generated e-mail. Please do not reply.

// Discover a new way of paying your Credit Card bills from your bank account anytime anywhere by using ICICI Bank iMobile Pay. GPRS users, SMS iMobile Pay to 56767661. For details, please click here.

// Now banking is more convenient with:

// 	More than 5000
// Branches		24x7 ATM Services		Customer Care		Internet Banking		iMobile Banking

// Disclaimer

// -----------------------------------------------------------------

import imap from "imap-simple";
import { simpleParser } from "mailparser";
import fs from "fs";
import path from "path";
// TODO: Fix the pdf parsing thing so that the enteries can be autoload when we get a PDF for the statement
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const pdf = require("pdf-parse");
import prisma from "../utils/prismaClient.js";
import { decrypt } from "../utils/crypto.js";
import { GoogleGenerativeAI } from "@google/generative-ai";

import { env } from "../config/env.js";
import { sendAllNotifications } from "./notificationService.js";
import logger from "../utils/logger.js";

let genAI;
let model;

if (env.ENABLE_AI) {
  genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);
  model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
}

const PATTERNS = {
  // Matches: Rs. 500, INR 1,200.50, ₹500
  amount: /(?:Rs\.?|INR|₹)\s*[:\.]?\s*([\d,]+\.?\d*)/i,

  // Debited = Expense, Credited = Income
  debitKeywords: /debited|spent|purchase|withdrawn|sent|paid|payment/i,
  creditKeywords: /credited|refund|deposited|received|added/i,

  // Matches: "ending xx1234", "ending in 1234", "a/c ...1234", "card 1234"
  accountNumber:
    /(?:ending|a\/c|card|no\.|account)[\s:\-]*(?:(?:in|with)[\s:\-]*)?(?:[xX*]*|\.{2,})(\d{3,4})/i,

  creditCard: /credit card/i,
  debitCard: /debit card/i,
  upi: /upi|vpa/i,
  bankAccount: /a\/c|savings|checking|bank/i,

  ignoreKeywords: /otp|verification code|login alert/i,

  totalDue:
    /(?:Total|Amount)\s*(?:Due|Outstanding)[\s:]*(?:Rs\.?|INR|₹)?\s*([\d,]+\.?\d*)/i,
};

export const processDueScans = async () => {
  logger.info("Worker: Checking for due email scans...");

  try {
    const allConfigs = await prisma.emailConfig.findMany({
      include: { monitoredSenders: true },
    });

    const now = new Date();

    for (const config of allConfigs) {
      const lastRun = new Date(config.lastScannedAt);
      const frequencyHours = config.scanFrequency;
      const nextRunTime = new Date(
        lastRun.getTime() + frequencyHours * 60 * 60 * 1000
      );

      if (now >= nextRunTime) {
        logger.info(`Starting scan for User ID: ${config.userId}`);

        await prisma.emailConfig.update({
          where: { id: config.id },
          data: { lastScannedAt: new Date() },
        });

        await scanUserEmail(config, frequencyHours);
      }
    }
  } catch (error) {
    logger.error(`Worker Global Error: ${error.message}`);
  }
};

async function scanUserEmail(config, lookBackHours) {
  let connection;

  try {
    const password = decrypt(config.encryptedPassword, config.iv);

    const imapConfig = {
      imap: {
        user: config.emailUser,
        password: password,
        host: config.host,
        port: config.port,
        tls: config.tls,
        authTimeout: 10000,
        tlsOptions: { rejectUnauthorized: false },
      },
    };

    connection = await imap.connect(imapConfig);
    await connection.openBox("INBOX");

    const sinceDate = new Date();
    sinceDate.setHours(sinceDate.getHours() - lookBackHours);

    const searchCriteria = [["SINCE", sinceDate.toISOString()]];
    const fetchOptions = { bodies: ["HEADER", "TEXT", ""], markSeen: true };

    const messages = await connection.search(searchCriteria, fetchOptions);

    if (messages.length === 0) {
      logger.info(`User ${config.userId}: No new emails.`);
      return;
    }

    const validSenders = config.monitoredSenders.map((s) =>
      s.email.toLowerCase()
    );
    const hasWhitelist = validSenders.length > 0;

    logger.info(
      `User ${config.userId}: Processing ${messages.length} emails...`
    );

    let transactionsAdded = 0;
    let billsAdded = 0;

    for (const item of messages) {
      const all = item.parts.find((part) => part.which === "");
      const id = item.attributes.uid;
      const idHeader = "Imap-Id: " + id + "\r\n";

      const parsed = await simpleParser(idHeader + all.body);
      const senderEmail = parsed.from?.value[0]?.address?.toLowerCase();

      if (hasWhitelist && senderEmail && !validSenders.includes(senderEmail)) {
        continue;
      }

      const result = await analyzeAndSaveEmail(parsed, config);
      if (result) {
        transactionsAdded += result.transactions;
        billsAdded += result.bills;
      }
    }

    if (transactionsAdded > 0 || billsAdded > 0) {
      let message = `Scan complete. Added ${transactionsAdded} new transactions`;
      if (billsAdded > 0) message += ` and ${billsAdded} credit card bills`;
      message += ".";

      await prisma.notification.create({
        data: {
          userId: config.userId,
          title: "Email Scan Result",
          message,
          type: "SUCCESS",
        },
      });
    }
  } catch (error) {
    logger.error(`Error scanning User ${config.userId}: ${error.message}`);
  } finally {
    if (connection) {
      connection.end();
    }
  }
}

async function analyzeAndSaveEmail(parsed, config) {
  const userId = config.userId;
  const subject = parsed.subject || "No Subject";

  if (PATTERNS.ignoreKeywords.test(subject)) {
    return;
  }

  if (config.processingType === "AI" && env.ENABLE_AI) {
    return await analyzeWithAI(parsed, config);
  } else {
    if (config.processingType === "AI" && !env.ENABLE_AI) {
      logger.warn(
        `User ${userId} requested AI processing but AI is disabled. Falling back to Regex.`
      );
    }
    return await analyzeWithRegex(parsed, config);
  }
}

async function analyzeWithAI(parsed, config) {
  const userId = config.userId;
  const subject = parsed.subject || "No Subject";
  const text = parsed.text || "";
  const fullContent = `Subject: ${subject}\nBody: ${text}`;

  try {
    const prompt = `
    Analyze the following email transaction alert and extract the details in JSON format.
    If it is not a transaction alert (e.g. OTP, login, promotion), return null.
    
    JSON Schema:
    {
        "type": "income" | "expense",
        "amount": number,
        "description": string,
        "source": "EMAIL_AI",
        "account": {
            "instrument": "CREDIT_CARD" | "DEBIT_CARD" | "UPI" | "BANK_ACCOUNT",
            "last4": string (4 digits)
        },
        "date": string (ISO date)
    }

    Email Content:
    ${fullContent}
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const textResponse = response.text();

    const jsonStr = textResponse
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    if (jsonStr === "null") return;

    let data;
    try {
      data = JSON.parse(jsonStr);
    } catch (e) {
      logger.warn("AI returned invalid JSON", textResponse);
      return;
    }

    if (!data) return;

    let matchedAccountId = null;
    if (data.account && data.account.last4) {
      const dbAccount = await findOrCreateAccount(userId, data.account);
      matchedAccountId = dbAccount ? dbAccount.id : null;
    }

    return await saveTransaction({
      userId,
      type: data.type,
      amount: data.amount,
      description: data.description,
      source: "EMAIL_AI",
      accountId: matchedAccountId,
      metadata: {
        instrument: data.account?.instrument,
        last4: data.account?.last4,
        aiAnalysis: true,
      },
      messageId: parsed.messageId,
    });
  } catch (error) {
    logger.error("AI Analysis failed:", error);
    return { transactions: 0, bills: 0 };
  }
}

async function analyzeWithRegex(parsed, config) {
  const userId = config.userId;
  const subject = parsed.subject || "No Subject";
  const text = parsed.text || "";
  const fullContent = `${subject} \n ${text}`;

  const accountInfo = extractAccountInfo(fullContent);

  let matchedAccountId = null;
  if (accountInfo.last4) {
    try {
      const dbAccount = await findOrCreateAccount(userId, accountInfo);
      matchedAccountId = dbAccount.id;
    } catch (accErr) {
      logger.error(
        `Could not create/find account for User ${userId}:`,
        accErr
      );
    }
  }

  let transactions = 0;
  let bills = 0;

  if (parsed.attachments && parsed.attachments.length > 0) {
    for (const att of parsed.attachments) {
      if (att.contentType === "application/pdf") {
        const savedPath = await saveAttachment(att, userId);
        let pdfText = null;
        let passwordUsed = false;

        const passwordsToTry =
          config.pdfPasswords && config.pdfPasswords.length > 0
            ? config.pdfPasswords
            : [undefined];

        for (const pwd of passwordsToTry) {
          try {
            const options = pwd ? { password: pwd } : {};
            const pdfData = await pdf(att.content, options);
            pdfText = pdfData.text;
            passwordUsed = !!pwd;
            break;
          } catch (e) {
            logger.error(e);
          }
        }

        if (pdfText) {
          const dueMatch = pdfText.match(PATTERNS.totalDue);
          if (dueMatch) {
            const amount = parseFloat(dueMatch[1].replace(/,/g, ""));

            const res = await saveTransaction({
              userId,
              type: "expense",
              amount,
              description: `Statement Bill: ${subject}`,
              source: "STATEMENT_PDF",
              accountId: matchedAccountId,
              metadata: {
                instrument: accountInfo.instrument,
                last4: accountInfo.last4,
                pdfParse: true,
                passwordUsed: passwordUsed,
              },
              messageId: parsed.messageId,
              billAttachment: savedPath,
            });
            if (res.transactions > 0) {
              transactions += res.transactions;
              bills += 1;
            }
            return { transactions, bills };
          }
        } else {
          const res = await saveTransaction({
            userId,
            type: "expense",
            amount: 0,
            description: `Password Protected Statement: ${
              att.filename || subject
            }`,
            source: "STATEMENT_PDF",
            accountId: matchedAccountId,
            status: "unsettled",
            billAttachment: savedPath,
            metadata: {
              isPasswordProtected: true,
              needsReview: true,
              instrument: accountInfo.instrument,
              last4: accountInfo.last4,
            },
            messageId: parsed.messageId + "_pdf_locked",
          });
          if (res.transactions > 0) {
            transactions += res.transactions;
            bills += 1;
          }
        }
      }
    }
  }

  let type = null;
  if (PATTERNS.debitKeywords.test(fullContent)) type = "expense";
  else if (PATTERNS.creditKeywords.test(fullContent)) type = "income";

  if (type) {
    const amountMatch = fullContent.match(PATTERNS.amount);
    if (amountMatch) {
      const amount = parseFloat(amountMatch[1].replace(/,/g, ""));

      const res = await saveTransaction({
        userId,
        type,
        amount,
        description: subject,
        source: "EMAIL_ALERT",
        accountId: matchedAccountId,
        metadata: {
          instrument: accountInfo.instrument,
          last4: accountInfo.last4,
          rawSnippet: text.substring(0, 100),
        },
        messageId: parsed.messageId,
      });
      transactions += res.transactions;
      bills += res.bills;
    }
  }
  return { transactions, bills };
}

function extractAccountInfo(text) {
  let instrument = "UNKNOWN";
  let last4 = null;

  if (PATTERNS.creditCard.test(text)) instrument = "CREDIT_CARD";
  else if (PATTERNS.debitCard.test(text)) instrument = "DEBIT_CARD";
  else if (PATTERNS.upi.test(text)) instrument = "UPI";
  else if (PATTERNS.bankAccount.test(text)) instrument = "BANK_ACCOUNT";

  const match = text.match(PATTERNS.accountNumber);
  if (match && match[1]) {
    last4 = match[1];
  }

  return { instrument, last4 };
}

async function findOrCreateAccount(userId, info) {
  if (!info.last4) return null;

  const existingAccount = await prisma.account.findFirst({
    where: {
      userId: userId,
      OR: [
        { name: { contains: info.last4 } },
        { details: { contains: info.last4 } },
      ],
    },
  });

  if (existingAccount) {
    return existingAccount;
  }

  logger.info(
    `Auto-creating account for User ${userId}: ${info.instrument} ${info.last4}`
  );

  let schemaType = "savings";
  if (info.instrument === "CREDIT_CARD") schemaType = "loan";
  else if (info.instrument === "UPI") schemaType = "checking";

  const newAccount = await prisma.account.create({
    data: {
      userId: userId,
      name: `Auto: ${info.instrument} - ${info.last4}`,
      type: schemaType,
      balance: 0.0,
      currency: "INR",
      details: JSON.stringify({
        source: "EMAIL_WORKER",
        autoCreated: true,
        originalInstrument: info.instrument,
      }),
    },
  });

  return newAccount;
}

async function saveTransaction({
  userId,
  type,
  amount,
  description,
  source,
  accountId,
  metadata,
  messageId,
  billAttachment,
}) {
  try {
    await prisma.transaction.create({
      data: {
        userId: userId,
        type: type,
        amount: amount,
        description: description,
        source: source,
        status: "unsettled",
        accountId: accountId,
        metadata: JSON.stringify(metadata),
        externalId: messageId,
        date: new Date(),
        billAttachment: billAttachment,
      },
    });

    logger.info(
      `User ${userId}: Saved ${type} of ${amount} (Linked Account ID: ${
        accountId || "None"
      })`
    );

    const isBill = source.includes("STATEMENT");
    if (isBill) {
      const message = `Platform Alert: Bill detected for ${description}. Amount: ${amount}. Status: Pending review.`;
      const title = "New Bill Detection";
      const htmlBody = `
        <div style="font-family: sans-serif; padding: 20px;">
          <h2 style="color: #000;">System Alert: Bill Detection</h2>
          <p>A new bill has been parsed from your emails:</p>
          <ul style="list-style: none; padding: 0;">
            <li><strong>Subject:</strong> ${description}</li>
            <li><strong>Amount:</strong> ₹${amount}</li>
            <li><strong>Source:</strong> ${source}</li>
          </ul>
          <p>Please review this in your dashboard.</p>
          <hr/>
          <p style="font-size: 10px; color: #888;">This is an automated security baseline update.</p>
        </div>
      `;
      await sendAllNotifications(userId, title, message, htmlBody);
    }
    return { transactions: 1, bills: isBill ? 1 : 0 };
  } catch (error) {
    if (error.code === "P2002") {
      return { transactions: 0, bills: 0 };
    } else {
      logger.error(`DB Save Error: ${error.message}`);
      return { transactions: 0, bills: 0 };
    }
  }
}

async function saveAttachment(attachment, userId) {
  const uploadDir = path.join(process.cwd(), "uploads", "bills");
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  const filename = `${userId}_${Date.now()}_${attachment.filename}`;
  const filePath = path.join(uploadDir, filename);

  fs.writeFileSync(filePath, attachment.content);
  return `/uploads/bills/${filename}`;
}

export const sendPeriodicDigest = async (userId, days = 7) => {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        transactions: {
          where: {
            date: { gte: startDate },
          },
        },
        accounts: true,
      },
    });

    if (!user) return;

    const totalExpense = user.transactions
      .filter((t) => t.type === "expense")
      .reduce((sum, t) => sum + t.amount, 0);

    const totalIncome = user.transactions
      .filter((t) => t.type === "income")
      .reduce((sum, t) => sum + t.amount, 0);

    const message = `Weekly Digest: Spent ₹${totalExpense}, Earned ₹${totalIncome}. Check dashboard for details.`;
    const title = "Your Financial Digest";

    const htmlBody = `
      <div style="font-family: sans-serif; padding: 20px; border: 1px solid #000;">
        <h1 style="text-transform: uppercase;">Financial Digest</h1>
        <p>Summary for the last ${days} days:</p>
        <div style="margin: 20px 0; padding: 15px; background: #f4f4f4;">
          <p><strong>Total Outflow:</strong> ₹${totalExpense}</p>
          <p><strong>Total Inflow:</strong> ₹${totalIncome}</p>
          <p><strong>Net Position:</strong> ₹${totalIncome - totalExpense}</p>
        </div>
        <h3>Active Accounts</h3>
        <ul>
          ${user.accounts
            .map((a) => `<li>${a.name}: ₹${a.balance}</li>`)
            .join("")}
        </ul>
        <br/>
        <a href="${
          env.FRONTEND_URL
        }/dashboard" style="background: #000; color: #fff; padding: 10px 20px; text-decoration: none; font-weight: bold; text-transform: uppercase; font-size: 12px;">Open Dashboard</a>
      </div>
    `;

    await sendAllNotifications(userId, title, message, htmlBody);
  } catch (error) {
    logger.error(`Digest Error for User ${userId}:`, error);
  }
};

export const processAllDigests = async () => {
  const users = await prisma.user.findMany({
    where: {
      OR: [{ notificationsEmail: true }, { notificationsNtfy: true }],
    },
  });

  for (const user of users) {
    await sendPeriodicDigest(user.id);
  }
};
