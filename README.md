# OSINT Intelligence Backend

A modular Node.js/Express backend service that aggregates open-source intelligence from multiple adapters, performs entity resolution, and generates intelligence reports.

## Features

- **Multi-adapter architecture** - Extensible OSINT data collection (Social, Infrastructure, Contextual)
- **Entity resolution** - Intelligent filtering and disambiguation of findings
- **Confidence scoring** - Quantified trust scores for each finding
- **Risk assessment** - Severity classification for discovered intelligence
- **Report generation** - Export findings as Markdown or PDF
- **Search history** - Persistent storage of all searches and findings (with authentication)
- **Guest mode** - Temporary searches without database persistence
- **HTTP error codes** - Standard REST error responses (400, 404, 422, 429, 500, 502)

## Architecture

```
src/
  app/              # Express app initialization
  adapters/         # OSINT source integrations
    social/         # GitHub, LinkedIn, social profiles
    infrastructure/ # DNS, SSL certificates, domain records
    contextual/     # Wikipedia, public records, news
  modules/          # Domain-driven modules
    auth/           # User authentication
    search/         # Search orchestration
    entities/       # Entity management
    findings/       # Finding metadata
    reports/        # Report generation
  services/         # Cross-cutting services
    aggregation/    # Adapter orchestration
    resolution/     # Entity matching & validation
    scoring/        # Confidence & risk evaluation
  middleware/       # Express middleware
    errors.ts       # Error handling & factory
    http.ts         # Response formatting
    validation.ts   # Input validation
  utils/            # Shared utilities
  db/              # Database configuration (Prisma)
  config/          # Environment & constants
```

## Quick Start

### Requirements
- Node.js 18+
- pnpm (or npm/yarn)
- PostgreSQL (via Supabase)

### Setup

```bash
# Install dependencies
pnpm install

# Configure environment
cp .env.example .env.local
# Update .env.local with your Supabase connection

# Initialize database
npx prisma generate
npx prisma migrate dev

# Build TypeScript
pnpm run build

# Start server
pnpm run dev
```

Server runs on `http://localhost:3001` by default.

## Environment Variables

```env
NODE_ENV=development
PORT=3001

# Database (Supabase PostgreSQL)
DATABASE_URL=postgresql://user:password@host:5432/osint_db

# CORS configuration
FRONTEND_ORIGIN=http://localhost:5173

# Adapter API keys (optional, some adapters work without)
GITHUB_TOKEN=your_github_token_here
```

For production (Render):
```env
NODE_ENV=production
PORT=3001
FRONTEND_ORIGIN=https://your-frontend-domain.com
DATABASE_URL=postgresql://...from-supabase...
```

## API Reference

### Search Endpoints

#### `POST /api/search`
Initiate an OSINT search on a target.

**Query Parameters:**
- `q` (required) - Search query (person name, company, domain)
- `entityType` (optional) - `PERSON`, `COMPANY`, or `UNKNOWN` (default)
- `aliases` (optional) - Comma-separated aliases
- `location` (optional) - Geographic context (improves resolution)
- `industry` (optional) - Industry context

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "search-run-id",
    "status": "COMPLETED",
    "query": "john doe",
    "findingCount": 24,
    "findings": [
      {
        "id": "finding-1",
        "category": "SOCIAL",
        "title": "GitHub Profile",
        "summary": "Active developer with multiple repositories",
        "confidence": 0.92,
        "source": {
          "provider": "github",
          "url": "https://github.com/johndoe"
        },
        "retrievedAt": "2024-01-15T10:30:00Z"
      }
    ]
  },
  "meta": {},
  "error": null
}
```

**Error (400 - Validation):**
```json
{
  "success": false,
  "data": null,
  "meta": {},
  "error": {
    "code": 400,
    "type": "VALIDATION_ERROR",
    "message": "Query must be 2-200 characters",
    "details": {
      "issues": [{ "path": ["q"], "message": "Too short" }]
    }
  }
}
```

#### `GET /api/search`
List search history.

**Query Parameters:**
- `query` (optional) - Filter by search text
- `status` (optional) - `RUNNING`, `COMPLETED`, `FAILED`
- `entityType` (optional) - Filter by entity type

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "search-123",
      "query": "acme corporation",
      "status": "COMPLETED",
      "entityType": "COMPANY",
      "startedAt": "2024-01-15T10:00:00Z",
      "completedAt": "2024-01-15T10:05:00Z",
      "_count": {
        "findings": 18,
        "reports": 2
      }
    }
  ],
  "meta": {},
  "error": null
}
```

