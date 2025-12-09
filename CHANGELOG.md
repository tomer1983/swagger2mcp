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
