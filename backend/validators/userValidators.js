import { z } from "zod";

export const userSettingsSchema = z.object({
  name: z.string().min(1).optional(),
  currency: z.string().length(3).optional(),
  theme: z.enum(["light", "dark"]).optional(),
  notificationsEmail: z.boolean().optional(),
  alertEmail: z.string().email().or(z.literal("")).optional(),
  notificationsNtfy: z.boolean().optional(),
  ntfyTopic: z.string().url().or(z.literal("")).optional(),
  isOnboardingCompleted: z.boolean().optional(),
});

export const onboardingSchema = z.object({
  username: z.string().min(1),
  currency: z.string().length(3),
  theme: z.enum(["light", "dark"]),
  bankAccounts: z
    .array(
      z.object({
        name: z.string(),
        accountType: z.string().optional(),
        balance: z.number().or(z.string().transform((v) => parseFloat(v))),
        accountNumber: z.string().optional(),
        currency: z.string().optional(),
      }),
    )
    .default([]),
  creditCards: z
    .array(
      z.object({
        bankName: z.string(),
        name: z.string().optional(),
        balance: z.number().or(z.string().transform((v) => parseFloat(v))),
        accountNumber: z.string().optional(),
        billDueDate: z.string().optional(),
      }),
    )
    .default([]),
  loans: z
    .array(
      z.object({
        name: z.string(),
        principalAmount: z
          .number()
          .or(z.string().transform((v) => parseFloat(v))),
        emiAmount: z
          .number()
          .or(z.string().transform((v) => parseFloat(v)))
          .optional(),
      }),
    )
    .default([]),
  investments: z
    .array(
      z.object({
        name: z.string(),
        investmentType: z.string().optional(),
        balance: z.number().or(z.string().transform((v) => parseFloat(v))),
      }),
    )
    .default([]),
  otherExpenses: z
    .array(
      z.object({
        name: z.string(),
        amount: z.number().or(z.string().transform((v) => parseFloat(v))),
        frequency: z.string().optional(),
      }),
    )
    .default([]),
  otherIncomeSources: z
    .array(
      z.object({
        name: z.string(),
        amount: z.number().or(z.string().transform((v) => parseFloat(v))),
        frequency: z.string().optional(),
      }),
    )
    .default([]),
});
