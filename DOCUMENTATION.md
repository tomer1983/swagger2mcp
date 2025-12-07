# Swagger2MCP - Complete System Documentation

## 🎯 Project Overview

Swagger2MCP is a complete web application that generates Model Context Protocol (MCP) servers from OpenAPI/Swagger schemas. The system supports both file uploads and web crawling to discover API schemas, then generates ready-to-use MCP server code that can be downloaded or exported directly to GitHub.

## ✨ Features Implemented

### Core Functionality
- ✅ **File Upload**: Upload OpenAPI/Swagger JSON/YAML files
- ✅ **Web Crawling**: Crawl websites with configurable depth (1-5 levels) to discover API schemas
- ✅ **MCP Server Generation**: Generate TypeScript MCP server code from schemas
- ✅ **Download**: Download generated servers as ZIP files
- ✅ **GitHub Export**: Push generated code directly to GitHub repositories
- ✅ **Multiple Languages**: TypeScript support (Python framework ready)

### Technical Features
- ✅ **Background Jobs**: Long-running crawl jobs with BullMQ and Redis
- ✅ **Job Progress Tracking**: Real-time progress updates for crawl operations
- ✅ **Session Management**: Anonymous sessions with localStorage
- ✅ **Database Storage**: PostgreSQL with Prisma ORM for metadata
- ✅ **Docker Compose**: Full containerization with 5 services
- ✅ **Stdout Logging**: All logs written to stdout for Docker
- ✅ **External Database**: No Firebase - uses PostgreSQL (Supabase-compatible)

## 🏗️ Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                        Docker Compose                         │
├──────────────┬──────────────┬──────────────┬─────────────────┤
│   Frontend   │   Backend    │    Worker    │  Redis │ Postgres│
│   (Vite)     │  (Express)   │   (BullMQ)   │        │         │
│   Port 5173  │  Port 3000   │              │  6379  │  5432   │
└──────────────┴──────────────┴──────────────┴────────┴─────────┘
```

### Services

1. **Frontend** (React + TypeScript + Vite)
   - Modern UI with TailwindCSS
   - File upload and URL crawling interface
   - Schema list with generation controls
   - GitHub export modal

2. **Backend** (Node.js + Express + TypeScript)
   - RESTful API
   - File upload handling (Multer)
   - Job queue management
   - MCP code generation
   - GitHub API integration (Octokit)

3. **Worker** (BullMQ)
   - Background job processing
   - Web crawling service
   - Schema validation
   - Database persistence

4. **Redis**
   - Job queue storage
   - Progress tracking

5. **PostgreSQL**
   - Session and schema metadata
   - Prisma ORM

## 📁 Project Structure

```
swagger2mcp/
├── backend/
│   ├── src/
│   │   ├── lib/
│   │   │   ├── db.ts              # Prisma client
│   │   │   └── queue.ts           # BullMQ setup
│   │   ├── routes/
│   │   │   └── api.ts             # API endpoints
│   │   ├── services/
│   │   │   ├── crawler.service.ts # Web crawler
│   │   │   ├── generator.service.ts # MCP generator
│   │   │   └── github.service.ts  # GitHub export
│   │   ├── types/
│   │   │   └── jobs.ts            # Job type definitions
│   │   ├── server.ts              # Express server
│   │   └── worker.ts              # Background worker
│   ├── prisma/
│   │   └── schema.prisma          # Database schema
│   ├── Dockerfile
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── UploadTab.tsx     # File upload UI
│   │   │   ├── CrawlTab.tsx      # Crawl UI
│   │   │   └── SchemaList.tsx    # Schema management
│   │   ├── lib/
│   │   │   └── api.ts            # API client
│   │   ├── App.tsx               # Main app
│   │   └── index.css             # Tailwind styles
│   ├── Dockerfile
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.ts
├── docker-compose.yml
├── README.md
└── sample-petstore.json          # Test schema
```

## 🚀 Getting Started

### Prerequisites
- Docker & Docker Compose
- (Optional) Node.js 18+ for local development

### Quick Start

```bash
# Clone or navigate to project
cd swagger2mcp

# Start all services
docker-compose up --build

