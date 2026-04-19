import { z } from "zod";

export const registerSchema = z.object({
  body: z.object({
    name: z.string().trim().min(2).max(100),
    email: z.string().trim().email().max(200),
    password: z.string().min(8).max(120)
  })
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().trim().email().max(200),
    password: z.string().min(8).max(120)
  })
});
