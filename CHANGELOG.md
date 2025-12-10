## [1.0.1](https://github.com/tomer1983/swagger2mcp/compare/v1.0.0...v1.0.1) (2025-12-09)
 

### Bug Fixes

* **ci:** add main branch to release config and standardize root package.json ([656ba03](https://github.com/tomer1983/swagger2mcp/commit/656ba03d9ba59565f4d5b36b5d94190ad4a37392))
* **ci:** configure repository url and permissions for semantic-release ([7811a45](https://github.com/tomer1983/swagger2mcp/commit/7811a459e1bb00b7f3b98ac037337341fd7ff4fd))
* **ci:** remove workspaces to restore npm ci compatibility ([5be6e1a](https://github.com/tomer1983/swagger2mcp/commit/5be6e1a871877b58887c7b18c6c8fc0f9ebd7c87))
* **ci:** upgrade node version to 22 for semantic-release ([38920fd](https://github.com/tomer1983/swagger2mcp/commit/38920fd1f087fb1e7edc7de7fa428789e92e215e))
* **ci:** use docker compose v2 command ([23a0249](https://github.com/tomer1983/swagger2mcp/commit/23a0249b7297d8c91b2e9768d191075e42dd9b87))

# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- **GitHub & GitLab Integration**: Pre-configured repository connections for easy export and validation.
- **Audit Logging**: Comprehensive audit trail for repository operations (Create, Update, Delete).
- **Settings Page**: Dedicated page for managing saved repository configurations with duplicate name checks.
- **UI Enhancements**: Dark mode/Light mode support, improved navigation, and loading states.
- **Documentation**: New docs structure, `CONTRIBUTING.md`, `SECURITY.md`, and cleanup of workspace.

### Changed
- Refactored `SettingsPage` to support direct creation of connections via modal.
- Improved error handling for GitHub/GitLab validation.
- Moved all documentation files to `docs/` folder for better organization.

### Fixed
- Fixed bug with native `window.confirm` dialog in delete interactions.
- Added missing `date-fns` dependency or replaced with native `Intl.DateTimeFormat`.

## [0.1.0] - 2024-12-01

### Added
- Initial release of Swagger2MCP
- Core functionality: File upload, Web crawling, MCP server generation
- Docker Compose setup for Backend, Frontend, Redis, and PostgreSQL
- GitHub export functionality
