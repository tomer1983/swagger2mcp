# Swagger2MCP

Generate Model Context Protocol (MCP) servers from OpenAPI/Swagger schemas.

## Features

- 📤 **File Upload**: Upload OpenAPI/Swagger JSON files
- 🌐 **Web Crawling**: Crawl websites to discover API schemas
- 🔧 **MCP Generation**: Generate TypeScript MCP server code
- 📦 **Export**: Download as ZIP or push directly to GitHub
- 🐳 **Docker**: Fully containerized with Docker Compose
- 📊 **Background Jobs**: Long-running crawl jobs with progress tracking
- 💾 **PostgreSQL**: Metadata storage with Prisma ORM
- 🔄 **Redis**: Job queue management with BullMQ

## Quick Start

### Prerequisites

- Docker & Docker Compose
- Node.js 18+ (for local development)

### Running with Docker

```bash
# Start all services
docker-compose up

# Access the application
# Frontend: http://localhost:5173
# Backend: http://localhost:3000
```

### Local Development

#### Backend

```bash
cd backend
npm install
npm run dev        # Start API server
npm run worker     # Start background worker (in separate terminal)
```

#### Frontend

```bash
cd frontend
npm install
npm run dev
```

## Architecture

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Frontend  │────▶│   Backend   │────▶│   Worker    │
│   (React)   │     │  (Express)  │     │  (BullMQ)   │
└─────────────┘     └─────────────┘     └─────────────┘
                           │                    │
                           ▼                    ▼
                    ┌─────────────┐     ┌─────────────┐
                    │  PostgreSQL │     │    Redis    │
                    └─────────────┘     └─────────────┘
```

## API Endpoints

- `POST /api/upload` - Upload OpenAPI schema file
- `POST /api/crawl` - Start crawl job
- `GET /api/schemas` - List all schemas for session
- `POST /api/generate` - Generate and download MCP server
- `POST /api/export` - Export to GitHub

## Environment Variables

### Backend

```env
PORT=3000
REDIS_HOST=redis
REDIS_PORT=6379
DATABASE_URL=postgresql://postgres:postgres@postgres:5432/swagger2mcp
```

### Frontend

```env
VITE_API_URL=http://localhost:3000/api
```

## Database Schema

```prisma
model Session {
  id        String   @id @default(uuid())
  createdAt DateTime @default(now())
  schemas   Schema[]
}

model Schema {
  id        String   @id @default(uuid())
  sessionId String
  type      String   // "UPLOAD" or "CRAWL"
  content   String   // JSON content
  url       String?  // Source URL if crawled
  createdAt DateTime @default(now())
}
```

## Database Migrations

### Migration Strategy

This project uses Prisma for database schema management and migrations.

#### Development Workflow

1. **Make schema changes** in `backend/prisma/schema.prisma`
2. **Create a migration**:
   ```bash
   cd backend
   npm run migrate
   # Or: npx prisma migrate dev --name description_of_changes
   ```
3. **Review the generated SQL** in `backend/prisma/migrations/`
4. **Commit migration files** to version control

#### Production Deployment

```bash
cd backend
npm run migrate:deploy
# Or: npx prisma migrate deploy
```

This applies pending migrations without prompting.

#### Important Notes

- **Always commit migration files** - They are required for production deployments
- **Never edit migration SQL manually** unless absolutely necessary
- **Test migrations on staging** before production
- Migration files are located in `backend/prisma/migrations/`
- Prisma automatically generates TypeScript types after migrations

#### Rollback Strategy

Prisma doesn't support automatic rollbacks. To rollback:

1. Restore database from backup
2. Deploy the previous application version
3. Or manually write a new migration to undo changes

## Additional Resources

- [Development Setup Guide](./DEVELOPMENT.md) - Detailed setup and troubleshooting
- [API Documentation](./API-DOCUMENTATION.md) - Complete REST API reference
- [Authentication Guide](./AUTHENTICATION.md) - User authentication and data isolation
- [Database Migrations](./README.md#database-migrations) - Migration workflow
- [CI/CD Pipelines](./.github/workflows/ci.yml) - GitHub Actions and [GitLab CI](./.gitlab-ci.yml)

## Tech Stack

### Frontend
- React + TypeScript
- Vite
- TailwindCSS
- Axios
- Lucide Icons

### Backend
- Node.js + TypeScript
- Express
- BullMQ (Job Queue)
- Prisma (ORM)
- PostgreSQL
- Redis
- Octokit (GitHub API)

## License

MIT
