# Swagger2MCP Development Guide

## Project Overview
Swagger2MCP generates Model Context Protocol (MCP) servers from OpenAPI/Swagger schemas. The system uses a microservices architecture with separate frontend, backend API, background worker, Redis queue, and PostgreSQL database - all orchestrated via Docker Compose.

## Architecture & Data Flow

### Service Boundaries
- **Frontend** (React/Vite on :5173): User interface for uploads and crawling
- **Backend** (Express on :3000): REST API that enqueues jobs and serves data
- **Worker** (BullMQ): Processes background jobs (file uploads, web crawls)
- **Redis** (:6379): Job queue storage with BullMQ
- **PostgreSQL** (:5432): Stores sessions and schema metadata (not the generated code)

### Critical Flow: Upload → Process → Generate
1. User uploads file → `POST /api/upload` → Multer saves to `backend/uploads/`
2. Backend adds `UPLOAD` job to Redis queue via BullMQ
3. **Separate worker process** (`worker.ts`) consumes job, validates OpenAPI spec, saves to PostgreSQL
4. User clicks "Generate" → `POST /api/generate` → reads schema from DB, generates TypeScript MCP server code in-memory, returns ZIP
5. Optionally exports to GitHub using Octokit to create repo/commit

**Key insight**: The worker is NOT a request handler - it's a standalone process (`npm run worker`) that must run separately. Backend and worker share the same codebase but execute different entry points (`server.ts` vs `worker.ts`).

## Development Workflows

### Local Development Setup
```bash
# Start infrastructure only
docker-compose up redis postgres

# Terminal 1: Backend API
cd backend
npm run dev        # ts-node-dev with hot reload

# Terminal 2: Worker (CRITICAL - often forgotten!)
cd backend
npm run worker     # Separate process required

# Terminal 3: Frontend
cd frontend
npm run dev
```

### Docker Development (Recommended)
```bash
# Full stack with volume mounts for hot reload
docker-compose up --build

# View worker logs separately (common debugging need)
docker-compose logs -f worker
```

### Database Migrations
```bash
cd backend
npx prisma migrate dev --name <description>
npx prisma generate  # Run after schema changes
```

## Project-Specific Patterns

### Session Management
- **No user authentication** - uses anonymous UUIDs stored in `localStorage`
- Frontend generates session ID on first visit: `crypto.randomUUID()`
- Session ID is passed in request bodies (not headers/cookies)
- All schemas are tied to sessions via Prisma relations

### Job Queue Architecture
- BullMQ jobs defined in `backend/src/types/jobs.ts` with discriminated union: `type: 'UPLOAD' | 'CRAWL'`
- Job progress updates: `await job.updateProgress(percentage)` in worker
- **No WebSocket** for real-time updates - frontend polls `/api/schemas` after job creation
- Job failures throw errors; BullMQ handles retries automatically

### Code Generation Strategy
- Generator lives in `backend/src/services/generator.service.ts`
- Creates in-memory JSZip with package.json, tsconfig.json, src/index.ts
- **No file templates** - generates code as strings programmatically
- TypeScript only; Python marked as "not implemented yet"
- Extracts tools from `paths` object, each operation becomes an MCP tool
- Uses `@modelcontextprotocol/sdk` v0.6.0 with `Server` and `StdioServerTransport`

### Web Crawler Heuristics
- `CrawlerService` uses recursive depth-first crawl with `maxDepth`
- Prioritizes links containing 'swagger', 'openapi', 'api-docs', or `.json`/`.yaml`
- Only follows same-domain links to prevent explosion
- Validates fetched JSON has `swagger` or `openapi` property before saving
- No authentication/headers - public URLs only

### File Upload Handling
- Multer stores uploads in `backend/uploads/` with unique names: `timestamp-random-originalname`
- Worker reads file synchronously with `fs.readFileSync(filePath)` then validates
- **Cleanup not implemented** - uploaded files persist indefinitely
- Accepts JSON only; YAML parsing not implemented

## Integration Points

