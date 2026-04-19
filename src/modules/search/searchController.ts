import type { Request, Response } from "express";
import { getSearchRunById, listSearchRuns, runAuthenticatedSearch, runGuestSearch } from "./searchService.js";
import { sendSuccess } from "../../middleware/http.js";
import { createAppError, notFoundError } from "../../middleware/errors.js";
import { ERROR_CODES, ERROR_TYPES } from "../../config/constants.js";
import { listAdapterCatalog } from "../../services/aggregation/aggregationService.js";
import { fetchDiscoveryFeed, formatFindingForFeed } from "../../utils/discoveryService.js";
import { groupBy } from "../../utils/helpers.js";
import { searchRunSchema } from "../../validators/searchValidators.js";

export const runSearch = async (req: Request, res: Response): Promise<void> => {
  const parsed = searchRunSchema.safeParse({ query: req.query });
  if (!parsed.success) {
    throw createAppError({
      message: "Validation failed",
      status: 400,
      code: ERROR_CODES.VALIDATION_ERROR,
      type: ERROR_TYPES.VALIDATION_ERROR,
      details: { issues: parsed.error.issues }
    });
  }

  const query = parsed.data.query;
  const payload = {
    query: query.q,
    entityType: query.entityType ?? "UNKNOWN",
    context: {
      aliases: query.aliases
        ? query.aliases
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean)
        : undefined,
      location: query.location || undefined,
      industry: query.industry || undefined
    }
  };
  const result = req.authUser?.id ? await runAuthenticatedSearch(payload, req.authUser.id) : await runGuestSearch(payload);

  sendSuccess(res, result, {}, 200);
};

export const listSearches = async (req: Request, res: Response): Promise<void> => {
  const query = req.query.query ? String(req.query.query) : undefined;
  const status = req.query.status ? (String(req.query.status) as "RUNNING" | "COMPLETED" | "FAILED") : undefined;
  const entityType = req.query.entityType
    ? (String(req.query.entityType) as "PERSON" | "COMPANY" | "UNKNOWN")
    : undefined;
  const result = await listSearchRuns(
    {
      query,
      status,
      entityType
    },
    req.authUser!.id
  );

  sendSuccess(res, result.items, {}, 200);
};

export const getSearchById = async (req: Request, res: Response): Promise<void> => {
  const id = String(req.params.id);
  const result = await getSearchRunById(id, req.authUser!.id, {
    category: req.query.category ? (String(req.query.category) as "SOCIAL" | "INFRASTRUCTURE" | "CONTEXTUAL") : undefined,
    riskSeverity: req.query.riskSeverity
      ? (String(req.query.riskSeverity) as "low" | "medium" | "high" | "critical")
      : undefined,
    sourceProvider: req.query.sourceProvider ? String(req.query.sourceProvider) : undefined,
    minConfidence: req.query.minConfidence ? Number(req.query.minConfidence) : undefined
  });
  if (!result) {
    throw notFoundError("Search run not found", { id });
  }
  sendSuccess(res, result, {}, 200);
};

export const listSearchSources = async (_req: Request, res: Response): Promise<void> => {
  const adapters = listAdapterCatalog();
  const grouped = groupBy(adapters, (item) => item.category);

  const byCategory = Object.fromEntries(
    Array.from(grouped).map(([category, items]) => [category, items.map((item) => item.provider)])
  );

  sendSuccess(
    res,
    {
      all: adapters,
      byCategory
    },
    { total: adapters.length },
    200
  );
};

export const getDiscoveryFeed = async (_req: Request, res: Response): Promise<void> => {
  const findings = await fetchDiscoveryFeed();
  sendSuccess(res, findings.map(formatFindingForFeed), { total: findings.length }, 200);
};

export const omniSearch = async (req: Request, res: Response): Promise<void> => {
  if (req.query.q) {
    return runSearch(req, res);
  }

  const adapters = listAdapterCatalog();
  const grouped = groupBy(adapters, (item) => item.category);
  
  const byCategory = Object.fromEntries(
    Array.from(grouped).map(([category, items]) => [category, items.map((item) => item.provider)])
  );

  const findings = await fetchDiscoveryFeed();

  return sendSuccess(
    res,
    {
      sources: { all: adapters, byCategory },
      feed: findings.map(formatFindingForFeed)
    },
    {},
    200
  );
};
