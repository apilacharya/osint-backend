import { Prisma, SearchStatus } from "@prisma/client";
import { randomUUID } from "node:crypto";
import { prisma } from "../../db/prisma.js";
import { entityResolutionError } from "../../middleware/errors.js";
import { collectFindings } from "../../services/aggregation/aggregationService.js";
import type { SearchContext } from "../../services/aggregation/types.js";
import { resolveEntityFindings } from "../../services/resolution/entityResolutionService.js";
import { scoreConfidence } from "../../services/scoring/confidenceService.js";
import { evaluateRisk } from "../../services/scoring/riskService.js";
import { upsertEntity } from "../entities/entityService.js";

type RunSearchInput = {
  query: string;
  entityType?: "PERSON" | "COMPANY" | "UNKNOWN";
  context?: SearchContext;
};

const getProcessedFindings = async (input: RunSearchInput) => {
  const collected = await collectFindings(input.query, input.context);
  const resolved = resolveEntityFindings(input.query, collected, input.context);

  if (resolved.length === 0) {
    throw entityResolutionError("Entity resolution removed all findings", {
      query: input.query
    });
  }

  return resolved.map((finding) => {
    const confidence = scoreConfidence(finding);
    const risk = evaluateRisk(finding, confidence);
    return {
      finding,
      confidence,
      risk
    };
  });
};

export const runAuthenticatedSearch = async (input: RunSearchInput, userId: string) => {
  const entity = await upsertEntity({
    name: input.query,
    type: input.entityType,
    context: input.context
  });

  const searchRun = await prisma.searchRun.create({
    data: {
      query: input.query,
      queryContext: (input.context ?? {}) as Prisma.InputJsonValue,
      status: SearchStatus.RUNNING,
      entityId: entity.id,
      userId
    }
  });

  try {
    const processedFindings = await getProcessedFindings(input);

    const persistedFindings = [];
    for (const item of processedFindings) {
      const source = await prisma.findingSource.upsert({
        where: {
          provider_url: {
            provider: item.finding.provider,
            url: item.finding.sourceUrl
          }
        },
        update: {
          retrievedAt: item.finding.retrievalTimestamp
        },
        create: {
          provider: item.finding.provider,
          url: item.finding.sourceUrl,
          retrievedAt: item.finding.retrievalTimestamp
        }
      });

      const savedFinding = await prisma.finding.create({
        data: {
          category: item.finding.category,
          title: item.finding.title,
          summary: item.finding.summary,
          confidence: item.confidence,
          confidenceSignals: {
            ...item.finding.confidenceSignals,
            resolutionScore: item.finding.resolutionScore
          },
          rawPayload: item.finding.rawPayload as Prisma.InputJsonValue,
          retrievedAt: item.finding.retrievalTimestamp,
          sourceId: source.id,
          entityId: entity.id,
          searchRunId: searchRun.id,
          riskAssessment: {
            create: {
              severity: item.risk.severity,
              score: item.risk.score,
              rationale: item.risk.rationale
            }
          }
        },
        include: {
          source: true,
          riskAssessment: true
        }
      });

      persistedFindings.push(savedFinding);
    }

    await prisma.searchRun.update({
      where: { id: searchRun.id },
      data: {
        status: SearchStatus.COMPLETED,
        completedAt: new Date()
      }
    });

    return {
      id: searchRun.id,
      status: SearchStatus.COMPLETED,
      persisted: true,
      query: searchRun.query,
      startedAt: searchRun.startedAt,
      completedAt: new Date(),
      entity,
      findingCount: persistedFindings.length,
      findings: persistedFindings
    };
  } catch (error) {
    await prisma.searchRun.update({
      where: { id: searchRun.id },
      data: {
        status: SearchStatus.FAILED,
        completedAt: new Date()
      }
    });

    throw error;
  }
};