#### `GET /api/search/:id`
Retrieve a specific search with findings.

**Query Parameters:**
- `category` (optional) - Filter by category: `SOCIAL`, `INFRASTRUCTURE`, `CONTEXTUAL`
- `riskSeverity` (optional) - `low`, `medium`, `high`, `critical`
- `sourceProvider` (optional) - Filter by adapter (github, crtsh, wikipedia)
- `minConfidence` (optional) - Filter by minimum confidence (0.0-1.0)

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "search-123",
    "query": "example.com",
    "entity": {
      "id": "entity-456",
      "name": "example.com",
      "type": "COMPANY"
    },
    "findings": [
      {
        "id": "f-1",
        "category": "INFRASTRUCTURE",
        "title": "SSL Certificate",
        "confidence": 0.98,
        "riskAssessment": {
          "severity": "low",
          "score": 0.2
        }
      }
    ]
  },
  "meta": {},
  "error": null
}
```

### Adapter Endpoints

#### `GET /api/search/sources`
List all available OSINT adapters.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "all": [
      { "provider": "github", "category": "SOCIAL" },
      { "provider": "crtsh", "category": "INFRASTRUCTURE" },
      { "provider": "wikipedia", "category": "CONTEXTUAL" }
    ],
    "byCategory": {
      "SOCIAL": ["github"],
      "INFRASTRUCTURE": ["crtsh"],
      "CONTEXTUAL": ["wikipedia"]
    }
  },
  "meta": { "total": 3 },
  "error": null
}
```

#### `GET /api/search/feed`
Get a discovery feed with trending intelligence.

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "feed-finding-1",
      "category": "SOCIAL",
      "title": "Trending Developer",
      "summary": "...",
      "confidence": 0.87,
      "source": {
        "provider": "github",
        "url": "https://..."
      }
    }
  ],
  "meta": { "total": 12 },
  "error": null
}
```

#### `GET /api/search?q=query` (Omni)
Combined endpoint: returns both sources and feed in one request.

### Report Endpoints

#### `POST /api/reports`
Generate a report from search findings.

**Body:**
```json
{
  "searchRunId": "search-123",
  "format": "markdown"
}
```

Format: `markdown` or `pdf`

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "report-789",
    "searchRunId": "search-123",
    "format": "MARKDOWN",
    "fileName": "osint-report-search-123.md",
    "content": "# OSINT Report: example.com\n...",
    "createdAt": "2024-01-15T10:30:00Z"
  },
  "meta": {},
  "error": null
}
```

**Error (422 - No Findings):**
```json
{
  "success": false,
  "data": null,
  "meta": {},
  "error": {
    "code": 422,
    "type": "REPORT_GENERATION_FAILED",
    "message": "Cannot generate report without findings"
  }
}
```

#### `GET /api/reports/:id`
Retrieve a generated report.

#### `GET /api/reports`
List reports for the authenticated user.

**Query Parameters:**
- `searchRunId` (optional) - Filter by search
- `format` (optional) - `MARKDOWN` or `PDF`

## HTTP Error Codes

All errors follow REST standards. The `code` field matches HTTP status codes.

| Code | Type | Description | Scenario |
|------|------|-------------|----------|
| 400 | VALIDATION_ERROR | Request validation failed | Invalid query parameters or body |
| 404 | RESOURCE_NOT_FOUND | Search/Report not found | Unknown search ID or missing report |
| 422 | REPORT_GENERATION_FAILED | Report generation failed | No findings to report, PDF render error |
| 429 | RATE_LIMIT_EXCEEDED | Rate limit exceeded | Too many requests |
| 500 | INTERNAL_SERVER_ERROR | Server error | Unexpected error during processing |
| 502 | ADAPTER_UPSTREAM_ERROR | Adapter request failed | All adapters failed or timeout |

## Adapter Development

### Creating a Custom Adapter

Adapters must implement the `OsintAdapter` interface:

