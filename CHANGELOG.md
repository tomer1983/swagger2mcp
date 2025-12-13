# [1.2.0-develop.1](https://github.com/tomer1983/swagger2mcp/compare/v1.1.0...v1.2.0-develop.1) (2025-12-13)


### Bug Fixes

* **ui:** hide protected navigation links for unauthenticated users ([3f8a8eb](https://github.com/tomer1983/swagger2mcp/commit/3f8a8eb234c31003e7bef1332bc1f64a02ddb4b4))


### Features

* disable public registration and enforce permissions on feature routes ([df21588](https://github.com/tomer1983/swagger2mcp/commit/df2158883140d2c960961d902c6509c2131ac9bd))

# [1.1.0](https://github.com/tomer1983/swagger2mcp/compare/v1.0.1...v1.1.0) (2025-12-10)


### Bug Fixes

* **ci:** add .trivyignore to suppress CVE-2025-64756 ([4b73863](https://github.com/tomer1983/swagger2mcp/commit/4b73863479f5f017897fb68e02105e3e7fa94b76))
* **ci:** add additional CVEs to .trivyignore ([ab59165](https://github.com/tomer1983/swagger2mcp/commit/ab5916559ef832f92e5236f32bd795c158321d9f))
* **ci:** add codeql dependency and remove main branch references ([66fdbf9](https://github.com/tomer1983/swagger2mcp/commit/66fdbf973e76916be500aa87d066d83db0a6386a))
* **ci:** allow kubernetes-test to fail without blocking pipeline ([79cde4f](https://github.com/tomer1983/swagger2mcp/commit/79cde4fe26f23b2975990629cfeb5a8690194856))
* **ci:** build Docker images locally before Trivy scan ([cae1ff9](https://github.com/tomer1983/swagger2mcp/commit/cae1ff93d26977025ed5250b3864259316673c79))
* **ci:** explicitly patch cross-spawn in global npm ([bd1bf4c](https://github.com/tomer1983/swagger2mcp/commit/bd1bf4cb9f56ad60b683e1948b8dc059138734a4))
* **ci:** explicitly use .trivyignore in workflow ([519f078](https://github.com/tomer1983/swagger2mcp/commit/519f078f8521a9958d7eaa6f61ee69203ef1c92a))
* **ci:** fix semantic-release configuration ([23b6435](https://github.com/tomer1983/swagger2mcp/commit/23b6435cb2fc9326d1dff285ca0ec4252f3fc858))
* **ci:** implement Trivy best practices from official docs ([4dacdaf](https://github.com/tomer1983/swagger2mcp/commit/4dacdaf6ce01cdd992e379cca673e85b60af71ae))
* **ci:** patch global cross-spawn in docker images ([266f820](https://github.com/tomer1983/swagger2mcp/commit/266f8209a968fb2b04d67192955bda33d14a929d))
* **ci:** suppress cross-spawn CVE and simplify npm update ([432b271](https://github.com/tomer1983/swagger2mcp/commit/432b271dc7870bbbc04b86624d1adf6bac91301c))
* **ci:** switch to node:20-slim and remove ignore hacks ([0590a80](https://github.com/tomer1983/swagger2mcp/commit/0590a808c2b9fe8a188d9259a2c58961a39097f6))
* **ci:** trivy implementation ([5d6365e](https://github.com/tomer1983/swagger2mcp/commit/5d6365ee4f43a31862d7bdbc14b269846d99475f))
* **ci:** trivy implementation ([c03efbf](https://github.com/tomer1983/swagger2mcp/commit/c03efbf81f724f86fb76ae048e55db5a44d555a4))
* **ci:** trivy implementation ([18a6a19](https://github.com/tomer1983/swagger2mcp/commit/18a6a19f42b4aab3cc751152a50224528187a474))
* **ci:** update npm in dockerfiles to resolve trivy vulnerability ([e022b23](https://github.com/tomer1983/swagger2mcp/commit/e022b233052310509c93671064de14503a21335a))
* **ci:** upgrade to node:22-slim to resolve trivy failure ([5dbf951](https://github.com/tomer1983/swagger2mcp/commit/5dbf9514ff254f4dca54fb5a871f056757a7302a))
* **ci:** use absolute path for trivyignores ([7f484c3](https://github.com/tomer1983/swagger2mcp/commit/7f484c3be3d8815c50564c60be1f14ec5cb1e9cd))
* **ci:** use explicit path for global npm update ([4c45987](https://github.com/tomer1983/swagger2mcp/commit/4c4598768ff40d18d7418f82e01764058f51d407))
* **ci:** use PAT for semantic-release to bypass branch protection ([0a8e8eb](https://github.com/tomer1983/swagger2mcp/commit/0a8e8eb662df3c87213a454a14617dcbd2f9a3e9))
* **ci:** use trivy-config and debug ignore file ([fe57b68](https://github.com/tomer1983/swagger2mcp/commit/fe57b6857f955ab824d379b5f2904cd36435be4b))


### Features

* Add GitHub Actions CI pipeline including CodeQL, linting, testing, Docker builds, Kubernetes deployment, and semantic release. ([6f2cac3](https://github.com/tomer1983/swagger2mcp/commit/6f2cac39f0782a27d321010cf25d2437b66638dd))
* **ci:** add docker-compose integration tests ([ef05b36](https://github.com/tomer1983/swagger2mcp/commit/ef05b36d31c7cd1caf8b8c4bf7bb855f0846754a))
* **ci:** enable docker hub push and add trivy scanning ([74d6cf3](https://github.com/tomer1983/swagger2mcp/commit/74d6cf3c6c7ebfdbc7657224b950b588d0d3f618))
* **ci:** replace semantic-release with manual tag release ([c951072](https://github.com/tomer1983/swagger2mcp/commit/c951072a0e8dee57b364fc57b92db60d340f7eb1))
* **ci:** replace Trivy with CodeQL analysis for security scanning ([f2cec30](https://github.com/tomer1983/swagger2mcp/commit/f2cec30fd47910f1b8199fb05af8792619c00b18))
* **ci:** restore semantic-release and configure docker push on tags ([7431deb](https://github.com/tomer1983/swagger2mcp/commit/7431deb50b232673d02fade0525c2c1138308f91))
* **k8s:** add Kubernetes manifests, Helm chart, CI testing, and documentation ([dfa57d9](https://github.com/tomer1983/swagger2mcp/commit/dfa57d9cffaecde73f91dbe9f52c8faa22e9fcb9))
* **ui:** implement glass shell and cinematic background (Phase 2) ([cb57f80](https://github.com/tomer1983/swagger2mcp/commit/cb57f806b50b47c7c4cbd41915395f13cc1fbb7d))
* **ui:** implement holographic theme foundation (Phase 1) ([a3b2f3d](https://github.com/tomer1983/swagger2mcp/commit/a3b2f3dfe7841385bcd0a29d14ef0366beeef2f5))
* **visualizer:** add interactive Neural Visualizer enhancements ([cf055fe](https://github.com/tomer1983/swagger2mcp/commit/cf055fefeeba81872d1883d4794c4ac3e2c8c121))

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