export const runGuestSearch = async (input: RunSearchInput) => {
  const now = new Date();
  const runId = `guest-${randomUUID()}`;
  const entityId = `guest-entity-${randomUUID()}`;
  const processedFindings = await getProcessedFindings({
    ...input
  });

  const findings = processedFindings.map((item) => {
    const findingId = `guest-finding-${randomUUID()}`;
    const sourceId = `guest-source-${randomUUID()}`;
    return {
      id: findingId,
      category: item.finding.category,
      title: item.finding.title,
      summary: item.finding.summary,
      confidence: item.confidence,
      confidenceSignals: {
        ...item.finding.confidenceSignals,
        resolutionScore: item.finding.resolutionScore
      },
      rawPayload: item.finding.rawPayload,
      retrievedAt: item.finding.retrievalTimestamp,
      entityId,
      searchRunId: runId,
      sourceId,
      source: {
        id: sourceId,
        provider: item.finding.provider,
        url: item.finding.sourceUrl,
        retrievedAt: item.finding.retrievalTimestamp
      },
      riskAssessment: {
        id: `guest-risk-${randomUUID()}`,
        findingId,
        severity: item.risk.severity,
        score: item.risk.score,
        rationale: item.risk.rationale,
        createdAt: now
      }
    };
  });

  return {
    id: runId,
    status: SearchStatus.COMPLETED,
    persisted: false,
    query: input.query,
    startedAt: now,
    completedAt: now,
    entity: {
      id: entityId,
      name: input.query,
      normalizedName: input.query.trim().toLowerCase(),
      type: input.entityType ?? "UNKNOWN",
      aliases: input.context?.aliases ?? [],
      location: input.context?.location ?? null,
      industry: input.context?.industry ?? null,
      createdAt: now,
      updatedAt: now
    },
    findingCount: findings.length,
    findings
  };
};

type SearchRunListFilters = {
  query?: string;
  status?: SearchStatus;
  entityType?: "PERSON" | "COMPANY" | "UNKNOWN";
};

export const listSearchRuns = async (filters: SearchRunListFilters, userId: string) => {
  const where: Prisma.SearchRunWhereInput = {
    userId,
    ...(filters.query
      ? {
          query: {
            contains: filters.query,
            mode: "insensitive"
          }
        }
      : {}),
    ...(filters.status ? { status: filters.status } : {}),
    ...(filters.entityType ? { entity: { type: filters.entityType } } : {})
  };

  const items = await prisma.searchRun.findMany({
    where,
    orderBy: { startedAt: "desc" },
    include: {
      entity: true,
      _count: {
        select: { findings: true, reports: true }
      }
    }
  });

  return { items };
};

type SearchRunDetailFilters = {
  category?: "SOCIAL" | "INFRASTRUCTURE" | "CONTEXTUAL";
  riskSeverity?: "low" | "medium" | "high" | "critical";
  sourceProvider?: string;
  minConfidence?: number;
};

export const getSearchRunById = async (id: string, userId: string, filters: SearchRunDetailFilters) => {
  const run = await prisma.searchRun.findFirst({
    where: { id, userId },
    include: {
      entity: true,
      reports: {
        orderBy: { createdAt: "desc" }
      }
    }
  });

  if (!run) {
    return null;
  }

  const findingWhere: Prisma.FindingWhereInput = {
    searchRunId: id,
    ...(filters.category ? { category: filters.category } : {}),
    ...(filters.riskSeverity
      ? {
          riskAssessment: {
            is: {
              severity: filters.riskSeverity
            }
          }
        }
      : {}),
    ...(filters.sourceProvider
      ? {
          source: {
            provider: filters.sourceProvider
          }
        }
      : {}),
    ...(typeof filters.minConfidence === "number"
      ? {
          confidence: {
            gte: filters.minConfidence
          }
        }
      : {})
  };

  const findings = await prisma.finding.findMany({
    where: findingWhere,
    include: {
      source: true,
      riskAssessment: true
    },
    orderBy: { confidence: "desc" }
  });

  return {
    ...run,
    findings
  };
};
