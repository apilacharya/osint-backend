import { FindingCategory } from "@prisma/client";
import axios from "axios";
import { adapterError } from "../../middleware/errors.js";
const provider = "dns-google";
const category = FindingCategory.INFRASTRUCTURE;
const normalizeDomainCandidate = (query) => {
    const normalized = query.trim().toLowerCase().replace(/[^a-z0-9.-]/g, "");
    if (normalized.includes(".")) {
        return normalized;
    }
    return `${normalized}.com`;
};
const searchCertificates = async (input) => {
    const domain = normalizeDomainCandidate(input.query);
    const url = new URL("https://dns.google/resolve");
    url.searchParams.set("name", domain);
    url.searchParams.set("type", "A");
    try {
        const response = await axios.get(url.toString(), {
            timeout: 10000,
            headers: { "User-Agent": "OSINT-Prototype/1.0 (+https://example.local)" }
        });
        const payload = response.data;
        const answers = (payload.Answer ?? []).slice(0, 15);
        return answers.map((item) => ({
            category,
            title: `DNS A record: ${item.name}`,
            summary: `Resolved IP ${item.data} (TTL ${item.TTL}).`,
            sourceUrl: url.toString(),
            retrievalTimestamp: new Date(),
            confidenceSignals: {
                domain,
                recordType: "A",
                ttl: item.TTL
            },
            rawPayload: item,
            provider
        }));
    }
    catch (error) {
        const status = axios.isAxiosError(error) ? error.response?.status : undefined;
        throw adapterError("DNS adapter request failed", {
            provider,
            status
        });
    }
};
export const crtShInfrastructureAdapter = {
    provider,
    category,
    search: searchCertificates
};
