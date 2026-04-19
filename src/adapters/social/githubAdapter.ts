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

const axiosInstance = axios.create({
  timeout: 8000
});

if (env.GITHUB_TOKEN) {
  axiosInstance.defaults.headers.common.Authorization = `Bearer ${env.GITHUB_TOKEN}`;
}

const searchGithubProfiles = async (input: AdapterQuery): Promise<AdapterFinding[]> => {
  const url = new URL("https://api.github.com/search/users");
  url.searchParams.set("q", input.query);
  url.searchParams.set("per_page", "10");
  url.searchParams.set("sort", "followers");
  url.searchParams.set("order", "desc");

  try {
    const response = await axiosInstance.get<GithubSearchResponse>(url.toString(), {
      headers: {
        Accept: "application/vnd.github.v3+json",
        "User-Agent": "OSINT-Prototype/1.0"
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
