# OSINT Intelligence Backend

This backend orchestrates multi-source OSINT collection, performs entity resolution, and generates intelligence reports. It exposes REST APIs for search, history retrieval, and report generation.

---

## Tech Stack

- **Node.js + Express + TypeScript**
- **Prisma ORM** with PostgreSQL (Supabase)
- **REST API** with Zod validation
- **HTTP-standard error codes** (400, 404, 422, 429, 500, 502)

---

## Architecture

```
src/
  adapters/              # OSINT integrations (GitHub, crt.sh, Wikipedia)
  modules/               # Domain logic (auth, search, reports, entities)
  services/              # Cross-cutting (aggregation, resolution, scoring)
  middleware/            # Express middleware (errors, validation, auth)
  utils/                 # Shared utilities
  db/                    # Prisma configuration
  config/                # Constants & environment
```

**Key Services:**
- **Aggregation** - Runs all adapters in parallel, merges findings
- **Resolution** - Filters false positives using context (location, industry, aliases)
- **Scoring** - Assigns confidence (0–1) and risk severity per finding

---

## Setup

### Prerequisites
- Node.js 18+
- pnpm (or npm)
- PostgreSQL (Supabase recommended)

### Environment

Create `.env` in `backend/`:

```bash
DATABASE_URL=postgresql://user:pass@host/db
NODE_ENV=development
PORT=4000
FRONTEND_ORIGIN=http://localhost:5173
```

### Install and run

```bash
pnpm install
pnpm prisma generate
pnpm prisma migrate dev
pnpm dev
```

API default URL: `http://localhost:4000`

---

## API Endpoints

### Search
- `POST /api/search?q=query` — Run OSINT search
- `GET /api/search` — List search history
- `GET /api/search/:id` — Get search with findings
- `GET /api/search/sources` — List available adapters
- `GET /api/search/feed` — Discovery feed (trending intelligence)

### Reports
- `POST /api/reports` — Generate report (Markdown/PDF)
- `GET /api/reports` — List reports
- `GET /api/reports/:id` — Retrieve report

### Auth
- `POST /api/auth/register` — Register user
- `POST /api/auth/login` — Login user
- `POST /api/auth/logout` — Logout

---

## API Response Format

### Success
```json
{
  "success": true,
  "data": {},
  "meta": {},
  "error": null
}
```

### Error
```json
{
  "success": false,
  "data": null,
  "meta": {},
  "error": {
    "code": 400,
    "type": "VALIDATION_ERROR",
    "message": "Readable message",
    "details": {}
  }
}
```

### HTTP Error Codes

| Code | Type | Scenario |
|------|------|----------|
| 400 | VALIDATION_ERROR | Bad request parameters |
| 404 | RESOURCE_NOT_FOUND | Search/report not found |
| 422 | REPORT_GENERATION_FAILED | No findings to report |
| 429 | RATE_LIMIT_EXCEEDED | Too many requests |
| 500 | INTERNAL_SERVER_ERROR | Server error |
| 502 | ADAPTER_UPSTREAM_ERROR | Adapter request failed |

---

## Development Scripts

- `pnpm dev` — Start dev server with hot reload
- `pnpm build` — TypeScript compilation
- `pnpm prisma generate` — Generate Prisma client
- `pnpm prisma migrate dev` — Create/apply database migrations

---

## Deployment

### Render (Backend) + Supabase (Database)

1. Create Render service (Node.js runtime)
2. Build: `pnpm install && pnpm build`
3. Start: `node dist/index.js`
4. Link `DATABASE_URL` from Supabase

### Environment on Render
```
NODE_ENV=production
DATABASE_URL=postgresql://...
FRONTEND_ORIGIN=https://your-frontend.com
```

---

## Project Structure

- **Adapters** — Modular OSINT sources (add new adapters here)
- **Modules** — Domain logic organized by feature
- **Services** — Shared orchestration logic
- **Middleware** — Request validation, error handling, auth
- **Utils** — Reusable helpers and discovery logic

All code uses TypeScript strict mode. Error handling is centralized in middleware.

---

## Notes

- Guest searches (no auth) return transient results (not persisted)
- Authenticated searches are saved to database
- All adapters run in parallel; single adapter failure doesn't block results
- Reports can be generated in Markdown or PDF format
