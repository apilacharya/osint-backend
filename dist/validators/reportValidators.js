import { z } from "zod";
export const reportCreateSchema = z.object({
    body: z.object({
        searchRunId: z.string().min(1),
        format: z.enum(["markdown", "pdf"])
    })
});
export const reportIdSchema = z.object({
    params: z.object({
        id: z.string().min(1)
    })
});
export const reportListSchema = z.object({
    query: z.object({
        offset: z.coerce.number().int().min(0).default(0),
        limit: z.coerce.number().int().min(1).max(100).default(20),
        searchRunId: z.string().min(1).optional(),
        format: z.enum(["MARKDOWN", "PDF"]).optional()
    })
});
export const findingIdSchema = z.object({
    params: z.object({
        id: z.string().min(1)
    })
});
