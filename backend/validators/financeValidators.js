import { z } from "zod";

export const accountSchema = z.object({
  name: z.string().min(1, "Name is required"),
  type: z.string().min(1, "Type is required"),
  balance: z
    .number()
    .or(z.string().transform((val) => parseFloat(val)))
    .default(0),
  startingBalance: z
    .number()
    .or(z.string().transform((val) => parseFloat(val)))
    .optional(),
  startDate: z
    .string()
    .or(z.date())
    .optional()
    .transform((val) => (val ? new Date(val) : undefined)),
  trackHistoricData: z
    .boolean()
    .or(z.string().transform((val) => val === "true"))
    .default(false),
  currency: z.string().length(3).default("INR"),
  details: z.any().optional(),
  billingDay: z
    .number()
    .or(z.string().transform((val) => (val === "" ? undefined : parseInt(val))))
    .optional()
    .nullable(),
  dueDay: z
    .number()
    .or(z.string().transform((val) => (val === "" ? undefined : parseInt(val))))
    .optional()
    .nullable(),
  creditLimit: z
    .number()
    .or(
      z.string().transform((val) => (val === "" ? undefined : parseFloat(val))),
    )
    .optional()
    .nullable(),
  principal: z
    .number()
    .or(
      z.string().transform((val) => (val === "" ? undefined : parseFloat(val))),
    )
    .optional()
    .nullable(),
  interestRate: z
    .number()
    .or(
      z.string().transform((val) => (val === "" ? undefined : parseFloat(val))),
    )
    .optional()
    .nullable(),
  maturityDate: z
    .string()
    .or(z.date())
    .optional()
    .nullable()
    .transform((val) => (val ? new Date(val) : undefined)),
  tenure: z
    .number()
    .or(z.string().transform((val) => (val === "" ? undefined : parseInt(val))))
    .optional()
    .nullable(),
});

export const transactionSchema = z.object({
  description: z.string().min(1, "Description is required"),
  amount: z.number().or(z.string().transform((val) => parseFloat(val))),
  date: z
    .string()
    .or(z.date())
    .optional()
    .transform((val) => (val ? new Date(val) : new Date())),
  type: z.enum(["income", "expense", "transfer"]),
  accountId: z
    .string()
    .nullable()
    .optional()
    .transform((val) => (val === "" ? null : val)),
  destinationAccountId: z
    .string()
    .nullable()
    .optional()
    .transform((val) => (val === "" ? null : val)),
  budgetId: z
    .string()
    .nullable()
    .optional()
    .transform((val) => (val === "" ? null : val)),
  categoryId: z
    .string()
    .nullable()
    .optional()
    .transform((val) => (val === "" ? null : val)),
  status: z.enum(["settled", "unsettled"]).default("settled"),
  bankTransactionId: z
    .string()
    .nullable()
    .optional()
    .transform((val) => (val === "" ? null : val)),
  note: z
    .string()
    .nullable()
    .optional()
    .transform((val) => (val === "" ? null : val)),
});

export const budgetSchema = z.object({
  name: z.string().min(1, "Name is required"),
  amount: z.number().or(z.string().transform((val) => parseFloat(val))),
  frequency: z
    .enum(["daily", "weekly", "monthly", "yearly", "custom"])
    .default("custom"),
  startDate: z
    .string()
    .or(z.date())
    .optional()
    .nullable()
    .transform((val) => (val ? new Date(val) : undefined)),
  endDate: z
    .string()
    .or(z.date())
    .optional()
    .nullable()
    .transform((val) => (val ? new Date(val) : undefined)),
  categoryId: z
    .string()
    .nullable()
    .optional()
    .transform((val) => (val === "" ? null : val)),
});

export const subscriptionSchema = z.object({
  name: z.string().min(1, "Name is required"),
  amount: z.number().or(z.string().transform((val) => parseFloat(val))),
  type: z.enum(["income", "expense"]).default("expense"),
  frequency: z.enum([
    "daily",
    "weekly",
    "monthly",
    "quarterly",
    "half-yearly",
    "yearly",
  ]),
  startDate: z
    .string()
    .or(z.date())
    .transform((val) => new Date(val)),
  nextPaymentDate: z
    .string()
    .or(z.date())
    .transform((val) => new Date(val)),
  accountId: z
    .string()
    .nullable()
    .optional()
    .transform((val) => (val === "" ? null : val)),
  categoryId: z
    .string()
    .nullable()
    .optional()
    .transform((val) => (val === "" ? null : val)),
});
