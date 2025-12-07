# Swagger2MCP UI/UX Next-Step Recommendations

## Goals
- Professional, cohesive layout with clear IA and role-based controls
- Admin-only configuration UI, observability, and user management
- Scalable navigation, responsive design, and accessible components

## Information Architecture
- Global navbar: Home, Generate, Schemas, Jobs, Admin (guarded), Help
- Admin subnav: Overview, Observability, Users, Config, Audit Logs
- Footer: build/version, environment badge, links to Docs/API/Status

## Layout & Design System
- Shell: sticky top navbar, left contextual sidebar (per section), right panel for details
- Use Tailwind + design tokens: spacing, colors, radius, shadows, z-index
- Themes: Light/Dark; system-pref; remember user choice
- Components: PageHeader, Breadcrumbs, Tabs, DataTable, StatCards, Charts, Drawer/Modal, Toasts
- Accessibility: focus-visible rings, skip-to-content, landmarks (header/nav/main/footer), color contrast ≥ 4.5:1

## Navigation & Routing
- Introduce sectioned routes:
  - / (Landing)
  - /generate (Upload/Crawl -> Wizard)
  - /schemas (List & details)
  - /jobs (Queue status)
  - /admin (guarded)
    - /admin/overview
    - /admin/observability
    - /admin/users
    - /admin/config
    - /admin/audit

## Admin Area (Role-Based)
- RBAC: roles {admin, user}; gate routes/components client+server
- Config page: editable system settings with JSON editor + form (validated), "Apply", "Dry-run", "Rollback"; audit trail
- Observability: health (backend, worker, DB, Redis), metrics (jobs processed, errors, duration), MCPs generated per day, API latency
- Users: list, search, filters, sort; actions: invite, deactivate, reset 2FA, force logout; last login, sessions
- Audit logs: actor, action, target, timestamp, result; export CSV

## Metrics & Charts
- Use react-query + SWR cache for metrics endpoints
- Charts: @tanstack/react-charts or Recharts; Stat cards: total MCPs, jobs queued/running/succeeded/failed, avg gen time
- Time ranges: 24h, 7d, 30d; auto-refresh toggle; annotate deploys

## Backend Additions (minimal endpoints)
- Auth: /api/auth/me, /api/auth/login, /api/auth/logout
- Users: /api/admin/users [GET/POST/PATCH]
- Config: /api/admin/config [GET/PUT] with schema validation (zod)
- Metrics: /api/admin/metrics [GET] (aggregates: jobs, errors, durations, counts)
- Health: /api/admin/health [GET] (express + worker + prisma + redis)
- Audit: /api/admin/audit [GET]

## Frontend Tasks
- Add Router (react-router v6), ProtectedRoute, RoleProvider
- Global Navbar with Admin badge when user.role === 'admin'
- New pages: Overview, Observability, Users, Config, Audit
- Shared components: StatCards, HealthGrid, DataTable, ChartArea, JSONEditor
- Wizard: Upload/Crawl -> Validate -> Generate -> Export
- Toasts & error boundaries; loading skeletons; empty states

## Visual Style
- Clean, neutral palette (slate/sky/emerald), clear hierarchy
- Iconography: lucide icons consistently; use semantic colors for status
- Microcopy: succinct labels, helper text; confirm modals for dangerous actions

## Security & Governance
- Admin-only controls server-enforced; client hides non-permitted elements
- CSRF tokens, HTTP-only cookies; rate-limit admin endpoints; audit everything
- Config changes require confirmation and are versioned

## Performance
- Code-split routes; lazy-load Admin pages
- Client caching for static lists; polling for jobs metrics
- Debounced filters; virtualized tables for >1000 rows

## Phased Implementation Plan

1. Foundation (Week 1) ✅ COMPLETED
   - ✅ Add router, RBAC context, ProtectedRoute  
   - ✅ Implement navbar, layout shell, theme toggle
   - ✅ Update Prisma schema with role field and Audit model
   - ✅ Create admin route structure with placeholder pages

2. Admin MVP (Week 2) ✅ COMPLETED - TESTED IN DOCKER
   - ✅ Health + Metrics endpoints created (/api/admin/health, /api/admin/metrics)
   - ✅ Admin routes protected with requireAdmin middleware
   - ✅ AdminOverview page with real metrics (timeframe selector, stat cards, live data)
   - ✅ AdminObservability page with health checks (auto-refresh, status grid)
   - ✅ StatCard reusable component for metrics display
   - ✅ User authentication with role-based access control working
   - ✅ Admin navigation link appears for admin users
   - ✅ All admin pages accessible and displaying data correctly

3. User Management (Week 3) ⏳ NOT STARTED
   - ⏳ Users endpoints; DataTable with actions; last login/session display

4. Config UI (Week 4) ⏳ NOT STARTED
   - ⏳ Config read/write with validation; audit trail, confirm/rollback

5. Polish (Week 5) ⏳ NOT STARTED
   - ⏳ Accessibility pass, loading/empty states, docs and tests

## Acceptance Criteria
- Admin routes inaccessible to non-admin both client and server
- Observability shows real-time health and 3 key charts with range selector
- Users page supports search, sort, paginate; shows last login
- Config page supports edit/apply/dry-run with audit records
- Layout responsive (mobile/desktop), accessible (keyboard, screen reader)

## Concrete Tasks

**✅ COMPLETED - Frontend**
- ✅ Install: react-router, @tanstack/react-query, recharts
- ✅ Create: Layout.tsx, Navbar.tsx, ProtectedRoute.tsx
- ✅ Pages: AdminOverview.tsx, AdminObservability.tsx, AdminUsers.tsx, AdminConfig.tsx, AdminAudit.tsx
- ✅ Components: StatCard.tsx (reusable metric display)
- ✅ Contexts: AuthContext with role support
- ✅ API client: admin-api.ts for health and metrics

**✅ COMPLETED - Backend**
- ✅ Routes: /api/admin/health (system health checks), /api/admin/metrics (job/user stats)
- ✅ Prisma models: User {id,email,role,lastLogin}, Audit {id,actor,action,target,timestamp,result}
- ✅ Middleware: requireAdmin (RBAC guard)
- ✅ Database migration: add_rbac_and_audit

**⏳ PENDING - Backend**
- ⏳ Routes: /api/admin/users [GET/POST/PATCH], /api/admin/config [GET/PUT], /api/admin/audit [GET]
- ⏳ Services: User management, Config validator, Audit logger

**⏳ PENDING - Frontend**
- ⏳ Components: DataTable.tsx, JSONEditor.tsx, HealthCheck.tsx, Chart.tsx
- ⏳ Pages: Complete AdminUsers, AdminConfig, AdminAudit with real functionality

**⏳ PENDING - DevOps**
- ⏳ Status page route with build/version
- ⏳ CI: run health/metrics smoke tests

## Wireframe Notes
- Admin Overview: 4 stat cards (MCPs generated, Jobs running, Failures 24h, Avg gen time), recent activity table
- Observability: health grid + line charts (jobs/min, error rate, latency) + refresh
- Users: searchable table with actions in row menu; drawer for details
- Config: form + JSON editor; diff preview; confirmation modal

## Documentation
- Update README with new routes
- Add Admin Guide and Observability Guide
- Include RBAC policy and audit procedures
