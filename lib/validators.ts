import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().min(2).max(80),
  email: z.string().email(),
  phone: z.string().min(8).max(24),
  password: z.string().min(8).max(80),
  referralCode: z.string().max(32).optional().or(z.literal("")),
});

export const contactSchema = z.object({
  name: z.string().min(2).max(80),
  email: z.string().email(),
  message: z.string().min(10).max(2000),
});

export const evmAddressSchema = z
  .string()
  .trim()
  .regex(/^0x[a-fA-F0-9]{40}$/, "Enter a valid EVM address.");

export const txHashSchema = z
  .string()
  .trim()
  .regex(/^0x[a-fA-F0-9]{64}$/, "Enter a valid transaction hash.");

export const amountSchema = z.object({
  amount: z.coerce.number().positive().max(1_000_000),
  walletType: z.enum(["TRADING", "NETWORK"]).default("TRADING"),
  note: z.string().max(240).optional(),
  toAddress: z.string().max(128).optional(),
  txHash: z.string().max(80).optional().or(z.literal("")),
  fromAddress: z.string().max(128).optional().or(z.literal("")),
  watch: z.boolean().optional(),
});

export const walletAddressSchema = z.object({
  address: evmAddressSchema,
});

export const profileSchema = z.object({
  name: z.string().min(2).max(80),
  phone: z.string().min(8).max(24),
  walletAddress: z
    .string()
    .max(128)
    .optional()
    .or(z.literal(""))
    .refine((value) => !value || /^0x[a-fA-F0-9]{40}$/.test(value), "Enter a valid EVM address."),
});

export const ticketCreateSchema = z.object({
  subject: z.string().min(3).max(140),
  body: z.string().min(8).max(4000),
});

export const ticketReplySchema = z.object({
  body: z.string().min(2).max(4000),
});

export const ticketStatusSchema = z.object({
  status: z.enum(["OPEN", "PENDING", "CLOSED"]),
});

export const adminUserSchema = z.object({
  id: z.string().min(1),
  blocked: z.boolean().optional(),
  walletAddress: z
    .string()
    .max(128)
    .optional()
    .or(z.literal(""))
    .refine((value) => !value || /^0x[a-fA-F0-9]{40}$/.test(value), "Enter a valid EVM address."),
});

export const payoutRetrySchema = z.object({
  id: z.string().min(1),
});

export const announcementSchema = z.object({
  title: z.string().min(3).max(140),
  body: z.string().min(8).max(4000),
  published: z.boolean().optional(),
});

export const treasuryTopupSchema = z.object({
  amount: z.coerce.number().positive().max(10_000_000),
  note: z.string().max(240).optional(),
});

export const flashLoanApplySchema = z.object({
  amount: z.coerce.number().positive().max(10_000_000),
  note: z.string().max(240).optional(),
});

export const flashLoanReviewSchema = z.object({
  id: z.string().min(1),
  decision: z.enum(["APPROVE", "REJECT"]),
  amount: z.coerce.number().positive().max(10_000_000).optional(),
  note: z.string().max(240).optional(),
});

export const packageActivateSchema = z.object({
  amount: z.coerce.number().positive().max(10_000_000),
  boosterTier: z.enum(["NONE", "BOOSTER", "SUPER", "ULTRA"]).default("NONE"),
  fundingSource: z.enum(["SELF", "LOAN"]).default("SELF"),
});

export const adminPackageActivateSchema = z.object({
  userId: z.string().min(1).optional(),
  email: z.string().email().optional(),
  amount: z.coerce.number().positive().max(10_000_000),
  count: z.coerce.number().int().min(1).max(20).default(1),
  fundingSource: z.enum(["ADMIN", "LOAN"]).default("ADMIN"),
  note: z.string().max(240).optional(),
});
