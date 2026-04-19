import { FindingCategory } from "@prisma/client";
import type { ResolvedFinding } from "../aggregation/types.js";

const baseByCategory: Record<FindingCategory, number> = {
  [FindingCategory.SOCIAL]: 0.68,
  [FindingCategory.INFRASTRUCTURE]: 0.74,
  [FindingCategory.CONTEXTUAL]: 0.58
};

const clamp = (value: number, min: number, max: number): number => Math.min(max, Math.max(min, value));

export const scoreConfidence = (finding: ResolvedFinding): number => {
  const base = baseByCategory[finding.category];
  const score = base * 0.55 + finding.resolutionScore * 0.45;
  return Number(clamp(score, 0, 1).toFixed(2));
};
