import { randomUUID } from "node:crypto";
import { githubSocialAdapter } from "../adapters/social/githubAdapter.js";
import { crtShInfrastructureAdapter } from "../adapters/infrastructure/crtshAdapter.js";
import { wikipediaContextualAdapter } from "../adapters/contextual/wikipediaAdapter.js";
import type { AdapterFinding } from "../services/aggregation/types.js";
import { scoreConfidence } from "../services/scoring/confidenceService.js";
import { evaluateRisk } from "../services/scoring/riskService.js";

const discoveryQueries = [
  { adapter: githubSocialAdapter, query: "developer" },
  { adapter: crtShInfrastructureAdapter, query: "google.com" },
  { adapter: wikipediaContextualAdapter, query: "technology" }
];

export const formatFindingForFeed = (finding: AdapterFinding) => {
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

export const fetchDiscoveryFeed = async () => {
  const settled = await Promise.allSettled(
    discoveryQueries.map((item) => item.adapter.search({ query: item.query, context: undefined }))
  );

  return settled.flatMap((result) => (result.status === "fulfilled" ? result.value : []));
};
