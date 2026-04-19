import { z } from "zod";
const paginationSchema = z.object({
    offset: z.coerce.number().int().min(0).default(0),
    limit: z.coerce.number().int().min(1).max(100).default(20)
});
const searchRunsParamsSchema = paginationSchema.extend({
    query: z.string().trim().min(1).max(120).optional(),
    status: z.enum(["RUNNING", "COMPLETED", "FAILED"]).optional(),
    entityType: z.enum(["PERSON", "COMPANY", "UNKNOWN"]).optional()
});
const searchRunDetailParamsSchema = paginationSchema.extend({
    id: z.string().min(1),
    category: z.enum(["SOCIAL", "INFRASTRUCTURE", "CONTEXTUAL"]).optional(),
    riskSeverity: z.enum(["low", "medium", "high", "critical"]).optional(),
    sourceProvider: z.string().trim().min(1).max(80).optional(),
    minConfidence: z.coerce.number().min(0).max(1).optional()
});
const reportsParamsSchema = paginationSchema.extend({
    searchRunId: z.string().min(1).optional(),
    format: z.enum(["MARKDOWN", "PDF"]).optional()
});
export const resourceQuerySchema = z.object({
    body: z.discriminatedUnion("resource", [
        z.object({
            resource: z.literal("SEARCH_RUNS"),
            params: searchRunsParamsSchema.default({ offset: 0, limit: 20 })
        }),
        z.object({
            resource: z.literal("SEARCH_RUN_DETAIL"),
            params: searchRunDetailParamsSchema
        }),
        z.object({
            resource: z.literal("REPORTS"),
            params: reportsParamsSchema.default({ offset: 0, limit: 20 })
        }),
        z.object({
            resource: z.literal("REPORT_DETAIL"),
            params: z.object({
                id: z.string().min(1)
            })
        }),
        z.object({
            resource: z.literal("SEARCH_SOURCES"),
            params: z.object({}).optional()
        }),
        z.object({
            resource: z.literal("DISCOVERY_FEED"),
            params: z
                .object({
                limit: z.coerce.number().int().min(1).max(15).default(5)
            })
                .optional()
        })
    ])
});
