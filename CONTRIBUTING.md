# Contributing to Swagger2MCP

First off, thank you for considering contributing to Swagger2MCP! 🎉

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [How Can I Contribute?](#how-can-i-contribute)
- [Development Setup](#development-setup)
- [Pull Request Process](#pull-request-process)
- [Style Guidelines](#style-guidelines)

## Code of Conduct

This project and everyone participating in it is governed by our [Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code.

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/YOUR_USERNAME/swagger2mcp.git`
3. Create a branch: `git checkout -b feature/your-feature-name`

## How Can I Contribute?

### 🐛 Reporting Bugs

Before creating bug reports, please check the existing issues. When creating a bug report, include:

- A clear and descriptive title
- Steps to reproduce the issue
- Expected behavior vs actual behavior
- Screenshots if applicable
- Your environment (OS, browser, Node.js version)

### 💡 Suggesting Features

Feature suggestions are welcome! Please:

- Use a clear and descriptive title
- Provide a detailed description of the proposed feature
- Explain why this feature would be useful
- Include mockups or examples if possible

### 🔧 Pull Requests

1. Follow the [Development Setup](#development-setup) instructions
2. Make your changes in a feature branch
3. Write or update tests as needed
4. Ensure all tests pass
5. Update documentation if needed
6. Submit a pull request

## Development Setup

### Prerequisites

- Node.js 18+
- Docker & Docker Compose
- Git

### Running Locally

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/swagger2mcp.git
cd swagger2mcp

# Start all services with Docker
docker-compose up

# Or run individually:

# Backend
cd backend
npm install
npm run dev

# Frontend (in another terminal)
cd frontend
npm install
npm run dev
```

### Running Tests

```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test
```

## Pull Request Process

1. **Branch naming**: Use `feature/`, `fix/`, or `docs/` prefixes
2. **Commits**: Write clear, concise commit messages
3. **Tests**: Add tests for new functionality
4. **Documentation**: Update docs if needed
5. **Review**: Wait for maintainer review and address feedback

### PR Checklist

- [ ] My code follows the project's style guidelines
- [ ] I have performed a self-review
- [ ] I have commented my code where needed
- [ ] I have updated the documentation
- [ ] My changes generate no new warnings
- [ ] I have added tests that prove my fix/feature works
- [ ] All tests pass locally

## Style Guidelines

### TypeScript

- Use TypeScript for all new code
- Follow existing code patterns
- Use meaningful variable and function names
- Add JSDoc comments for public APIs

### Git Commits

- Use present tense ("Add feature" not "Added feature")
- Use imperative mood ("Move cursor to..." not "Moves cursor to...")
- Limit the first line to 72 characters
- Reference issues and PRs when relevant

### Code Formatting

- We use Prettier for formatting
- Run `npm run format` before committing
- ESLint errors must be resolved

## 🙏 Thank You!

Your contributions make open source amazing. Thank you for being part of the Swagger2MCP community!
