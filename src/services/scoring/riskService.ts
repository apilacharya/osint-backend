import type { RiskSeverity } from "@prisma/client";
import type { ResolvedFinding } from "../aggregation/types.js";

type RiskAssessmentResult = {
  score: number;
  severity: RiskSeverity;
  rationale: string;
};

const riskTerms: Array<{ term: string; weight: number }> = [
  { term: "breach", weight: 35 },
  { term: "fraud", weight: 40 },
  { term: "sanction", weight: 45 },
  { term: "lawsuit", weight: 25 },
  { term: "investigation", weight: 30 },
  { term: "violation", weight: 30 }
];

const inferSeverity = (score: number): RiskSeverity => {
  if (score >= 80) return "critical";
  if (score >= 60) return "high";
  if (score >= 35) return "medium";
  return "low";
};

export const evaluateRisk = (finding: ResolvedFinding, confidence: number): RiskAssessmentResult => {
  const haystack = `${finding.title} ${finding.summary}`.toLowerCase();
  const keywordScore = riskTerms.reduce((acc, item) => (haystack.includes(item.term) ? acc + item.weight : acc), 0);
  const score = Math.min(100, Math.round(keywordScore + confidence * 40));
  const severity = inferSeverity(score);
  const rationale =
    keywordScore > 0
      ? `Risk terms detected in source content with confidence ${confidence}.`
      : `No high-risk keywords detected; severity reflects confidence only (${confidence}).`;

  return { score, severity, rationale };
};
