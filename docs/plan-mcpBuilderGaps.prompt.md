# MCP Builder Implementation Plan

## TL;DR
The current Swagger2MCP implementation covers the core MVP flow (upload → process → generate → export to GitHub). This plan outlines 35+ missing features from the product spec, organized into prioritized phases.

---

## Current State Summary

### ✅ Implemented (42+ features)
- File upload with Multer + BullMQ queue
- JSON validation (swagger/openapi property check)
- **YAML support** (js-yaml parsing with auto-detection) ✅ *Completed 2024-12-02*
- TypeScript MCP generation with full `$ref` resolution
- **Python MCP generation** (mcp, httpx, pydantic) ✅ *Completed 2024-12-02*
- Path/query/body parameter handling in generated code
- API key placeholder (`process.env.API_KEY`)
- **Generation config modal** (language, server name, auth type, options) ✅ *Completed 2024-12-02*
- **Dockerfile generation** (multi-stage for TS, slim for Python) ✅ *Completed 2024-12-02*
- **GitHub Actions workflow** generation ✅ *Completed 2024-12-02*
- **GitLab CI config** generation ✅ *Completed 2024-12-02*
- Download as ZIP
- GitHub export via Octokit
- **GitLab export** via @gitbeaker/rest ✅ *Completed 2024-12-02*
- PostgreSQL metadata storage
- Redis job queue
- Docker Compose deployment
- Anonymous session management
- **Job control endpoints** (GET/DELETE/POST /api/jobs/:id) ✅ *Completed 2024-12-02*
- **Job list endpoint** (GET /api/jobs with filtering) ✅ *Completed 2024-12-02*
- **Frontend job tracking** (progress bar, status, cancel/retry) ✅ *Completed 2024-12-02*
- **Health check endpoint** (GET /api/health with Redis/Postgres/Queue status) ✅ *Completed 2024-12-02*
- **Prometheus metrics** (GET /api/metrics) ✅ *Completed 2024-12-02*
- **Schema versioning** (PUT /api/schemas/:id, version history, revert) ✅ *Completed 2024-12-02*
- **Schema editor** (Monaco editor in browser with format/history/revert) ✅ *Completed 2024-12-02*
- **Batch operations** (POST /api/generate/batch for multiple schemas) ✅ *Completed 2024-12-02*
- **Webhook notifications** (configurable webhooks with HMAC signing) ✅ *Completed 2024-12-02*
- **Endpoint Test UI** (web interface for testing API endpoints in generated code) ✅ *Completed 2024-12-03*
- **Crawl stop/restart** (abort signal, checkpoint save/resume) ✅ *Completed 2024-12-02*
- **Crawl configuration** (auth headers, rate limit, user agent, redirects) ✅ *Completed 2024-12-02*

### ⚠️ Partial (1 feature)
- GitHub branches (always pushes to default)

---

## Gap Analysis & Implementation Plan

### Phase 1: Core Spec Compliance (Priority: High)

#### 1.1 Job Control System ✅ COMPLETED
**Files**: `backend/src/routes/api.ts`, `frontend/src/lib/api.ts`, `frontend/src/App.tsx`
**Completed**: 2024-12-02

| Task | Status |
|------|--------|
| Add `GET /api/jobs/:id` | ✅ Done - Returns job status, progress, result |
| Add `DELETE /api/jobs/:id` | ✅ Done - Cancel waiting/active jobs |
| Add `POST /api/jobs/:id/retry` | ✅ Done - Retry failed jobs |
| Add `GET /api/jobs` | ✅ Done - List all jobs with filtering |
| Frontend job status polling | ✅ Done - Progress bar, status badge, cancel/retry buttons |
| WebSocket option | ⏳ Deferred - Current polling works well |

#### 1.2 GitLab Export ✅ COMPLETED
**Files**: `backend/src/services/gitlab.service.ts` (new), `backend/src/routes/api.ts`, `frontend/src/lib/api.ts`, `frontend/src/components/SchemaList.tsx`
**Completed**: 2024-12-02