### External Dependencies
- **Octokit**: GitHub API client for repo creation/commits (uses personal access tokens)
- **Axios**: HTTP client for crawling and GitHub operations
- **Cheerio**: HTML parsing for link extraction during crawls
- **Prisma**: ORM with migrations in `backend/prisma/`

### Environment Variables
Backend requires:
```bash
PORT=3000
REDIS_HOST=redis  # Docker service name
REDIS_PORT=6379
DATABASE_URL=postgresql://postgres:postgres@postgres:5432/swagger2mcp
```

Frontend:
```bash
VITE_API_URL=http://localhost:3000  # Note: /api suffix added in client
```

### Cross-Service Communication
- Frontend talks to backend API only (no direct DB access)
- Backend and worker share Prisma client (`prisma` singleton from `lib/db.ts`)
- Worker and backend share Redis connection (`connection` from `lib/queue.ts`)
- **IORedis config requires** `maxRetriesPerRequest: null` for BullMQ compatibility

## Common Gotchas

1. **Worker not running**: Jobs sit in queue forever. Check `docker-compose logs worker` or run `npm run worker` locally.
2. **Prisma not generated**: Run `npx prisma generate` after pulling schema changes or `npm install`.
3. **CORS issues**: Backend enables CORS for all origins (`cors()` with no options).
4. **Session mismatch**: Frontend localStorage and backend DB must share same UUID - test incognito to simulate new sessions.
5. **GitHub export**: Personal access token needs `repo` scope; fails silently if permissions insufficient.
6. **Multer file paths**: Use `req.file.path` (absolute) not `req.file.filename` in job payloads.

## Key Files & Responsibilities

- `backend/src/server.ts`: Express app entry point (API only)
- `backend/src/worker.ts`: Job processor entry point (runs separately)
- `backend/src/routes/api.ts`: All HTTP endpoints, multer config
- `backend/src/services/generator.service.ts`: MCP code generation logic
- `backend/src/services/crawler.service.ts`: Web crawling with depth limits
- `backend/src/lib/queue.ts`: BullMQ queue/connection singletons
- `frontend/src/lib/api.ts`: Axios client + session ID management
- `backend/prisma/schema.prisma`: Database schema (Session → Schema 1:N relation)

## Testing Notes
- No automated tests present in codebase
- Test crawling with `sample-petstore.json` included in root
- Use Petstore URLs like `https://petstore.swagger.io/v2/swagger.json` for crawl testing
- Generated MCP servers can be tested with `npx @modelcontextprotocol/inspector`

## Browser Testing with Chrome DevTools MCP

Use Chrome DevTools MCP for browser automation and testing. This provides direct browser control through Chrome DevTools Protocol.

### Available Testing Tools
- **Navigation**: `mcp_io_github_chr_*` tools for page navigation and interaction
- **Snapshots**: Take screenshots and accessibility snapshots for verification
- **Form Input**: Fill forms, click elements, and interact with UI
- **Console**: Monitor console messages and errors
- **Network**: Inspect network requests and responses
- **Performance**: Record and analyze performance traces

### Testing Workflow
1. Navigate to page: Use navigation tools to open URLs (e.g., `http://localhost:5173`)
2. Take snapshot: Get accessibility snapshot to understand page structure and element refs
3. Interact: Use `click`, `fill`, `fill_form` tools with element UIDs from snapshot
4. Verify: Take screenshots or check console messages for validation
5. Wait: Use `wait_for` to wait for text/elements to appear

### Common Testing Patterns
```
# Login Flow Testing
1. Navigate to /login
2. Take snapshot to get form element UIDs
3. Fill email and password using mcp_io_github_chr_fill or mcp_io_github_chr_fill_form
4. Click submit button using mcp_io_github_chr_click
5. Wait for navigation/redirect
6. Take screenshot to verify logged-in state

# Admin Access Verification
1. Login as admin user (admin@test.com / adminpass123)
2. Check navbar for "Admin" link with admin badge
3. Navigate to /admin and verify access
4. Test admin-only features
```

### Test Users
- **Admin**: admin@test.com / adminpass123 (role: admin)
- **Regular**: Create via /register for standard user testing
