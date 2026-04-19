import { randomUUID } from "node:crypto";
import { createAppError, notFoundError } from "../../utils/errors.js";
import { sendSuccess } from "../../utils/http.js";
import { ERROR_CODES, ERROR_TYPES } from "../../config/constants.js";
import { listSearchRuns, getSearchRunById } from "../search/search.service.js";
import { listAdapterCatalog } from "../../services/aggregation/aggregation.service.js";
import { listReports, getReportById } from "../reports/reports.service.js";
import { githubSocialAdapter } from "../../adapters/social/github.adapter.js";
import { crtShInfrastructureAdapter } from "../../adapters/infrastructure/crtsh.adapter.js";
import { wikipediaContextualAdapter } from "../../adapters/contextual/wikipedia.adapter.js";
import { scoreConfidence } from "../../services/scoring/confidence.service.js";
import { evaluateRisk } from "../../services/scoring/risk.service.js";
const toFeedFinding = (finding) => {
    const findingId = `feed-finding-${randomUUID()}`;
    const sourceId = `feed-source-${randomUUID()}`;
    const confidence = scoreConfidence({
        ...finding,
        resolutionScore: 1
    });
    const risk = evaluateRisk({
        ...finding,
        resolutionScore: 1
    }, confidence);
    return {
        id: findingId,
        category: finding.category,
        title: finding.title,
        summary: finding.summary,
        confidence,
        confidenceSignals: finding.confidenceSignals,
        rawPayload: finding.rawPayload,
        retrievedAt: finding.retrievalTimestamp,
        entityId: "feed-entity",
        searchRunId: "feed-run",
        sourceId,
        source: {
            id: sourceId,
            provider: finding.provider,
            url: finding.sourceUrl,
            retrievedAt: finding.retrievalTimestamp
        },
        riskAssessment: {
            id: `feed-risk-${randomUUID()}`,
            findingId,
            severity: risk.severity,
            score: risk.score,
            rationale: risk.rationale,
            createdAt: new Date()
        }
    };
};
const requireAuthUserId = (req) => {
    if (!req.authUser?.id) {
        throw createAppError({
            message: "Authentication required for this operation.",
            status: 401,
            code: ERROR_CODES.INVALID_QUERY_PARAMS,
            type: ERROR_TYPES.INVALID_QUERY_PARAMS
        });
    }
    return req.authUser.id;
};
export const queryResourceHandler = async (req, res) => {
    const body = req.body;
    if (body.resource === "SEARCH_SOURCES") {
        const adapters = listAdapterCatalog();
        const grouped = adapters.reduce((acc, item) => {
            const existing = acc[item.category] ?? [];
            existing.push(item.provider);
            acc[item.category] = existing;
            return acc;
        }, {});
        sendSuccess(res, {
            items: adapters,
            byCategory: grouped
        }, {
            total: adapters.length
        }, 200);
        return;
    }
    if (body.resource === "DISCOVERY_FEED") {
        const limit = Math.min(body.params?.limit ?? 5, 15);
        const defaults = [
            githubSocialAdapter.search({ query: "developer", limit, context: undefined }),
            crtShInfrastructureAdapter.search({ query: "google.com", limit, context: undefined }),
            wikipediaContextualAdapter.search({ query: "technology", limit, context: undefined })
        ];
        const settled = await Promise.allSettled(defaults);
        const findings = settled.flatMap((result) => (result.status === "fulfilled" ? result.value : []));
        sendSuccess(res, {
            items: findings.map(toFeedFinding)
        }, {
            total: findings.length
        }, 200);
        return;
    }
    const userId = requireAuthUserId(req);
    if (body.resource === "SEARCH_RUNS") {
        const result = await listSearchRuns({
            offset: body.params.offset ?? 0,
            limit: body.params.limit ?? 20,
            query: body.params.query,
            status: body.params.status,
            entityType: body.params.entityType
        }, userId);
        sendSuccess(res, {
            items: result.items
        }, {
            offset: result.offset,
            limit: result.limit,
            total: result.total,
            hasMore: result.offset + result.items.length < result.total
        }, 200);
        return;
    }
    if (body.resource === "SEARCH_RUN_DETAIL") {
        const result = await getSearchRunById(body.params.id, userId, {
            offset: 0,
            limit: 1000
        });
        if (!result) {
            throw notFoundError("Search run not found", { id: body.params.id });
        }
        sendSuccess(res, { item: result }, {}, 200);
        return;
    }
    if (body.resource === "REPORTS") {
        const result = await listReports({
            offset: body.params.offset ?? 0,
            limit: body.params.limit ?? 20,
            searchRunId: body.params.searchRunId,
            format: body.params.format ? body.params.format : undefined
        }, userId);
        sendSuccess(res, {
            items: result.items
        }, {
            offset: result.offset,
            limit: result.limit,
            total: result.total,
            hasMore: result.offset + result.items.length < result.total
        }, 200);
        return;
    }
    if (body.resource === "REPORT_DETAIL") {
        const report = await getReportById(body.params.id);
        if (!report || report.searchRun.userId !== userId) {
            throw notFoundError("Report not found", { id: body.params.id });
        }
        const response = {
            ...report,
            searchRun: {
                id: report.searchRun.id,
                query: report.searchRun.query
            }
        };
        sendSuccess(res, { item: response }, {}, 200);
        return;
    }
};