```typescript
import type { OsintAdapter, AdapterFinding, SearchContext } from "../aggregation/types.js";

export const customAdapter: OsintAdapter = {
  provider: "customsource",
  category: "SOCIAL",

  async search(input: { query: string; context?: SearchContext }): Promise<AdapterFinding[]> {
    const url = new URL("https://api.example.com/search");
    url.searchParams.set("q", input.query);

    const res = await fetch(url);
    if (!res.ok) throw new Error(`API error: ${res.status}`);

    const data = await res.json();
    
    return data.results.map((item: any) => ({
      category: "SOCIAL",
      provider: "customsource",
      title: item.title,
      summary: item.description,
      sourceUrl: item.url,
      retrievalTimestamp: new Date(),
      confidenceSignals: {
        urlMatch: item.title.includes(input.query) ? 0.9 : 0.5,
        textMatch: 0.7
      },
      rawPayload: item
    }));
  }
};
```

### Adapter Requirements

1. **Provider name** - Unique identifier (e.g., "github", "crtsh")
2. **Category** - `SOCIAL`, `INFRASTRUCTURE`, or `CONTEXTUAL`
3. **Search method** - Async function returning `AdapterFinding[]`
4. **Confidence signals** - Include numeric scores for each finding
5. **Error handling** - Throw `Error` on upstream failure; aggregation catches it

### Registering an Adapter

Add to `aggregationService.ts`:

```typescript
import { customAdapter } from "../../adapters/social/customAdapter.js";

const adapters: OsintAdapter[] = [
  githubSocialAdapter,
  crtShInfrastructureAdapter,
  wikipediaContextualAdapter,
  customAdapter // Add here
];
```

## Services Overview

### Aggregation Service
Orchestrates all adapters and collects findings. Uses `Promise.allSettled()` to handle partial failures gracefully.

**Key Functions:**
- `collectFindings(query, context)` - Run all adapters, merge results
- `listAdapterCatalog()` - Return available adapters

### Resolution Service
Validates and filters findings to remove false positives.

**Key Functions:**
- `resolveEntityFindings(query, findings, context)` - Filter and score findings
- Uses location, industry, and alias context for disambiguation

### Scoring Service
Quantifies trust and risk for each finding.

**Confidence Scoring (`scoreConfidence`):**
- URL/text/source matches
- Domain age, entity correlation
- Result: 0.0 (untrustworthy) to 1.0 (highly trustworthy)

**Risk Evaluation (`evaluateRisk`):**
- Severity classification: `low | medium | high | critical`
- Risk score: 0.0-1.0
- Rationale: Readable explanation

## Testing

```bash
# Unit tests (TypeScript compile check)
pnpm run build

# Manual API testing
curl -X POST "http://localhost:3001/api/search?q=john+doe&entityType=PERSON"
curl -X GET "http://localhost:3001/api/search"
curl -X GET "http://localhost:3001/api/search/sources"
```

## Performance Considerations

- **Parallel adapter execution** - All adapters run concurrently via `Promise.allSettled()`
- **Partial failure tolerance** - Single adapter failure doesn't block the search
- **Database indexing** - Searches indexed on query + entityType for fast retrieval
- **Finding deduplication** - Resolution service removes duplicate/near-duplicate findings
- **Lazy loading** - Reports only generated on demand

## Deployment

### Render Deployment

1. Create a Render service (Node.js)
2. Set build command: `pnpm install && pnpm run build`
3. Set start command: `node dist/index.js`
4. Add environment variables from `.env.local`
5. Link Supabase PostgreSQL via `DATABASE_URL`

### Database Migrations

```bash
# Create migration locally
npx prisma migrate dev --name "add_new_field"

# Apply in production (automated by Prisma)
npx prisma migrate deploy
```

## Troubleshooting

**Search hangs**
- Check adapter timeouts (usually 10s)
- Verify network connectivity to upstream services
- Check logs for `ADAPTER_UPSTREAM_ERROR`

**Report generation fails**
- Ensure findings exist (`Error: 422`)
- Check PDF generation with small report first
- Verify `node_modules/pdfkit` is installed

**Database connection errors**
- Verify `DATABASE_URL` format: `postgresql://user:pass@host/db`
- Check Supabase IP whitelist (should allow all for Render)
- Test connection: `psql $DATABASE_URL -c "SELECT 1"`

**CORS errors**
- Verify `FRONTEND_ORIGIN` matches deployed frontend domain
- Middleware checks origin on all endpoints except `/api/search/feed`

## Contributing

- Follow TypeScript strict mode
- Extract utilities to `utils/` if used in multiple modules
- Add error details to thrown `AppError` instances
- Test adapters with example queries before merge

## License

See root repository LICENSE file.
