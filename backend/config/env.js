import { z } from "zod";
import dotenv from "dotenv";

dotenv.config({ path: "../.env" });

const envSchema = z
  .object({
    NODE_ENV: z
      .enum(["development", "production", "test"])
      .default("development"),
    BACKEND_PORT: z.string().transform(Number).default("3010"),
    DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
    JWT_SECRET: z.string().min(1, "JWT_SECRET is required"),

    EMAIL_USER: z.string().email("EMAIL_USER must be a valid email").optional(),
    EMAIL_PASS: z.string().optional(),

    ENABLE_AI: z
      .string()
      .transform((val) => val === "true")
      .default("false"),
    GEMINI_API_KEY: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.ENABLE_AI && !data.GEMINI_API_KEY) {
        return false;
      }
      return true;
    },
    {
      message: "GEMINI_API_KEY is required when ENABLE_AI is set to true",
      path: ["GEMINI_API_KEY"],
    },
  );

const processEnv = {
  NODE_ENV: process.env.NODE_ENV,
  BACKEND_PORT: process.env.BACKEND_PORT,
  DATABASE_URL: process.env.DATABASE_URL,
  JWT_SECRET: process.env.JWT_SECRET,
  ENABLE_AI: process.env.ENABLE_AI,
  GEMINI_API_KEY: process.env.GEMINI_API_KEY,
};

const parsedEnv = envSchema.safeParse(processEnv);

if (!parsedEnv.success) {
  logger.error(
    "Invalid environment variables:",
    JSON.stringify(parsedEnv.error.format(), null, 2),
  );
  process.exit(1);
}

export const env = parsedEnv.data;
