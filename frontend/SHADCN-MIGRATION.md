# shadcn/ui Blue Migration Plan

## Goals

- Replace custom Tailwind UI with shadcn/ui primitives and layouts using the official blue theme.
- Standardize forms, tables, dialogs, toasts, and navigation with shadcn defaults for performance (minimal extra motion).
- Add Tremor blocks for charts/metrics aligned to shadcn spacing/typography.
- Keep existing routing/auth; avoid breaking flows while incrementally landing features.

## Decisions

- Theme: generate blue tokens via `shadcn-ui theme` CLI.
- Charts: **Updated** - Using shadcn/recharts instead of Tremor due to React 19 incompatibility (Tremor requires React 18).
- Motion: simplify to shadcn defaults; remove framer-motion accents unless essential feedback is missing.

## Status Board (update as we go)

- [x] Bootstrap shadcn CLI + Radix deps; align Tailwind config/index.css with generated blue tokens. **Status:** Completed (shadcn init ran, Tailwind v4 validated, CSS vars updated, deps installed, @/* alias added in tsconfig).
- [x] Wrap app with shadcn providers (ThemeProvider, Toaster) and clean up legacy providers if redundant. **Status:** Completed (ThemeProvider + shadcn Toaster wired in `main.tsx`, navbar uses shared theme hook).
- [x] Rebuild app shell (navbar/footer/layout) with shadcn components and blue theme. **Status:** Completed (Navbar uses DropdownMenu, Sheet for mobile, Badge; Layout uses Separator, Badge; cleaned styling).
- [x] Replace primitives (Button, Input, Label, Select, Checkbox, Tabs, Tooltip, Skeleton, Dialog, Toast) across shared components. **Status:** Completed (shadcn primitives installed, Button/Input/Skeleton/Tooltip wrappers added, imports fixed to lowercase paths, vite alias configured).
- [x] Rebuild forms (upload/generate/crawl) with shadcn Form primitives + validation messaging. **Status:** Completed (UploadTab, PasteTab, CrawlTab migrated to Card/Input/Label/Alert; GenerateModal uses Dialog/Switch/Select).
- [x] Rebuild admin data surfaces (tables, filters, modals) with shadcn DataTable + Dialog patterns. **Status:** Completed (DataTable uses Button/Select/Skeleton with theme tokens; AdminUsers modals use Dialog/Input/Label/Select/Badge/DropdownMenu; AdminOverview uses Card/Select/Alert; StatCard uses Card; AdminAudit uses Card/Badge/Select/Alert; AdminConfig uses Card/Tabs/Switch/Select; AdminObservability uses Card/Select/Alert).
- [x] Add shadcn charts to admin dashboards. **Status:** Completed - installed recharts-based shadcn chart component (Tremor blocked by React 19). Charts available via `ChartContainer` + recharts API.
- [ ] QA pass: dark/light, keyboard nav, focus rings, responsive. **Status:** Not started.

## Work Breakdown

1. Tooling & Theme

- Install shadcn CLI + Radix deps; run `npx shadcn@latest init` and generate blue theme tokens.
- Update `tailwind.config.js` colors/radius/fonts to match shadcn output; ensure content globs cover generated components.
- Sync `src/index.css` with shadcn CSS vars (blue) and remove conflicting legacy tokens.

1. Providers & Layout

- Add `ThemeProvider` and `Toaster` at app root; ensure `.dark` class strategy aligns with current localStorage toggle.
- Rebuild shell: navbar, footer, page container using shadcn `Button`, `NavigationMenu`/`Sheet`, `DropdownMenu`, `Avatar`, `Separator`, `Breadcrumb` as needed.

1. Primitives Migration

- Swap custom `components/ui/*` with shadcn equivalents: `button`, `input`, `label`, `select`, `checkbox`, `tabs`, `tooltip`, `skeleton`, `dialog`, `toast`.
- Remove framer-motion button effects unless needed for feedback; rely on shadcn focus/hover states.

1. Forms & Flows

- Use shadcn `Form` + `Label` + `Input` + `Textarea` + `Select` + `Checkbox` with consistent error states for upload/generate/crawl flows.
- Update command palette/shortcuts UI to use shadcn `Dialog`/`Command` components if desired.

1. Data & Admin Surfaces

- Rebuild tables with shadcn `DataTable` pattern (sorting, pagination) for admin Users/Schemas/Jobs; use `Dialog` for edit/create.
- Normalize cards/stats with `Card`, `Badge`, `Separator`; ensure responsive grid spacing.

1. Charts (Tremor)

- Add Tremor, map to shadcn blue tokens; create reusable `ChartCard` block (title, description, filters, chart body).
- Implement dashboard charts (e.g., job throughput, success rate, schema counts) using Tremor Area/Bar/Donut with responsive legends.

1. QA & Polish

- Dark/light verification, focus-visible rings, keyboard paths, reduced-motion sanity.
- Sweep for unused legacy styles/components and remove.

## Reference

- shadcn/ui install: <https://ui.shadcn.com/docs/installation>
- shadcn themes (blue): <https://ui.shadcn.com/themes>
- Tremor: <https://www.tremor.so/docs>
- MCP shadcn server available via `.vscode/mcp.json` (`shadcn` command) for spec queries.
