# API Documentation

## Base URL
```
http://localhost:3000/api
```

## Authentication
Currently uses anonymous sessions. Session ID is stored in HTTP-only cookie `swagger2mcp_session`.

## Common Headers
```
Content-Type: application/json
Cookie: swagger2mcp_session=<uuid>
```

---

## Endpoints

### Upload Schema

Upload an OpenAPI/Swagger schema file.

**Endpoint**: `POST /api/upload`

**Content-Type**: `multipart/form-data`

**Request**:
```bash
curl -X POST http://localhost:3000/api/upload \
  -F "file=@swagger.json"
```

**Response**: `200 OK`
```json
{
  "message": "Upload queued for processing",
  "jobId": "uuid-job-id"
}
```

**Errors**:
- `400 Bad Request` - No file provided or invalid file type
- `413 Payload Too Large` - File exceeds 10MB limit

---

### Crawl URL

Start a web crawl to discover OpenAPI schemas.

**Endpoint**: `POST /api/crawl`

**Request Body**:
```json
{
  "url": "https://example.com",
  "depth": 2,
  "authHeader": "Authorization",
  "authValue": "Bearer token",
  "rateLimit": 100,
  "userAgent": "Swagger2MCP-Crawler/1.0",
  "followRedirects": true
}
```

**Parameters**:
- `url` (required): Base URL to crawl
- `depth` (optional, 1-5): Crawl depth (default: 1)
- `authHeader` (optional): Authentication header name
- `authValue` (optional): Authentication header value
- `rateLimit` (optional, 0-2000ms): Delay between requests (default: 100)
- `userAgent` (optional): Custom User-Agent string
- `followRedirects` (optional): Follow HTTP redirects (default: true)

**Response**: `200 OK`
```json
{
  "message": "Crawl started",
  "jobId": "uuid-job-id"
}
```

**Errors**:
- `400 Bad Request` - Invalid URL or depth out of range

---

### Get Schemas

List all schemas for the current session.

**Endpoint**: `GET /api/schemas`

**Response**: `200 OK`
```json
[
  {
    "id": "schema-uuid",
    "type": "UPLOAD",
    "url": null,
    "createdAt": "2025-12-03T20:00:00.000Z",
    "content": "{...openapi spec...}"
  },
  {
    "id": "schema-uuid-2",
    "type": "CRAWL",
    "url": "https://example.com/swagger.json",
    "createdAt": "2025-12-03T20:01:00.000Z",
    "content": "{...openapi spec...}"
  }
]
```

---

### Get Schema by ID

Retrieve a specific schema.

**Endpoint**: `GET /api/schemas/:id`

**Response**: `200 OK`
```json
{
  "id": "schema-uuid",
  "sessionId": "session-uuid",
  "type": "UPLOAD",
  "url": null,
  "createdAt": "2025-12-03T20:00:00.000Z",
  "content": "{...openapi spec...}",
  "version": 1,
  "parentId": null
}
```

**Errors**:
- `404 Not Found` - Schema not found

---

### Update Schema

Update schema content.

**Endpoint**: `PUT /api/schemas/:id`

**Request Body**:
```json
{
  "content": "{...updated openapi spec...}"
}
```

**Response**: `200 OK`
```json
{
  "id": "schema-uuid",
  "version": 2,
  "message": "Schema updated successfully"
}
```

**Errors**:
- `400 Bad Request` - Invalid JSON content
- `404 Not Found` - Schema not found

---

### Delete Schema

Delete a schema.

**Endpoint**: `DELETE /api/schemas/:id`

**Response**: `200 OK`
```json
{
  "message": "Schema deleted",
  "id": "schema-uuid"
}
```

**Errors**:
- `404 Not Found` - Schema not found

---

### Generate MCP Server

Generate and download an MCP server package.

**Endpoint**: `POST /api/generate`

**Request Body**:
```json
{
  "schemaId": "schema-uuid",
  "language": "typescript",
  "options": {
    "includeTestUI": true,
    "packageName": "my-mcp-server",
    "version": "1.0.0",
    "serverName": "My API Server",
    "serverDescription": "MCP server for My API"
  }
}
```

**Parameters**:
- `schemaId` (required): Schema UUID
- `language` (optional): `"typescript"` or `"python"` (default: typescript)
- `options.includeTestUI` (optional): Include test UI (default: true)
- `options.packageName` (optional): NPM package name
- `options.version` (optional): Package version (default: 1.0.0)
- `options.serverName` (optional): Display name
- `options.serverDescription` (optional): Description

