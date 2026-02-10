import { env } from "../config/env.js";
import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from "fs";
import path from "path";
import logger from "./logger.js";

let genAI;

export async function parseBillWithAI(filePath) {
  if (!env.ENABLE_AI) {
    logger.warn("AI Bill Parsing is disabled.");
    return {
      success: false,
      error: "AI features are disabled.",
      data: {
        amount: 0,
        description: "Bill Upload - AI Disabled",
        date: new Date().toISOString().split("T")[0],
        merchant: null,
      },
    };
  }

  try {
    if (!genAI) {
      genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);
    }
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const fileBuffer = fs.readFileSync(filePath);
    const base64Data = fileBuffer.toString("base64");

    const ext = path.extname(filePath).toLowerCase();
    let mimeType = "image/jpeg";
    if (ext === ".png") mimeType = "image/png";
    else if (ext === ".pdf") mimeType = "application/pdf";
    else if (ext === ".jpg" || ext === ".jpeg") mimeType = "image/jpeg";

    const prompt = `Analyze this bill/receipt and extract the following information in JSON format:
{
  "amount": <total amount as a number>,
  "description": "<brief description of the purchase/transaction>",
  "date": "<transaction date in YYYY-MM-DD format if available, otherwise null>",
  "merchant": "<merchant/vendor name if available>"
}

Important:
- Extract the TOTAL amount (not subtotal or individual items)
- If multiple amounts are present, use the final total
- For description, provide a concise summary (e.g., "Grocery Shopping at Walmart")
- Return ONLY valid JSON, no additional text
- If you cannot find certain information, use null for that field`;

    const result = await model.generateContent([
      {
        inlineData: {
          data: base64Data,
          mimeType: mimeType,
        },
      },
      prompt,
    ]);

    const response = await result.response;
    const text = response.text();

    let jsonText = text.trim();

    if (jsonText.startsWith("```json")) {
      jsonText = jsonText.replace(/```json\n?/g, "").replace(/```\n?/g, "");
    } else if (jsonText.startsWith("```")) {
      jsonText = jsonText.replace(/```\n?/g, "");
    }

    const parsedData = JSON.parse(jsonText.trim());

    return {
      success: true,
      data: {
        amount: parsedData.amount || 0,
        description: parsedData.description || "Bill Upload",
        date: parsedData.date || new Date().toISOString().split("T")[0],
        merchant: parsedData.merchant || null,
      },
    };
  } catch (error) {
    logger.error("Error parsing bill with AI:", error);
    return {
      success: false,
      error: error.message,
      data: {
        amount: 0,
        description: "Bill Upload - Manual Entry Required",
        date: new Date().toISOString().split("T")[0],
        merchant: null,
      },
    };
  }
}
