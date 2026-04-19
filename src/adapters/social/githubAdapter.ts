import { FindingCategory } from "@prisma/client";
import axios from "axios";
import { env } from "../../config/env.js";
import { adapterError } from "../../middleware/errors.js";
import type { AdapterFinding, AdapterQuery, OsintAdapter } from "../../services/aggregation/types.js";

type GithubSearchResponse = {
  items: Array<{
    login: string;
    html_url: string;
    type: string;
    score: number;
  }>;
};

const provider = "github";
const category = FindingCategory.SOCIAL;

const searchGithubProfiles = async (input: AdapterQuery): Promise<AdapterFinding[]> => {
  const url = new URL("https://api.github.com/search/users");
  url.searchParams.set("q", input.query);
  url.searchParams.set("per_page", "15");

  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json"
  };
  if (env.GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${env.GITHUB_TOKEN}`;
  }

  try {
    const response = await axios.get<GithubSearchResponse>(url.toString(), {
      timeout: 10000,
      headers: {
        ...headers,
        "User-Agent": "OSINT-Prototype/1.0 (+https://example.local)"
      }
    });
    const timestamp = new Date();

    return response.data.items.map((item) => ({
      category,
      title: `GitHub profile: ${item.login}`,
      summary: `Public GitHub ${item.type.toLowerCase()} matched by query "${input.query}".`,
      sourceUrl: item.html_url,
      retrievalTimestamp: timestamp,
      confidenceSignals: {
        platform: "github",
        githubScore: item.score
      },
      rawPayload: item as Record<string, unknown>,
      provider
    }));
  } catch (error) {
    const status = axios.isAxiosError(error) ? error.response?.status : undefined;
    throw adapterError("GitHub adapter request failed", {
      provider,
      status
    });
  }
};

export const githubSocialAdapter: OsintAdapter = {
  provider,
  category,
  search: searchGithubProfiles
};
