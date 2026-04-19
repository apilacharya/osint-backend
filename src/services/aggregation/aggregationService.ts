import { githubSocialAdapter } from "../../adapters/social/githubAdapter.js";
import { crtShInfrastructureAdapter } from "../../adapters/infrastructure/crtshAdapter.js";
import { wikipediaContextualAdapter } from "../../adapters/contextual/wikipediaAdapter.js";
import type { AdapterFinding, OsintAdapter, SearchContext } from "./types.js";
import { adapterError } from "../../middleware/errors.js";

const adapters: OsintAdapter[] = [githubSocialAdapter, crtShInfrastructureAdapter, wikipediaContextualAdapter];

export const listAdapterCatalog = () =>
  adapters.map((adapter) => ({
    provider: adapter.provider,
    category: adapter.category
  }));

export const collectFindings = async (
  query: string,
  context: SearchContext | undefined
): Promise<AdapterFinding[]> => {
  const settled = await Promise.allSettled(adapters.map((adapter) => adapter.search({ query, context })));
  const findings: AdapterFinding[] = [];
  let failedCount = 0;

  for (const result of settled) {
    if (result.status === "fulfilled") {
      findings.push(...result.value);
      continue;
    }
    failedCount += 1;
  }

  if (findings.length > 0) {
    return findings;
  }

  throw adapterError("All adapter upstream requests failed", {
    failedAdapters: failedCount
  });
};