| Task | Status |
|------|--------|
| Create `GitLabService` | ✅ Done - uses `@gitbeaker/rest` for GitLab API |
| Add `POST /api/export/gitlab` | ✅ Done - export to GitLab repository with branch selection |
| Branch selection | ✅ Done - configurable branch (default: main) |
| Host configuration | ✅ Done - supports self-hosted GitLab instances |
| UI export modal | ✅ Done - separate GitHub/GitLab buttons with dedicated modals |

#### 1.3 YAML Support ✅ COMPLETED
**Files**: `backend/src/worker.ts`, `backend/package.json`
**Completed**: 2024-12-02

| Task | Status |
|------|--------|
| Add `js-yaml` dependency | ✅ Done |
| Detect file type | ✅ Done - checks `.yaml`/`.yml` extension |
| Convert YAML to JSON | ✅ Done - `parseOpenApiSpec()` function |
| Fallback parsing | ✅ Done - tries JSON first, then YAML |

---

### Phase 2: Generation Options (Priority: High)

#### 2.1 Python MCP Generation ✅ COMPLETED
**Files**: `backend/src/services/generator.service.ts`
**Completed**: 2024-12-02

| Task | Status |
|------|--------|
| Add `generatePython()` method | ✅ Done - Uses mcp library (standard Python SDK) |
| Generate `pyproject.toml` | ✅ Done - mcp, httpx, pydantic dependencies |
| Generate `src/server.py` | ✅ Done - Full MCP server with decorators |
| Generate `README.md` | ✅ Done - Installation and usage instructions |
| Path/query/body handling | ✅ Done - Same logic as TypeScript |
| Swagger 2.0 body params | ✅ Done - Handles `in: "body"` parameters |
| Frontend language dropdown | ✅ Done - Select TypeScript or Python |

#### 2.2 Generation Configuration UI ✅ COMPLETED
**Files**: `frontend/src/components/GenerateModal.tsx` (new), `backend/src/routes/api.ts`, `backend/src/services/generator.service.ts`
**Completed**: 2024-12-02

| Task | Status |
|------|--------|
| Create `GenerateModal` component | ✅ Done - Desktop-optimized two-column modal |
| Language selection (TypeScript/Python) | ✅ Done - Visual button toggle |
| Server name customization | ✅ Done - Pre-filled from schema title |
| Route prefix option | ✅ Done - Prefix added to all API paths |
| Authentication type selection | ✅ Done - None/Bearer/API-Key/Basic options |
| Code style toggles (async, strict, comments) | ✅ Done - Toggle switches |
| Include Dockerfile option | ✅ Done - Generates multi-stage Dockerfile |
| CI/CD config option (none/github/gitlab/both) | ✅ Done - Generates workflow files |
| Generate Tests option | ⏳ UI present with "Coming Soon" badge |
| Output preview | ✅ Done - Live file list preview |
| Backend options handling | ✅ Done - Updated /api/generate endpoint |

#### 2.3 Dockerfile Generation ✅ COMPLETED
**Files**: `backend/src/services/generator.service.ts`
**Completed**: 2024-12-02

| Task | Status |
|------|--------|
| Add `generateDockerfile()` method | ✅ Done - Multi-stage build for TypeScript |
| Python Dockerfile | ✅ Done - Python 3.11-slim base |
| Include in ZIP | ✅ Done - When `includeDockerfile: true` |

#### 2.4 CI/CD Templates ✅ COMPLETED
**Files**: `backend/src/services/generator.service.ts`
**Completed**: 2024-12-02

| Task | Status |
|------|--------|
| GitHub Actions workflow | ✅ Done - `.github/workflows/build.yml` |
| GitLab CI config | ✅ Done - `.gitlab-ci.yml` |
| Include in ZIP | ✅ Done - When `includeCIConfig: 'github' | 'gitlab' | 'both'` |

---

### Phase 3: Advanced Generation (Priority: Medium)

#### 3.1 Schema Merging
**Files**: `backend/src/services/merger.service.ts` (new), `backend/src/routes/api.ts`

| Task | Description |
|------|-------------|
| `POST /api/merge` | Accept array of schema IDs |
| Merge paths, components | Combine into single spec |
| Handle conflicts | Prefix duplicate operationIds |

