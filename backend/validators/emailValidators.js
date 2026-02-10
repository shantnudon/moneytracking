import { z } from "zod";

const monitoredSenderSchema = z.object({
  email: z.string().email("Invalid email format"),
  pdfPasswords: z.array(z.string()).optional().default([]),
});

export const emailConfigSchema = z.object({
  emailUser: z.string().email("Invalid email format"),
  emailPassword: z.string().optional(),
  host: z.string().optional(),
  port: z.number().optional(),
  scanFrequency: z.number().min(1).max(168),
  processingType: z.enum(["REGEX", "AI"]).optional().default("REGEX"),
});
