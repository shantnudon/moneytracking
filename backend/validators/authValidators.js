import { z } from "zod";

export const signupSchema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters long"),
});

export const loginSchema = z.object({
  email: z.string().min(1, "Email is required"),
  password: z.string().min(6, "Password is required"),
});

export const createUserByAdminSchema = z.object({
  name: z.string().min(2, "Name is required").optional(),
  email: z.string().email("Invalid email address").optional(),
  password: z.string().min(6, "Password must be at least 6 characters long"),
  role: z.enum(["ADMIN", "BUREAU", "USER"]),
  aisheCode: z.string().min(3).optional(),
});

export const forgotPasswordSchema = z.object({
  identifier: z
    .string()
    .min(1, { message: "Please provide your Email or AISHE Code." }),
});

export const resetPasswordSchema = z.object({
  password: z.string().min(6, "Password must be at least 6 characters long."),
});