#### 3.2 Path Exclusions
**Files**: `backend/src/services/generator.service.ts`

| Task | Description |
|------|-------------|
| Accept `excludePaths` array | e.g., `["/internal/*", "/admin/*"]` |
| Filter in `extractTools()` | Skip matching paths |

#### 3.3 Model Name Mapping
**Files**: `backend/src/services/generator.service.ts`

| Task | Description |
|------|-------------|
| Accept `modelMapping` object | e.g., `{"Pet": "Animal"}` |
| Apply during `resolveRef()` | Rename models in output |

#### 3.4 Custom Headers
**Files**: `backend/src/services/generator.service.ts`

| Task | Description |
|------|-------------|
| Accept `defaultHeaders` object | e.g., `{"X-Custom": "value"}` |
| Include in generated axios config | Merge with auth header |

#### 3.5 Test Generation
**Files**: `backend/src/services/generator.service.ts`

| Task | Description |
|------|-------------|
| Generate `src/__tests__/` | Jest/Vitest test files |
| Mock axios responses | Based on OpenAPI examples |
| Add test script | `npm test` in package.json |

---

### Phase 4: Crawl Enhancements (Priority: Medium) ✅ COMPLETED

#### 4.1 Stop/Restart Crawl ✅ COMPLETED
**Files**: `backend/src/worker.ts`, `backend/src/routes/api.ts`, `backend/src/services/crawler.service.ts`
**Completed**: 2024-12-02

| Task | Status |
|------|--------|
| Check abort signal | ✅ Done - AbortController integration in crawl loop |
| Store partial results | ✅ Done - Checkpoint saved on abort |
| Resume from checkpoint | ✅ Done - resumeFromCheckpoint() method |
| Progress tracking | ✅ Done - onProgress callback with current/total URLs |
| Cancel active crawls | ✅ Done - DELETE /api/jobs/:id triggers abort |

#### 4.2 Crawl Configuration ✅ COMPLETED
**Files**: `frontend/src/components/CrawlTab.tsx`, `backend/src/services/crawler.service.ts`
**Completed**: 2024-12-02

| Option | Status |
|--------|--------|
| `authHeaders` | ✅ Done - Custom auth header/value in UI and service |
| `rateLimit` | ✅ Done - Configurable delay (0-2000ms) between requests |
| `userAgent` | ✅ Done - Custom User-Agent header with default |
| `followRedirects` | ✅ Done - Toggle redirect following (default: true) |
| Advanced options UI | ✅ Done - Collapsible panel with Settings icon |

---

### Phase 5: Day 2 Features (Priority: Low) ✅ COMPLETED

#### 5.1 Health Check Endpoint ✅ COMPLETED
**Files**: `backend/src/routes/api.ts`
**Completed**: 2024-12-02

| Task | Status |
|------|--------|
| GET /api/health endpoint | ✅ Done - Returns Redis, PostgreSQL, Queue status |
| Latency tracking | ✅ Done - Measures response time for each service |
| Overall status calculation | ✅ Done - healthy/degraded/unhealthy aggregation |
| Uptime tracking | ✅ Done - Server uptime in seconds |

#### 5.2 Prometheus Metrics ✅ COMPLETED
**Files**: `backend/src/routes/api.ts`
**Completed**: 2024-12-02

| Task | Status |
|------|--------|
| GET /api/metrics endpoint | ✅ Done - Prometheus format output |
| Job counters | ✅ Done - waiting/active/completed/failed |
| Schema/session counts | ✅ Done - Total schemas and sessions |
| Upload/crawl/generation counters | ✅ Done - Operation tracking |

#### 5.3 Schema Versioning ✅ COMPLETED
**Files**: `backend/prisma/schema.prisma`, `backend/src/routes/api.ts`
**Completed**: 2024-12-02

| Task | Status |
|------|--------|
| SchemaVersion model | ✅ Done - Tracks version history |
| PUT /api/schemas/:id | ✅ Done - Update with version increment |
| GET /api/schemas/:id/versions | ✅ Done - List all versions |
| POST /api/schemas/:id/revert/:version | ✅ Done - Revert to previous version |