**Response**: `200 OK` (application/zip)
- Returns a ZIP file containing the generated MCP server project

**Errors**:
- `404 Not Found` - Schema not found
- `500 Internal Server Error` - Generation failed

---

### Batch Generate

Generate multiple MCP servers in a single ZIP.

**Endpoint**: `POST /api/generate/batch`

**Request Body**:
```json
{
  "schemaIds": ["uuid-1", "uuid-2"],
  "language": "typescript",
  "options": {
    "includeTestUI": true
  }
}
```

**Response**: `200 OK` (application/zip)
- Returns a ZIP containing multiple server projects

---

### Export to GitHub

Export generated MCP server to GitHub repository.

**Endpoint**: `POST /api/export/github`

**Request Body**:
```json
{
  "schemaId": "schema-uuid",
  "language": "typescript",
  "githubToken": "ghp_...",
  "owner": "username",
  "repo": "my-mcp-server",
  "commitMessage": "Initial commit from Swagger2MCP"
}
```

**Response**: `200 OK`
```json
{
  "url": "https://github.com/username/my-mcp-server"
}
```

**Errors**:
- `400 Bad Request` - Missing required fields
- `404 Not Found` - Schema not found
- `500 Internal Server Error` - GitHub API error

---

### Export to GitLab

Export generated MCP server to GitLab repository.

**Endpoint**: `POST /api/export/gitlab`

**Request Body**:
```json
{
  "schemaId": "schema-uuid",
  "language": "typescript",
  "gitlabToken": "glpat-...",
  "projectPath": "username/my-mcp-server",
  "host": "https://gitlab.com",
  "branch": "main",
  "commitMessage": "Initial commit from Swagger2MCP"
}
```

**Response**: `200 OK`
```json
{
  "url": "https://gitlab.com/username/my-mcp-server"
}
```

---

### Job Status

Get status of a background job.

**Endpoint**: `GET /api/jobs/:id`

**Response**: `200 OK`
```json
{
  "id": "job-uuid",
  "state": "completed",
  "progress": 100,
  "result": {
    "schemasFound": 1
  }
}
```

**Job States**:
- `waiting` - In queue
- `active` - Processing
- `completed` - Successfully finished
- `failed` - Error occurred
- `delayed` - Scheduled for later

---

### Cancel Job

Cancel a running or pending job.

**Endpoint**: `DELETE /api/jobs/:id`

**Response**: `200 OK`
```json
{
  "message": "Job cancelled",
  "id": "job-uuid"
}
```

---

### List Jobs

List all jobs for the current session.

**Endpoint**: `GET /api/jobs`

**Response**: `200 OK`
```json
[
  {
    "id": "job-uuid",
    "name": "CRAWL",
    "state": "completed",
    "progress": 100,
    "timestamp": 1733259600000
  }
]
```

---

### Webhooks

#### List Webhooks

**Endpoint**: `GET /api/webhooks`

**Response**: `200 OK`
```json
[
  {
    "id": "webhook-uuid",
    "url": "https://example.com/webhook",
    "events": ["job.completed", "schema.created"],
    "active": true,
    "createdAt": "2025-12-03T20:00:00.000Z"
  }
]
```

#### Create Webhook

**Endpoint**: `POST /api/webhooks`

**Request Body**:
```json
{
  "url": "https://example.com/webhook",
  "events": ["job.completed", "job.failed"],
  "secret": "optional-hmac-secret"
}
```

**Response**: `201 Created`
```json
{
  "id": "webhook-uuid",
  "message": "Webhook created"
}
```

#### Update Webhook

**Endpoint**: `PUT /api/webhooks/:id`

**Request Body**:
```json
{
  "active": false,
  "events": ["schema.created"]
}
```

**Response**: `200 OK`
```json
{
  "id": "webhook-uuid",
  "message": "Webhook updated"
}
```

#### Delete Webhook

**Endpoint**: `DELETE /api/webhooks/:id`

**Response**: `200 OK`
```json
{
  "message": "Webhook deleted",
  "id": "webhook-uuid"
}
```

---

### Health Check

Get system health status.

**Endpoint**: `GET /api/health`

