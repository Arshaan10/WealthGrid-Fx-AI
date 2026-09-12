import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().min(2).max(80),
  email: z.string().email(),
  password: z.string().min(8).max(80),
  referralCode: z.string().max(32).optional().or(z.literal("")),
});

export const contactSchema = z.object({
  name: z.string().min(2).max(80),
  email: z.string().email(),
  message: z.string().min(10).max(2000),
});

export const amountSchema = z.object({
  amount: z.coerce.number().positive().max(1_000_000),
  walletType: z.enum(["TRADING", "NETWORK"]).default("TRADING"),
  note: z.string().max(240).optional(),
  toAddress: z.string().max(128).optional(),
});

export const profileSchema = z.object({
  name: z.string().min(2).max(80),
  walletAddress: z.string().max(128).optional().or(z.literal("")),
});

export const announcementSchema = z.object({
  title: z.string().min(3).max(140),
  body: z.string().min(8).max(4000),
  published: z.boolean().optional(),
});