#### 5.4 Schema Editor UI ✅ COMPLETED
**Files**: `frontend/src/components/SchemaEditor.tsx`, `frontend/src/components/SchemaList.tsx`
**Completed**: 2024-12-02

| Task | Status |
|------|--------|
| Monaco Editor integration | ✅ Done - Full JSON editing |
| Version history panel | ✅ Done - View and revert versions |
| Format button | ✅ Done - Auto-format JSON |
| Changelog input | ✅ Done - Track change descriptions |
| Edit button in schema list | ✅ Done - Open editor modal |

#### 5.5 Batch Operations ✅ COMPLETED
**Files**: `backend/src/routes/api.ts`
**Completed**: 2024-12-02

| Task | Status |
|------|--------|
| POST /api/generate/batch | ✅ Done - Generate multiple schemas |
| Combined ZIP output | ✅ Done - Each schema in subfolder |
| Result tracking | ✅ Done - Success/failure per schema |
| Limit enforcement | ✅ Done - Max 10 schemas per batch |

#### 5.6 Webhook Notifications ✅ COMPLETED
**Files**: `backend/src/services/webhook.service.ts`, `backend/src/routes/api.ts`, `backend/prisma/schema.prisma`
**Completed**: 2024-12-02

| Task | Status |
|------|--------|
| Webhook model | ✅ Done - URL, events, secret, active |
| POST /api/webhooks | ✅ Done - Create webhook |
| GET /api/webhooks | ✅ Done - List webhooks |
| DELETE /api/webhooks/:id | ✅ Done - Remove webhook |
| HMAC signing | ✅ Done - Optional secret for verification |
| Event types | ✅ Done - job.completed, job.failed, schema.created, schema.updated |
| Worker integration | ✅ Done - Triggers on job completion/failure |

#### 5.7 Endpoint Test UI ✅ COMPLETED
**Files**: `backend/src/services/generator.service.ts`, `frontend/src/components/GenerateModal.tsx`
**Completed**: 2024-12-03

| Task | Status |
|------|--------|
| Add `includeTestUI` option | ✅ Done - GenerationOptions interface updated |
| Generate test-ui/index.html | ✅ Done - Modern dark theme UI with tool cards |
| Generate test-ui/server.js (TypeScript) | ✅ Done - Express proxy server |
| Generate test-ui/server.py (Python) | ✅ Done - httpx-based HTTP server |
| Frontend toggle | ✅ Done - Include Test UI option in GenerateModal |
| README documentation | ✅ Done - Test UI usage instructions |
| TypeScript tested | ✅ Done - Success 200 response |
| Python tested | ✅ Done - Success 200 response |

#### 5.8 Remaining Features (Deferred)

| Feature | Status |
|---------|--------|
| Swagger UI bundle | ⏳ Deferred - Can be added to generated projects |

---

## Documentation Updates Required

### README.md
- Update feature list with implemented/roadmap split
- Add generated server documentation
- Add environment variable reference
- Add troubleshooting section

### .github/copilot-instructions.md
- Add generation options documentation
- Add GitLab service pattern
- Add job control API documentation
- Update common gotchas with new features

### DOCUMENTATION.md
- Full API reference with all options
- Generation options matrix
- Export options matrix

---

## Estimated Effort

| Phase | Features | Effort |
|-------|----------|--------|
| Phase 1 | Job control, GitLab, YAML | 3-4 days |
| Phase 2 | Python, options UI, Docker, CI | 4-5 days |
| Phase 3 | Merge, exclude, mapping, tests | 3-4 days |
| Phase 4 | Crawl enhancements | 2-3 days |
| Phase 5 | Day 2 features | 5+ days |

**Total estimated: 17-21 days for full spec compliance**

---

## Further Considerations

1. **OpenAPI 3.1 support**: Current validation only checks for `swagger`/`openapi` property. Should we add full spec version validation?
2. **Rate limiting on API**: Should we add express-rate-limit to prevent abuse?
3. **Authentication**: Spec says "No authentication" but mentions tokens - clarify if user auth is needed for export tokens only.