**Response**: `200 OK` or `503 Service Unavailable`
```json
{
  "status": "healthy",
  "timestamp": "2025-12-03T21:00:00.000Z",
  "uptime": 3600,
  "version": "1.0.0",
  "checks": {
    "redis": {
      "status": "healthy",
      "latency": 2
    },
    "postgres": {
      "status": "healthy",
      "latency": 150
    },
    "queue": {
      "status": "healthy",
      "latency": 0,
      "waiting": 0,
      "active": 1,
      "failed": 0
    },
    "synthetic": {
      "status": "healthy",
      "latency": 40,
      "tests": {
        "database_read": true,
        "session_lookup": true,
        "generator_loaded": true
      }
    },
    "filesystem": {
      "status": "healthy",
      "latency": 0
    }
  }
}
```

---

### Metrics

Get Prometheus-formatted metrics.

**Endpoint**: `GET /api/metrics`

**Response**: `200 OK` (text/plain)
```
# HELP swagger2mcp_uptime_seconds Server uptime
# TYPE swagger2mcp_uptime_seconds gauge
swagger2mcp_uptime_seconds 3600

# HELP swagger2mcp_jobs_total Total jobs by status
# TYPE swagger2mcp_jobs_total gauge
swagger2mcp_jobs_total{status="waiting"} 0
swagger2mcp_jobs_total{status="active"} 1
swagger2mcp_jobs_total{status="completed"} 42
swagger2mcp_jobs_total{status="failed"} 2
...
```

---

## Rate Limiting

All `/api/*` endpoints are rate limited to:
- **100 requests per 15 minutes** per IP address

Rate limit headers:
```
RateLimit-Limit: 100
RateLimit-Remaining: 99
RateLimit-Reset: 1733260500
```

**Error Response**: `429 Too Many Requests`
```json
{
  "error": "Too many requests, please try again later."
}
```

---

## Error Responses

All errors follow this format:

```json
{
  "error": "Human-readable error message",
  "code": "ERROR_CODE",
  "details": {}
}
```

**Common HTTP Status Codes**:
- `400 Bad Request` - Invalid input
- `404 Not Found` - Resource not found
- `413 Payload Too Large` - File too large
- `429 Too Many Requests` - Rate limit exceeded
- `500 Internal Server Error` - Server error
- `503 Service Unavailable` - Service unhealthy

---

## Webhook Payload Format

When events occur, webhooks receive:

**Request**:
```
POST <webhook-url>
Content-Type: application/json
X-Swagger2MCP-Signature: sha256=<hmac>
X-Swagger2MCP-Event: job.completed
```

**Body**:
```json
{
  "event": "job.completed",
  "timestamp": "2025-12-03T21:00:00.000Z",
  "sessionId": "session-uuid",
  "data": {
    "jobId": "job-uuid",
    "result": {
      "schemasFound": 1
    }
  }
}
```

**Events**:
- `job.completed` - Job finished successfully
- `job.failed` - Job failed with error
- `schema.created` - New schema added
- `schema.updated` - Schema modified
- `schema.deleted` - Schema removed

---

## Examples

### Complete Upload Flow

```bash
# 1. Upload file
RESPONSE=$(curl -X POST http://localhost:3000/api/upload \
  -F "file=@swagger.json")
JOB_ID=$(echo $RESPONSE | jq -r '.jobId')

# 2. Check job status
curl http://localhost:3000/api/jobs/$JOB_ID

# 3. List schemas (after job completes)
curl http://localhost:3000/api/schemas

# 4. Generate MCP server
SCHEMA_ID=<from-step-3>
curl -X POST http://localhost:3000/api/generate \
  -H "Content-Type: application/json" \
  -d "{\"schemaId\":\"$SCHEMA_ID\"}" \
  --output mcp-server.zip
```

### Complete Crawl Flow

```bash
# 1. Start crawl
RESPONSE=$(curl -X POST http://localhost:3000/api/crawl \
  -H "Content-Type: application/json" \
  -d '{"url":"https://petstore.swagger.io/v2/swagger.json","depth":1}')
JOB_ID=$(echo $RESPONSE | jq -r '.jobId')

# 2. Monitor progress
watch -n 1 "curl -s http://localhost:3000/api/jobs/$JOB_ID | jq '.progress'"

# 3. Get results
curl http://localhost:3000/api/schemas
```

---

## Client Libraries

### JavaScript/TypeScript

See `frontend/src/lib/api.ts` for a complete axios-based client implementation.

```typescript
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3000/api',
  timeout: 30000,
  withCredentials: true
});

// Upload file
const formData = new FormData();
formData.append('file', file);
const response = await api.post('/upload', formData);

// Get schemas
const schemas = await api.get('/schemas');
```

---

## Changelog

- **v1.0.0** (2025-12-03): Initial API documentation
