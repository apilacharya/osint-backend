import { EntityType } from "@prisma/client";
import { randomUUID } from "node:crypto";
import { getSearchRunById, listSearchRuns, runAuthenticatedSearch, runGuestSearch } from "./search.service.js";
import { sendSuccess } from "../../middleware/http.js";
import { createAppError, notFoundError } from "../../middleware/errors.js";
import { ERROR_CODES, ERROR_TYPES } from "../../config/constants.js";
import { listAdapterCatalog } from "../../services/aggregation/aggregation.service.js";
import { githubSocialAdapter } from "../../adapters/social/github.adapter.js";
import { crtShInfrastructureAdapter } from "../../adapters/infrastructure/crtsh.adapter.js";
import { wikipediaContextualAdapter } from "../../adapters/contextual/wikipedia.adapter.js";
import { scoreConfidence } from "../../services/scoring/confidence.service.js";
import { evaluateRisk } from "../../services/scoring/risk.service.js";
const toFeedFinding = (finding) => {
    const findingId = `feed-finding-${randomUUID()}`;
    const sourceId = `feed-source-${randomUUID()}`;
    const confidence = scoreConfidence({ ...finding, resolutionScore: 1 });
    const risk = evaluateRisk({ ...finding, resolutionScore: 1 }, confidence);
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
export const createSearch = async (req, res) => {
    const body = req.body;
    const payload = {
        query: body.query,
        entityType: body.entityType ?? EntityType.UNKNOWN,
        context: body.context
    };
    const result = req.authUser?.id ? await runAuthenticatedSearch(payload, req.authUser.id) : await runGuestSearch(payload);
    sendSuccess(res, result, {}, 201);
};
export const listSearches = async (req, res) => {
    if (!req.authUser?.id) {
        throw createAppError({
            message: "Authentication required to retrieve search history.",
            status: 401,
            code: ERROR_CODES.INVALID_QUERY_PARAMS,
            type: ERROR_TYPES.INVALID_QUERY_PARAMS
        });
    }
    const query = req.query.query ? String(req.query.query) : undefined;
    const status = req.query.status ? String(req.query.status) : undefined;
    const entityType = req.query.entityType
        ? String(req.query.entityType)
        : undefined;
    const result = await listSearchRuns({
        query,
        status,
        entityType
    }, req.authUser.id);
    sendSuccess(res, result.items, {}, 200);
};
export const getSearchById = async (req, res) => {
    if (!req.authUser?.id) {
        throw createAppError({
            message: "Authentication required to retrieve search history.",
            status: 401,
            code: ERROR_CODES.INVALID_QUERY_PARAMS,
            type: ERROR_TYPES.INVALID_QUERY_PARAMS
        });
    }
    const id = String(req.params.id);
    const result = await getSearchRunById(id, req.authUser.id, {
        category: req.query.category ? String(req.query.category) : undefined,
        riskSeverity: req.query.riskSeverity
            ? String(req.query.riskSeverity)
            : undefined,
        sourceProvider: req.query.sourceProvider ? String(req.query.sourceProvider) : undefined,
        minConfidence: req.query.minConfidence ? Number(req.query.minConfidence) : undefined
    });
    if (!result) {
        throw notFoundError("Search run not found", { id });
    }
    sendSuccess(res, result, {}, 200);
};
export const listSearchSources = async (_req, res) => {
    const adapters = listAdapterCatalog();
    const grouped = adapters.reduce((acc, item) => {
        const existing = acc[item.category] ?? [];
        existing.push(item.provider);
        acc[item.category] = existing;
        return acc;
    }, {});
    sendSuccess(res, {
        all: adapters,
        byCategory: grouped
    }, { total: adapters.length }, 200);
};
export const getDiscoveryFeed = async (_req, res) => {
    const settled = await Promise.allSettled([
        githubSocialAdapter.search({ query: "developer", context: undefined }),
        crtShInfrastructureAdapter.search({ query: "google.com", context: undefined }),
        wikipediaContextualAdapter.search({ query: "technology", context: undefined })
    ]);
    const findings = settled.flatMap((result) => (result.status === "fulfilled" ? result.value : []));
    sendSuccess(res, findings.map(toFeedFinding), { total: findings.length }, 200);
};
