# Semantic Release Configuration

This project uses [semantic-release](https://semantic-release.gitbook.io/) to automate version management and package releases.

## Commit Message Format

Commits must follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- **feat**: A new feature (triggers a minor version bump)
- **fix**: A bug fix (triggers a patch version bump)
- **docs**: Documentation only changes
- **style**: Code style changes (formatting, missing semi-colons, etc.)
- **refactor**: Code refactoring without feature changes
- **perf**: Performance improvements
- **test**: Adding or updating tests
- **build**: Changes to build system or dependencies
- **ci**: Changes to CI/CD configuration
- **chore**: Other changes that don't modify src or test files

### Breaking Changes

To trigger a major version bump, add `BREAKING CHANGE:` in the commit footer or use `!` after the type:

```
feat!: remove deprecated API endpoint

BREAKING CHANGE: The /api/old-endpoint has been removed. Use /api/new-endpoint instead.
```

## Examples

### Minor Release (New Feature)
```
feat(api): add batch schema generation endpoint

Allows generating multiple MCP servers in a single request.
Closes #123
```

### Patch Release (Bug Fix)
```
fix(worker): prevent memory leak in crawl service

Fixed issue where crawl jobs weren't properly cleaning up resources.
```

### Major Release (Breaking Change)
```
feat(api)!: change authentication to OAuth2

BREAKING CHANGE: Session-based auth has been replaced with OAuth2.
All clients must update to use the new authentication flow.
```

## Configuration Files

- `.releaserc.json` - GitHub releases configuration
- `.releaserc.gitlab.json` - GitLab releases configuration

## Automated Release Process

When commits are pushed to `main` or `develop`:

1. **Analyze commits** - Determine version bump based on commit messages
2. **Generate changelog** - Create/update CHANGELOG.md
3. **Bump version** - Update version in package.json
4. **Create git tag** - Tag the release in git
5. **Create release** - Publish release on GitHub/GitLab
6. **Commit changes** - Commit changelog and version changes

## Branches

- **main**: Production releases (1.0.0, 1.1.0, etc.)
- **develop**: Pre-releases (1.1.0-dev.1, 1.1.0-dev.2, etc.)

## Manual Release

To manually trigger a release:

### GitHub
```bash
git tag v1.0.0
git push origin v1.0.0
```

### GitLab
```bash
git tag v1.0.0
git push origin v1.0.0
```

## Skipping CI

To skip the CI/CD pipeline, add `[skip ci]` to the commit message:

```
docs: update README [skip ci]
```

Semantic-release automatically adds `[skip ci]` to its version bump commits to prevent infinite loops.
