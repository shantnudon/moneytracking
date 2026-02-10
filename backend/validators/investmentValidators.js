import { z } from "zod";

export const investmentSchema = z.object({
  accountId: z.string(),
  sourceAccountId: z.string().optional(),
  type: z.enum(["stock", "mutual_fund"]),
  symbol: z.string().min(1).max(20).toUpperCase(),
  name: z.string().min(1).max(200),
  quantity: z.number().positive(),
  buyPrice: z.number().positive(),
  buyDate: z.string().datetime().or(z.date()),
});

export const updateInvestmentSchema = z.object({
  type: z.enum(["stock", "mutual_fund"]).optional(),
  symbol: z.string().min(1).max(20).toUpperCase().optional(),
  name: z.string().min(1).max(200).optional(),
  quantity: z.number().positive().optional(),
  buyPrice: z.number().positive().optional(),
  buyDate: z.string().datetime().or(z.date()).optional(),
});

export const accountHistorySchema = z.object({
  accountId: z.string(),
  balance: z.number(),
  date: z.string().datetime().or(z.date()).optional(),
  source: z.enum(["auto", "manual", "investment"]).default("manual"),
});
