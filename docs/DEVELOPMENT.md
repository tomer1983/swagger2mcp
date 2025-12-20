# Development Setup Guide

## Table of Contents
- [Prerequisites](#prerequisites)
- [Initial Setup](#initial-setup)
- [Development Workflow](#development-workflow)
- [Database Management](#database-management)
- [Debugging](#debugging)
- [Common Issues](#common-issues)
- [Architecture Overview](#architecture-overview)

## Prerequisites

### Required Software
- **Docker Desktop** (v24.0+) - [Download](https://www.docker.com/products/docker-desktop/)
- **Node.js** (v20+) - [Download](https://nodejs.org/)
- **Git** - [Download](https://git-scm.com/)
- **VS Code** (recommended) - [Download](https://code.visualstudio.com/)

### Optional Tools
- **PowerShell 7+** (Windows) - For advanced scripting
- **PostgreSQL Client** - For direct database access
- **Redis CLI** - For queue inspection

## Initial Setup

### 1. Clone Repository
```bash
git clone https://github.com/yourusername/swagger2mcp.git
cd swagger2mcp
```

### 2. Environment Configuration

Create `.env` files for each service:

**Backend** (`backend/.env`):
```env
PORT=3000
REDIS_HOST=localhost
REDIS_PORT=6379
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/swagger2mcp
ALLOWED_ORIGINS=http://localhost:5173
NODE_ENV=development
# Default Admin User
ADMIN_EMAIL=admin@swagger2mcp.local
ADMIN_PASSWORD=changeme123
```

**Frontend** (`frontend/.env`):
```env
VITE_API_URL=http://localhost:3000/api
```

### 3. Docker Setup (Recommended)

Start all services with Docker Compose:

```bash
# Build and start services
docker-compose up --build

# Run in background
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

Services will be available at:
- Frontend: http://localhost:5173
- Backend API: http://localhost:3000/api
- PostgreSQL: localhost:5432
- Redis: localhost:6379

### 4. Local Development Setup

For development with hot reload:

#### Terminal 1: Start Infrastructure
```bash
docker-compose up redis postgres
```

#### Terminal 2: Backend API
```bash
cd backend
npm install
npm run migrate        # Run database migrations
npm run dev           # Start API server with hot reload
```

#### Terminal 3: Background Worker
```bash
cd backend
npm run worker        # Start job processor
```

#### Terminal 4: Frontend
```bash
cd frontend
npm install
npm run dev           # Start Vite dev server
```

## Development Workflow

### Making Code Changes

1. **Backend changes**: 
   - Edit files in `backend/src/`
   - `ts-node-dev` will auto-restart
   - Check `docker-compose logs backend`

2. **Frontend changes**:
   - Edit files in `frontend/src/`
   - Vite hot module replacement updates instantly
   - Check browser console for errors

3. **Database schema changes**:
   ```bash
   cd backend
   # Edit prisma/schema.prisma
   npm run migrate
   # Migration files created in prisma/migrations/
   ```

### Running Tests

```bash
# Backend tests (when implemented)
cd backend
npm test

# Frontend tests (when implemented)
cd frontend
npm test

# E2E tests (when implemented)
npm run test:e2e
```

### Code Quality Checks

```bash
# TypeScript type checking
cd backend && npx tsc --noEmit
cd frontend && npx tsc --noEmit

# Linting
cd frontend && npm run lint
```

## Database Management

### Accessing PostgreSQL

```bash
# Via Docker
docker-compose exec postgres psql -U postgres -d swagger2mcp

# Via local client
psql postgresql://postgres:postgres@localhost:5432/swagger2mcp
```

### Common Prisma Commands

```bash
cd backend

# Generate Prisma Client (after schema changes)
npx prisma generate

# Create migration
npx prisma migrate dev --name description_of_change

# Apply migrations (production)
npx prisma migrate deploy

# Reset database (development only!)
npx prisma migrate reset

# Open Prisma Studio (GUI)
npx prisma studio
```

### Viewing Data

```bash
# Prisma Studio (recommended)
cd backend
npx prisma studio
# Opens at http://localhost:5555

# SQL queries
docker-compose exec postgres psql -U postgres -d swagger2mcp -c "SELECT * FROM \"Session\";"
```

## Debugging

### Backend Debugging

**VS Code Launch Configuration** (`.vscode/launch.json`):
```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Debug Backend",
      "runtimeExecutable": "npm",
      "runtimeArgs": ["run", "dev"],
      "cwd": "${workspaceFolder}/backend",
      "console": "integratedTerminal"
    }
  ]
}
```

**Manual Debugging**:
```bash
cd backend
node --inspect -r ts-node/register src/server.ts
# Attach Chrome DevTools to chrome://inspect
```

### Frontend Debugging

- Use React DevTools extension
- Use browser DevTools (F12)
- Check Network tab for API calls
- Check Console for errors

### Job Queue Debugging

```bash
# View Redis keys
docker-compose exec redis redis-cli KEYS "*"

# Monitor queue
docker-compose exec redis redis-cli MONITOR

# Check job counts
docker-compose exec redis redis-cli LLEN "bull:swagger2mcp:wait"
```

### Log Files

```bash
# All services
docker-compose logs

# Specific service
docker-compose logs backend
docker-compose logs worker
docker-compose logs postgres

# Follow logs
docker-compose logs -f backend

# Last 100 lines
docker-compose logs --tail=100 backend
```

## Common Issues

### Issue: Port Already in Use

**Symptoms**: `Error: listen EADDRINUSE: address already in use :::3000`

**Solutions**:
```bash
# Find process using port
netstat -ano | findstr :3000    # Windows
lsof -i :3000                    # macOS/Linux

# Kill process
taskkill /F /PID <pid>           # Windows
kill -9 <pid>                    # macOS/Linux
```

### Issue: Database Connection Failed

**Symptoms**: `Error: Can't reach database server`

**Solutions**:
```bash
# Check if PostgreSQL is running
docker-compose ps postgres

# Restart PostgreSQL
docker-compose restart postgres

# Check logs
docker-compose logs postgres

# Verify connection string
# Verify connection string
echo $DATABASE_URL
```

### Issue: PostgreSQL "initdb" Error (Data Corruption)

**Symptoms**: `initdb: hint: If you want to remove or empty the directory "/var/lib/postgresql/data"` in logs.

**Solutions**:
This often happens if the `postgres_data` volume is corrupted or internally conflicting.

```bash
# 1. Stop containers
docker-compose down

# 2. Remove the specific volume
docker volume rm swagger2mcp_postgres_data

# 3. Restart
docker-compose up -d
```

### Issue: Redis Connection Error

**Symptoms**: `Error: connect ECONNREFUSED 127.0.0.1:6379`

**Solutions**:
```bash
# Check if Redis is running
docker-compose ps redis

# Test connection
docker-compose exec redis redis-cli ping
# Should return: PONG

# Restart Redis
docker-compose restart redis
```

### Issue: Frontend Can't Connect to Backend

**Symptoms**: `Network Error` in browser console

**Solutions**:
1. Verify backend is running: `curl http://localhost:3000/api/health`
2. Check CORS settings in `backend/src/server.ts`
3. Verify `VITE_API_URL` in `frontend/.env`
4. Clear browser cache and reload

### Issue: Prisma Client Not Generated

**Symptoms**: `Cannot find module '@prisma/client'`

**Solutions**:
```bash
cd backend
npx prisma generate
npm install
```

### Issue: Worker Not Processing Jobs

**Symptoms**: Jobs stuck in "waiting" state

**Solutions**:
```bash
# Check worker is running
docker-compose ps worker

# Restart worker
docker-compose restart worker

# Check worker logs
docker-compose logs worker

# Verify Redis connection
docker-compose exec redis redis-cli ping
```

### Issue: File Upload Fails

**Symptoms**: `400 Bad Request` on upload

**Solutions**:
1. Verify `uploads/` directory exists in `backend/`
2. Check file size (<10MB)
3. Verify Content-Type header is NOT set globally in axios
4. Check backend logs for multer errors

## Architecture Overview

### Service Architecture

```
┌─────────────┐     HTTP      ┌─────────────┐
│   Frontend  │──────────────▶│   Backend   │
│   (React)   │               │  (Express)  │
└─────────────┘               └──────┬──────┘
                                     │
                        ┌────────────┼────────────┐
                        ▼            ▼            ▼
                 ┌──────────┐ ┌──────────┐ ┌──────────┐
                 │PostgreSQL│ │  Redis   │ │  Worker  │
                 │  (Data)  │ │ (Queue)  │ │ (BullMQ) │
                 └──────────┘ └──────────┘ └──────────┘
```

### Directory Structure

```
swagger2mcp/
├── backend/
│   ├── src/
│   │   ├── server.ts          # Express app entry
│   │   ├── worker.ts          # Job processor entry
│   │   ├── routes/
│   │   │   └── api.ts         # All HTTP endpoints
│   │   ├── services/
│   │   │   ├── generator.service.ts   # MCP code generation
│   │   │   ├── crawler.service.ts     # Web crawling
│   │   │   ├── github.service.ts      # GitHub integration
│   │   │   └── gitlab.service.ts      # GitLab integration
│   │   ├── lib/
│   │   │   ├── db.ts          # Prisma client
│   │   │   └── queue.ts       # BullMQ setup
│   │   └── types/
│   │       └── jobs.ts        # Job type definitions
│   ├── prisma/
│   │   ├── schema.prisma      # Database schema
│   │   └── migrations/        # Migration files
│   ├── uploads/               # Uploaded files
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── main.tsx           # Entry point
│   │   ├── App.tsx            # Root component
│   │   ├── components/        # React components
│   │   └── lib/
│   │       └── api.ts         # API client
│   └── package.json
└── docker-compose.yml         # Service orchestration
```

### Data Flow

1. **Upload Flow**:
   - User uploads file → Frontend (FormData)
   - Backend saves to `uploads/` → Creates job in Redis
   - Worker processes → Validates OpenAPI → Saves to PostgreSQL
   - Frontend polls → Updates UI

2. **Crawl Flow**:
   - User enters URL → Backend creates job
   - Worker crawls recursively → Finds schemas
   - Saves to PostgreSQL → Returns results

3. **Generate Flow**:
   - User clicks generate → Backend reads schema from DB
   - Generates TypeScript code → Creates ZIP in-memory
   - Returns ZIP to frontend → Browser downloads

## Additional Resources

- [API Documentation](./API-DOCUMENTATION.md) (when implemented)
- [Contributing Guidelines](./CONTRIBUTING.md) (when implemented)
- [Architecture Decision Records](./docs/adr/) (when implemented)
- [Troubleshooting Guide](./TROUBLESHOOTING.md) (this document)

## Getting Help

- Check logs: `docker-compose logs -f`
- Review health check: `curl http://localhost:3000/api/health`
- Verify services: `docker-compose ps`
- Ask on GitHub Issues

## Next Steps

After setup:
1. Visit http://localhost:5173
2. Try uploading `sample-petstore.json`
3. Generate a TypeScript MCP server
4. Review generated code
5. Start building features!
