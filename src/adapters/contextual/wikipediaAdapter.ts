import { FindingCategory } from "@prisma/client";
import axios from "axios";
import { adapterError } from "../../middleware/errors.js";
import type { AdapterFinding, AdapterQuery, OsintAdapter } from "../../services/aggregation/types.js";

type WikipediaSearchResponse = {
  query: {
    search: Array<{
      pageid: number;
      title: string;
      snippet: string;
      timestamp: string;
    }>;
  };
};

const stripHtml = (value: string): string => value.replace(/<[^>]+>/g, "");

const provider = "wikipedia";
const category = FindingCategory.CONTEXTUAL;

const searchWikipedia = async (input: AdapterQuery): Promise<AdapterFinding[]> => {
  const url = new URL("https://en.wikipedia.org/w/api.php");
  url.searchParams.set("action", "query");
  url.searchParams.set("list", "search");
  url.searchParams.set("srsearch", input.query);
  url.searchParams.set("srlimit", "15");
  url.searchParams.set("format", "json");
  url.searchParams.set("utf8", "1");
  url.searchParams.set("origin", "*");

  try {
    const response = await axios.get<WikipediaSearchResponse>(url.toString(), {
      timeout: 10000,
      headers: { "User-Agent": "OSINT-Prototype/1.0 (+https://example.local)" }
    });
    const payload = response.data;
    return payload.query.search.map((item) => ({
      category,
      title: `Wikipedia reference: ${item.title}`,
      summary: stripHtml(item.snippet),
      sourceUrl: `https://en.wikipedia.org/?curid=${item.pageid}`,
      retrievalTimestamp: item.timestamp ? new Date(item.timestamp) : new Date(),
      confidenceSignals: {
        pageId: item.pageid
      },
      rawPayload: item as unknown as Record<string, unknown>,
      provider
    }));
  } catch (error) {
    const status = axios.isAxiosError(error) ? error.response?.status : undefined;
    throw adapterError("Wikipedia adapter request failed", {
      provider,
      status
    });
  }
};

export const wikipediaContextualAdapter: OsintAdapter = {
  provider,
  category,
  search: searchWikipedia
};
