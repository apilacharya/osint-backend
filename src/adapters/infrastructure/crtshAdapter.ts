import { FindingCategory } from "@prisma/client";
import axios from "axios";
import { adapterError } from "../../middleware/errors.js";
import type { AdapterFinding, AdapterQuery, OsintAdapter } from "../../services/aggregation/types.js";

type DnsResolveAnswer = {
  name: string;
  type: number;
  TTL: number;
  data: string;
};

type DnsResolveResponse = {
  Status: number;
  Answer?: DnsResolveAnswer[];
};

const provider = "dns-google";
const category = FindingCategory.INFRASTRUCTURE;

const axiosInstance = axios.create({
  timeout: 5000
});

const normalizeDomainCandidate = (query: string): string => {
  const normalized = query.trim().toLowerCase().replace(/[^a-z0-9.-]/g, "");
  if (normalized.includes(".")) {
    return normalized;
  }
  return `${normalized}.com`;
};

const searchCertificates = async (input: AdapterQuery): Promise<AdapterFinding[]> => {
  const domain = normalizeDomainCandidate(input.query);
  const url = new URL("https://dns.google/resolve");
  url.searchParams.set("name", domain);
  url.searchParams.set("type", "A");

  try {
    const response = await axiosInstance.get<DnsResolveResponse>(url.toString(), {
      headers: { 
        "User-Agent": "OSINT-Prototype/1.0"
      }
    });

    const payload = response.data;
    const answers = (payload.Answer ?? []).slice(0, 10);

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
      rawPayload: item as unknown as Record<string, unknown>,
      provider
    }));
  } catch (error) {
    const status = axios.isAxiosError(error) ? error.response?.status : undefined;
    throw adapterError("DNS adapter request failed", {
      provider,
      status
    });
  }
};

export const crtShInfrastructureAdapter: OsintAdapter = {
  provider,
  category,
  search: searchCertificates
};
