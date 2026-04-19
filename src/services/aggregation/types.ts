import type { FindingCategory } from "@prisma/client";

export type SearchContext = {
  aliases?: string[];
  location?: string;
  industry?: string;
};

export type AdapterQuery = {
  query: string;
  context?: SearchContext;
};

export type AdapterFinding = {
  category: FindingCategory;
  title: string;
  summary: string;
  sourceUrl: string;
  retrievalTimestamp: Date;
  confidenceSignals: Record<string, unknown>;
  rawPayload: Record<string, unknown>;
  provider: string;
};

export interface OsintAdapter {
  provider: string;
  category: FindingCategory;
  search(input: AdapterQuery): Promise<AdapterFinding[]>;
}

export type ResolvedFinding = AdapterFinding & {
  resolutionScore: number;
};

