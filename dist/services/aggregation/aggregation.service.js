import { githubSocialAdapter } from "../../adapters/social/github.adapter.js";
import { crtShInfrastructureAdapter } from "../../adapters/infrastructure/crtsh.adapter.js";
import { wikipediaContextualAdapter } from "../../adapters/contextual/wikipedia.adapter.js";
import { adapterError } from "../../middleware/errors.js";
const adapters = [githubSocialAdapter, crtShInfrastructureAdapter, wikipediaContextualAdapter];
export const listAdapterCatalog = () => adapters.map((adapter) => ({
    provider: adapter.provider,
    category: adapter.category
}));
export const collectFindings = async (query, context) => {
    const settled = await Promise.allSettled(adapters.map((adapter) => adapter.search({ query, context })));
    const findings = [];
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
