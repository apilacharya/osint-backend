const normalize = (value) => value.trim().toLowerCase();
const textIncludes = (value, tokens) => tokens.reduce((acc, token) => (value.includes(token) ? acc + 1 : acc), 0);
export const resolveEntityFindings = (query, findings, context) => {
    const queryToken = normalize(query);
    const aliasTokens = (context?.aliases ?? []).map(normalize).filter(Boolean);
    const location = context?.location ? normalize(context.location) : null;
    const industry = context?.industry ? normalize(context.industry) : null;
    const importantTokens = [queryToken, ...aliasTokens].filter(Boolean);
    return findings
        .map((finding) => {
        const merged = normalize(`${finding.title} ${finding.summary} ${JSON.stringify(finding.rawPayload)}`);
        const tokenHits = textIncludes(merged, importantTokens);
        const locationHit = location && merged.includes(location) ? 1 : 0;
        const industryHit = industry && merged.includes(industry) ? 1 : 0;
        const maxHits = Math.max(importantTokens.length, 1) + (location ? 1 : 0) + (industry ? 1 : 0);
        const score = (tokenHits + locationHit + industryHit) / maxHits;
        const resolutionScore = Math.max(0, Math.min(1, Number(score.toFixed(2))));
        return {
            ...finding,
            resolutionScore
        };
    })
        .filter((finding) => finding.resolutionScore >= 0.1);
};
