import { z } from "zod";

export const sendOtpSchema = z.object({
  email: z
    .string()
    .email("Please enter a valid email address")
    .toLowerCase()
    .trim(),
});

export const verifyOtpSchema = z.object({
  email: z.string().email().toLowerCase().trim(),
  code: z
    .string()
    .length(6, "Code must be exactly 6 digits")
    .regex(/^\d{6}$/, "Code must contain only digits"),
});

export const transferSchema = z.object({
  message: z
    .string()
    .max(500, "Message cannot exceed 500 characters")
    .trim()
    .optional(),
});

export const addRowSchema = z.object({
  fieldOne: z
    .string()
    .min(1, "Field One cannot be empty")
    .max(200, "Field One too long")
    .trim(),
  fieldTwo: z
    .string()
    .min(1, "Field Two cannot be empty")
    .max(200, "Field Two too long")
    .trim(),
  fieldThree: z
    .string()
    .min(1, "Field Three cannot be empty")
    .max(200, "Field Three too long")
    .trim(),
});

export const deleteRowSchema = z.object({
  id: z
    .number()
    .int("ID must be an integer")
    .positive("ID must be positive"),
});

export type SendOtpInput    = z.infer<typeof sendOtpSchema>;
export type VerifyOtpInput  = z.infer<typeof verifyOtpSchema>;
export type TransferInput   = z.infer<typeof transferSchema>;
export type AddRowInput     = z.infer<typeof addRowSchema>;
export type DeleteRowInput  = z.infer<typeof deleteRowSchema>;