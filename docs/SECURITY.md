# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.x.x   | :white_check_mark: |
| < 1.0   | :x:                |

## Reporting a Vulnerability

We take security vulnerabilities seriously. If you discover a security issue, please report it responsibly.

### How to Report

**Please do NOT report security vulnerabilities through public GitHub issues.**

Instead, please send an email to the maintainers with:

1. **Description** of the vulnerability
2. **Steps to reproduce** the issue
3. **Potential impact** of the vulnerability
4. **Suggested fix** (if you have one)

### What to Expect

- **Acknowledgment**: We will acknowledge receipt within 48 hours
- **Assessment**: We will assess the vulnerability and determine its severity
- **Updates**: We will keep you informed of our progress
- **Resolution**: We aim to resolve critical issues within 7 days
- **Credit**: With your permission, we will credit you in the fix announcement

### Security Best Practices for Users

When deploying Swagger2MCP:

1. **Never expose the backend directly** - Use a reverse proxy (nginx, traefik)
2. **Use HTTPS** in production
3. **Secure your environment variables** - Never commit `.env` files
4. **Keep dependencies updated** - Run `npm audit` regularly
5. **Use strong authentication** - Enable proper auth in production
6. **Validate API tokens** - Never store tokens in plain text
7. **Review generated code** - Especially when using untrusted OpenAPI specs

### Scope

The following are in scope for security reports:

- Authentication/authorization bypasses
- SQL injection, XSS, CSRF vulnerabilities
- Remote code execution
- Sensitive data exposure
- Token/credential leakage

### Out of Scope

- Issues in dependencies (report to the dependency maintainers)
- Denial of service attacks
- Social engineering
- Physical security

## Security Updates

Security updates will be released as patch versions and announced in:

- GitHub Releases
- CHANGELOG.md

Thank you for helping keep Swagger2MCP secure! 🔒
