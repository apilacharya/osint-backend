import { z } from "zod";
export const searchRunSchema = z.object({
    query: z.object({
        q: z.string().trim().min(2).max(120),
        entityType: z.enum(["PERSON", "COMPANY", "UNKNOWN"]).optional(),
        aliases: z.string().trim().optional(),
        location: z.string().trim().min(2).max(120).optional(),
        industry: z.string().trim().min(2).max(120).optional()
    })
});
export const searchListSchema = z.object({
    query: z.object({
        query: z.string().trim().min(1).max(120).optional(),
        status: z.enum(["RUNNING", "COMPLETED", "FAILED"]).optional(),
        entityType: z.enum(["PERSON", "COMPANY", "UNKNOWN"]).optional()
    })
});
export const searchIdSchema = z.object({
    params: z.object({
        id: z.string().min(1)
    }),
    query: z.object({
        category: z.enum(["SOCIAL", "INFRASTRUCTURE", "CONTEXTUAL"]).optional(),
        riskSeverity: z.enum(["low", "medium", "high", "critical"]).optional(),
        sourceProvider: z.string().trim().min(1).max(80).optional(),
        minConfidence: z.coerce.number().min(0).max(1).optional()
    })
});