# Access the application
# Frontend: http://localhost:5173
# Backend API: http://localhost:3000
```

### Local Development

#### Backend
```bash
cd backend
npm install
npm run dev        # Start API server (port 3000)
npm run worker     # Start worker (separate terminal)
```

#### Frontend
```bash
cd frontend
npm install
npm run dev        # Start dev server (port 5173)
```

## 🔌 API Endpoints

### POST /api/upload
Upload an OpenAPI schema file.

**Request:**
- `schema`: File (multipart/form-data)
- `sessionId`: String (optional)

**Response:**
```json
{
  "jobId": "uuid",
  "status": "queued",
  "message": "File uploaded and processing started"
}
```

### POST /api/crawl
Start a crawl job.

**Request:**
```json
{
  "url": "https://api.example.com/docs",
  "depth": 2,
  "sessionId": "uuid"
}
```

**Response:**
```json
{
  "jobId": "uuid",
  "status": "queued",
  "message": "Crawl job started"
}
```

### GET /api/schemas?sessionId=uuid
List all schemas for a session.

**Response:**
```json
[
  {
    "id": "uuid",
    "type": "UPLOAD",
    "content": "{...}",
    "url": null,
    "createdAt": "2025-12-02T19:00:00.000Z"
  }
]
```

### POST /api/generate
Generate and download MCP server code.

**Request:**
```json
{
  "schemaId": "uuid",
  "language": "typescript"
}
```

**Response:** ZIP file download

### POST /api/export
Export to GitHub.

**Request:**
```json
{
  "schemaId": "uuid",
  "language": "typescript",
  "githubToken": "ghp_...",
  "owner": "username",
  "repoName": "my-mcp-server"
}
```

**Response:**
```json
{
  "url": "https://github.com/username/my-mcp-server"
}
```

## 🗄️ Database Schema

```prisma
model Session {
  id        String   @id @default(uuid())
  createdAt DateTime @default(now())
  schemas   Schema[]
}

model Schema {
  id        String   @id @default(uuid())
  sessionId String
  session   Session  @relation(fields: [sessionId], references: [id])
  type      String   // "UPLOAD" or "CRAWL"
  content   String   // JSON content of the schema
  url       String?  // Source URL if crawled
  createdAt DateTime @default(now())
}
```

## 🧪 Testing

### Test with Sample Schema

1. Start the application
2. Navigate to http://localhost:5173
3. Upload `sample-petstore.json`
4. Wait for processing
5. Select language and click "Download"
6. Or export to GitHub with your credentials

### Test Crawling

1. Enter a URL with OpenAPI docs (e.g., `https://petstore.swagger.io`)
2. Set crawl depth (1-5)
3. Click "Start Crawl"
4. Monitor progress in console logs

## 🔧 Configuration

### Environment Variables

#### Backend (.env)
```env
PORT=3000
REDIS_HOST=redis
REDIS_PORT=6379
DATABASE_URL=postgresql://postgres:postgres@postgres:5432/swagger2mcp?schema=public
```

#### Frontend (.env)
```env
VITE_API_URL=http://localhost:3000/api
```

## 📦 Generated MCP Server Structure

```
mcp-server-generated/
├── src/
│   └── index.ts          # MCP server implementation
├── package.json
└── tsconfig.json
```

The generated server includes:
- MCP SDK integration
- Tool definitions from OpenAPI operations
- Axios HTTP client for API calls
- TypeScript types

## 🛠️ Technology Stack

### Frontend
- React 18
- TypeScript
- Vite
- TailwindCSS
- Axios
- Lucide React (icons)

### Backend
- Node.js 18
- Express
- TypeScript
- BullMQ (job queue)
- Prisma (ORM)
- PostgreSQL
- Redis
- Multer (file uploads)
- Axios & Cheerio (web crawling)
- JSZip (code packaging)
- Octokit (GitHub API)

## 🎨 UI Features

- **Dark Mode Design**: Modern gradient background
- **Tabbed Interface**: Upload vs Crawl
- **Real-time Updates**: Schema list refreshes after jobs
- **Progress Indicators**: Loading states and messages
- **Modal Dialogs**: GitHub export configuration
- **Responsive Layout**: Grid-based responsive design

## 🔐 Security Notes

- Anonymous sessions (no authentication required)
- GitHub tokens handled client-side only
- File uploads validated for JSON/YAML
- OpenAPI schema validation before processing

## 📝 Logs

All services log to stdout for Docker:
- Backend: API requests, errors
- Worker: Job processing, crawl progress
- Frontend: Build output, dev server

View logs:
```bash
docker-compose logs -f backend
docker-compose logs -f worker
docker-compose logs -f frontend
```

## 🚧 Future Enhancements

- [ ] Python MCP server generation
- [ ] GitLab export support
- [ ] YAML file upload support
- [ ] Job cancellation
- [ ] Job restart
- [ ] WebSocket for real-time progress
- [ ] Authentication system
- [ ] Multi-schema merging
- [ ] Custom templates
- [ ] API testing interface

## 📄 License

MIT

---

**Built with ❤️ for the MCP ecosystem**
