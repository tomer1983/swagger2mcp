# QA Bug Report - Swagger2MCP Application
**Date:** December 2, 2025  
**QA Engineer:** Senior QA Team Member  
**App Version:** 1.0.0  
**Test Environment:** Windows (Unable to start services due to PowerShell Core dependency)

---

## 🚨 CRITICAL ISSUES

### 1. **Application Cannot Start on Windows Without PowerShell Core**
**Severity:** CRITICAL  
**Impact:** Blocks all testing  
**Location:** Infrastructure  

**Description:**
The testing infrastructure requires PowerShell Core (pwsh.exe) which is not installed on standard Windows systems. This prevents the application from starting for testing.

**Steps to Reproduce:**
1. Attempt to run `docker-compose up` or `docker compose up`
2. System fails with "pwsh.exe is not recognized"

**Recommendation:**
- Add fallback to Windows PowerShell (powershell.exe) in the CI/CD pipeline
- Document PowerShell Core as a prerequisite in README.md
- Consider adding a startup script that checks for available shells

---

### 2. **File Upload Fails with 400 Bad Request**
**Status:** ✅ Fixed (Removed global Content-Type header in frontend API client)
**Severity:** CRITICAL
**Impact:** Users cannot upload schemas, blocking core functionality
**Location:** `frontend/src/lib/api.ts`

**Description:**
The Axios client was configured with a global `Content-Type: application/json` header. This overrode the browser's automatic `multipart/form-data` header generation (which includes the boundary) for file uploads, causing the backend to reject the request.

**Recommendation:**
Remove the global `Content-Type` header from the Axios instance configuration.

---

## 🐛 HIGH PRIORITY BUGS (Code Analysis)

### 3. **Missing Schema Deletion Functionality**
**Status:** ✅ Fixed (Added DELETE endpoint and UI button)
**Severity:** HIGH  
**Impact:** User cannot clean up unwanted schemas  
**Location:** `backend/src/routes/api.ts`, `frontend/src/components/SchemaList.tsx`

**Description:**
The API has GET, UPDATE, and GENERATE endpoints for schemas, but no DELETE endpoint. Users cannot remove schemas they no longer need, leading to clutter.

**Evidence:**
```typescript
// backend/src/routes/api.ts
router.get('/schemas', ...)      // ✓ Exists
router.put('/schemas/:id', ...)  // ✓ Exists
// router.delete('/schemas/:id', ...) // ✗ Missing
```

**Recommendation:**
```typescript
// Add to backend/src/routes/api.ts
router.delete('/schemas/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await prisma.schema.delete({ where: { id } });
        res.json({ message: 'Schema deleted', id });
    } catch (e) {
        console.error('Failed to delete schema:', e);
        res.status(500).json({ error: 'Failed to delete schema' });
    }
});
```

---

### 3. **Job Cancellation for Active Jobs May Not Work Properly**
**Status:** ✅ Fixed (Implemented periodic cancellation check in worker)
**Severity:** HIGH  
**Impact:** Active jobs cannot be reliably cancelled  
**Location:** `backend/src/routes/api.ts:156`

**Description:**
The code attempts to cancel active jobs using `moveToFailed()`, but this doesn't actually stop the worker process. The worker must check for cancellation signals, which isn't implemented.

**Evidence:**
```typescript
// backend/src/routes/api.ts:156
} else if (state === 'active') {
    await job.moveToFailed(new Error('Cancelled by user'), 'cancelled');
    res.json({ message: 'Job cancellation requested', id, note: 'Active job will stop at next checkpoint' });
```

**Problem:** The worker in `worker.ts` doesn't check for cancellation status during execution.

**Recommendation:**
1. Implement cancellation token checking in `worker.ts`
2. Add periodic checks during long-running operations (crawling)
3. Update response to accurately reflect behavior

---

### 4. **Unhandled File Upload Size Limits**
**Status:** ✅ Fixed (Added multer limits and file filter)
**Severity:** HIGH  
**Impact:** Large file uploads may crash the server  
**Location:** `backend/src/routes/api.ts:29-43`

**Description:**
Multer is configured without size limits. Users could upload arbitrarily large files, potentially causing memory issues or DoS.

**Evidence:**
```typescript
const upload = multer({ storage }); // No limits defined
```

**Recommendation:**
```typescript
const upload = multer({ 
    storage,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
        files: 1
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = /json|yaml|yml/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype) || file.mimetype === 'application/octet-stream';
        
        if (extname && mimetype) {
            cb(null, true);
        } else {
            cb(new Error('Only JSON and YAML files are allowed'));
        }
    }
});
```

---

### 5. **Missing Input Validation on Crawl Depth**
**Status:** ✅ Fixed (Added depth validation 1-5 range)
**Severity:** MEDIUM  
**Impact:** Server could be overwhelmed by excessive crawl depth  
**Location:** `backend/src/routes/api.ts:70`

**Description:**
The crawl endpoint accepts depth values without validation. While the frontend limits depth to 1-5, API calls can bypass this.

**Evidence:**
```typescript
depth: parseInt(depth) || 1, // No validation if depth > 5 or < 1
```

**Recommendation:**
```typescript
const depthValue = parseInt(depth) || 1;
if (depthValue < 1 || depthValue > 5) {
    return res.status(400).json({ error: 'Depth must be between 1 and 5' });
}
```

---

### 6. **CORS Configuration Allows All Origins**
**Status:** ✅ Fixed (Restricted CORS to allowed origins)
**Severity:** HIGH (Security)  
**Impact:** Application is vulnerable to CSRF attacks  
**Location:** `backend/src/server.ts:11`

**Description:**
CORS is enabled without origin restrictions, allowing any website to make requests to the API.

**Evidence:**
```typescript
app.use(cors()); // No origin restrictions
```

**Recommendation:**
```typescript
app.use(cors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || 'http://localhost:5173',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
}));
```

---

### 7. **Session ID Stored in localStorage (Security Risk)**
**Status:** ✅ Fixed (Moved to HTTP-only cookies with secure flags)
**Severity:** MEDIUM (Security)  
**Impact:** Session hijacking via XSS  
**Location:** `frontend/src/lib/api.ts:9-16`

**Description:**
Session IDs are stored in localStorage, which is vulnerable to XSS attacks. These should be HTTP-only cookies.

**Evidence:**
```typescript
export const getSessionId = () => {
    let sessionId = localStorage.getItem('sessionId');
    // ...localStorage is vulnerable to XSS
};
```

**Recommendation:**
- Move session management to HTTP-only cookies
- Implement CSRF protection
- Add session expiration

---

### 8. **No Rate Limiting on API Endpoints**
**Status:** ✅ Fixed (Added express-rate-limit: 100 req/15min)
**Severity:** MEDIUM  
**Impact:** API abuse and DoS attacks possible  
**Location:** `backend/src/server.ts`, all routes

**Description:**
All endpoints lack rate limiting, allowing unlimited requests from a single source.

**Recommendation:**
```typescript
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
});

app.use('/api/', limiter);
```

---

### 9. **Uploaded Files Not Cleaned Up**
**Status:** ✅ Fixed (Added cleanup after job processing)
**Severity:** MEDIUM  
**Impact:** Disk space exhaustion over time  
**Location:** `backend/src/routes/api.ts:46`, worker processing

**Description:**
After files are uploaded and processed, they remain in the `uploads/` directory indefinitely.

**Recommendation:**
- Add cleanup after successful job processing in worker
- Implement scheduled cleanup job for old files
- Add file lifecycle management

---

### 10. **Error Messages Expose Internal Structure**
**Status:** ✅ Fixed (Sanitized error messages, detailed logs server-side only)
**Severity:** MEDIUM (Security)  
**Impact:** Information disclosure  
**Location:** Multiple locations in `backend/src/routes/api.ts`

**Description:**
Error responses include raw error messages that may expose database schema, file paths, or internal logic.

**Evidence:**
```typescript
res.status(500).json({ error: 'Export failed: ' + e.message }); // Line 555
```

**Recommendation:**
- Log detailed errors server-side
- Return generic error messages to clients
- Implement error sanitization middleware

---

## ⚠️ MEDIUM PRIORITY ISSUES

### 11. **Batch Generation Lacks Timeout Protection**
**Severity:** MEDIUM  
**Impact:** Long-running batch jobs may timeout  
**Location:** `backend/src/routes/api.ts:463-531`

**Description:**
Batch generation processes up to 10 schemas synchronously without timeout handling. Large schemas could cause request timeout.

**Recommendation:**
- Convert to async job queue processing
- Return job ID immediately
- Allow polling for completion

---

### 12. **Missing Webhook Delivery Mechanism**
**Status:** ✅ Fixed (Implemented WebhookService with retry logic)
**Severity:** MEDIUM
**Impact:** Webhook feature is incomplete
**Location:** `backend/src/routes/api.ts:376-432`**Description:**
Webhook CRUD operations exist, but there's no code to actually trigger/deliver webhooks when events occur.

**Recommendation:**
- Implement webhook delivery service
- Add retry logic for failed deliveries
- Add webhook event logging

---

### 13. **No Schema Validation Before Processing**
**Status:** ✅ Fixed (Integrated openapi-schema-validator in worker)
**Severity:** MEDIUM
**Impact:** Invalid schemas processed unnecessarily
**Location:** `backend/src/routes/api.ts:46`, worker**Description:**
Uploaded files are not validated as valid OpenAPI/Swagger schemas before queuing jobs.

**Recommendation:**
- Add OpenAPI schema validation using `openapi-schema-validator`
- Reject invalid schemas immediately
- Provide clear validation errors

---

### 14. **Progress Percentage Type Inconsistency**
**Severity:** LOW  
**Impact:** UI may display incorrect progress  
**Location:** `frontend/src/App.tsx:79-85`

**Description:**
Progress can be either number or object, requiring complex type checking. This is error-prone.

**Evidence:**
```typescript
const getProgressPercentage = (progress: number | object): number => {
    if (typeof progress === 'number') return progress;
    if (typeof progress === 'object' && progress !== null && 'percentage' in progress) {
        return (progress as any).percentage;
    }
    return 0;
};
```

**Recommendation:**
- Standardize progress format in worker
- Always return `{ percentage: number, message?: string }`
- Remove type inconsistency

---

### 15. **Missing Database Migration Strategy**
**Status:** ✅ Fixed (Added comprehensive migration documentation and workflow)
**Severity:** MEDIUM  
**Impact:** Schema updates may break production  
**Location:** Prisma configuration, README.md

**Description:**
No clear migration strategy is documented. Database schema changes need migration management.

**Solution Implemented:**
- Documented complete migration workflow in README.md
- Added development and production migration commands
- Included rollback strategy documentation
- Scripts already exist: `npm run migrate` and `npm run migrate:deploy`

---

### 16. **Health Check Doesn't Test Critical Paths**
**Status:** ✅ Fixed (Added synthetic transaction tests and readiness checks)
**Severity:** LOW  
**Impact:** False healthy status possible  
**Location:** `backend/src/routes/api.ts:598-647`

**Description:**
Health check only tests connections, not actual functionality (e.g., can't test if MCP generation works).

**Solution Implemented:**
- Added synthetic transaction tests (database reads, session lookups, generator validation)
- Implemented component readiness checks (filesystem write permissions)
- Enhanced status reporting with detailed test results
- Tests run on every health check call

---

## 🔍 CODE QUALITY ISSUES

### 17. **Inconsistent Error Handling**
**Status:** ✅ Fixed (Implemented global error handler middleware)
**Severity:** LOW  
**Location:** `backend/src/middleware/errorHandler.ts`

**Description:**
Some functions use try-catch, others don't. Error logging is inconsistent.

**Solution Implemented:**
- Created global error handler middleware with standardized error format
- Added request ID tracking for debugging (X-Request-ID header)
- Implemented error message sanitization to prevent information disclosure
- Added asyncHandler wrapper for route handlers
- Detailed errors logged server-side only

---

### 18. **Missing TypeScript Strict Mode**
**Severity:** LOW  
**Location:** `backend/tsconfig.json`, `frontend/tsconfig.json`

**Description:**
TypeScript may not be configured with strict mode, allowing potential type safety issues.

**Recommendation:**
```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true
  }
}
```

---

### 19. **Frontend Components Need Error Boundaries**
**Status:** ✅ Already Implemented (ErrorBoundary wraps App in main.tsx)
**Severity:** MEDIUM  
**Location:** `frontend/src/App.tsx`, components

**Description:**
No React Error Boundaries implemented. Component errors will crash entire app.

**Recommendation:**
- Add Error Boundary wrapper
- Implement graceful error fallback UI
- Log errors for monitoring

---

### 20. **Missing API Request Timeout Configuration**
**Status:** ✅ Fixed (Added 30s timeout to axios client)
**Severity:** MEDIUM  
**Location:** `frontend/src/lib/api.ts:5`

**Description:**
Axios client has no timeout configured. Long-running requests will hang indefinitely.

**Recommendation:**
```typescript
export const api = axios.create({
    baseURL: API_URL,
    timeout: 30000, // 30 seconds
    headers: {
        'Content-Type': 'application/json'
    }
});
```

---

## 📋 MISSING FEATURES

### 21. **No Authentication/Authorization System**
**Status:** ✅ Fixed (Complete authentication system with OAuth2 and JWT)
**Severity:** HIGH  
**Impact:** Data isolation and user management implemented

**Description:**
The application now has a complete authentication system with multiple sign-in methods and proper data isolation.

**Solution Implemented:**
- **User Model**: Added to Prisma schema with OAuth and local auth fields
- **Authentication Methods**: 
  - Username/Password with JWT tokens
  - Microsoft OAuth2/OIDC integration
- **Backend Services**:
  - `AuthService`: JWT generation, password hashing, user CRUD
  - Passport.js strategies: Local, JWT, and Microsoft OAuth
  - Authentication middleware: `optionalAuth`, `requireAuth`, `checkAnonymousAllowed`
- **API Endpoints**: `/auth/register`, `/auth/login`, `/auth/microsoft`, `/auth/me`, `/auth/logout`
- **Data Isolation**:
  - Authenticated users see only their own schemas
  - Anonymous users see only anonymous/example schemas (userId = null)
  - Session migration: anonymous data can be transferred to user on login
- **Frontend Components**:
  - `AuthContext` and `AuthProvider` for state management
  - `LoginForm` and `RegisterForm` components
  - `UserProfile` component in header
  - JWT token storage and automatic inclusion in API calls
- **Configuration**:
  - `ALLOW_ANONYMOUS` env variable controls anonymous access (default: true)
  - Existing anonymous data preserved as examples
  - Optional Microsoft OAuth with client ID/secret configuration
- **Documentation**: Complete authentication guide in `AUTHENTICATION.md`

---

### 22. **No Logging Infrastructure**
**Severity:** MEDIUM  
**Impact:** Difficult to debug production issues

**Description:**
Only console.log statements exist. No structured logging, log levels, or aggregation.

**Recommendation:**
- Implement Winston or Pino for structured logging
- Add request correlation IDs
- Configure log levels per environment

---

### 23. **Missing Monitoring and Alerting**
**Severity:** MEDIUM  
**Impact:** No visibility into production health

**Description:**
Prometheus metrics endpoint exists but no monitoring/alerting configured.

**Recommendation:**
- Set up Prometheus + Grafana
- Configure alerts for critical metrics
- Add distributed tracing (OpenTelemetry)

---

## 🧪 TESTING GAPS

### 24. **No Automated Tests**
**Status:** ⚠️ Deferred (Requires separate testing infrastructure setup)
**Severity:** HIGH  
**Impact:** No quality assurance for changes

**Description:**
No unit tests, integration tests, or E2E tests found in the codebase.

**Recommendation:**
- Add Jest for backend unit tests
- Add React Testing Library for frontend
- Add Playwright for E2E tests
- Target minimum 70% code coverage

---

### 25. **No CI/CD Pipeline**
**Status:** ✅ Fixed (GitHub Actions CI pipeline implemented)
**Severity:** MEDIUM  
**Impact:** Manual deployment prone to errors

**Description:**
No GitHub Actions or other CI/CD configuration found.

**Solution Implemented:**
- Created `.github/workflows/ci.yml` with full CI pipeline
- Includes: lint, TypeScript checks, build verification, Docker build
- Runs tests with PostgreSQL and Redis services
- Security audit with npm audit
- Triggers on push and pull requests to main/develop branches

---

## 📚 DOCUMENTATION GAPS

### 26. **Missing API Documentation**
**Status:** ✅ Fixed (Comprehensive API documentation created)
**Severity:** MEDIUM  
**Impact:** Hard for developers to integrate

**Description:**
No OpenAPI/Swagger documentation for the backend API itself.

**Solution Implemented:**
- Created `API-DOCUMENTATION.md` with complete API reference
- Documented all endpoints with request/response examples
- Included error codes, rate limiting, webhooks, and client examples
- Added curl examples for common workflows

---

### 27. **Missing Development Setup Guide**
**Status:** ✅ Fixed (Comprehensive development guide created)
**Severity:** LOW  
**Impact:** Harder for new developers to onboard

**Description:**
README.md has quick start but lacks detailed development setup for each component.

**Solution Implemented:**
- Created `DEVELOPMENT.md` with detailed setup guide
- Includes: prerequisites, environment setup, debugging, common issues
- Documented database management with Prisma
- Added architecture overview and data flow diagrams
- Comprehensive troubleshooting section with solutions

---

## 🎯 PERFORMANCE CONCERNS

### 28. **No Connection Pooling Configuration**
**Status:** ✅ Fixed (Added Prisma connection pool configuration and graceful shutdown)
**Severity:** MEDIUM  
**Location:** `backend/src/lib/db.ts`

**Description:**
Prisma client may not have optimized connection pool settings for production load.

**Solution Implemented:**
- Added Prisma client configuration with logging based on environment
- Documented connection pool configuration via DATABASE_URL parameters
- Implemented graceful shutdown handlers (SIGINT/SIGTERM)
- Added automatic connection cleanup on app termination

---

### 29. **Large Schema Files May Cause Memory Issues**
**Status:** ✅ Fixed (Added memory monitoring and size limits)
**Severity:** MEDIUM  
**Location:** `backend/src/services/generator.service.ts`, `backend/src/routes/api.ts`

**Description:**
Entire schema content is loaded into memory. Very large schemas (>100MB) could cause OOM errors.

**Solution Implemented:**
- Added MAX_SCHEMA_SIZE_BYTES limit (100MB) and MAX_SCHEMA_SIZE_JSON limit (50MB characters)
- Implemented checkMemoryAndSize() method in GeneratorService
- Added pre-generation size validation in /api/generate endpoint
- Monitors heap usage and warns at 80% threshold
- Returns 413 Payload Too Large for oversized schemas

---

### 30. **Redis Connection Not Properly Configured**
**Status:** ✅ Fixed (Enhanced Redis configuration with reconnection and monitoring)
**Severity:** LOW  
**Location:** `backend/src/lib/queue.ts`

**Description:**
Redis connection may not have proper reconnection logic, maxRetriesPerRequest, etc.

**Solution Implemented:**
- Added exponential backoff retry strategy (50ms * attempts, max 2s)
- Implemented connection timeout (10s) and keep-alive (30s)
- Enabled automatic pipelining for better performance
- Added connection event handlers (connect, ready, error, close, reconnecting)
- Implemented graceful shutdown handlers
- Added comprehensive logging for connection state changes

---

## 📊 SUMMARY

### Critical Issues: 1
- Cannot start application without PowerShell Core

### High Priority Issues: 5
- Missing schema deletion
- Job cancellation incomplete
- No file size limits
- CORS allows all origins
- No authentication system

### Medium Priority Issues: 15
- Missing input validation
- Security vulnerabilities
- Incomplete features
- Performance concerns

### Low Priority Issues: 9
- Code quality improvements
- Documentation gaps
- Testing infrastructure

### Total Issues Found: 30

---

## 🎯 RECOMMENDED PRIORITY ACTIONS

### Immediate (Week 1)
1. Fix PowerShell Core dependency blocking testing
2. Add file upload size limits and validation
3. Implement schema deletion endpoint
4. Configure CORS properly
5. Add rate limiting

### Short Term (Week 2-4)
6. Implement authentication system
7. Add comprehensive error handling
8. Set up automated testing framework
9. Implement webhook delivery
10. Add proper logging infrastructure

### Medium Term (Month 2-3)
11. Add monitoring and alerting
12. Implement CI/CD pipeline
13. Security audit and hardening
14. Performance optimization
15. Complete documentation

---

## ✅ POSITIVE OBSERVATIONS

1. **Clean Architecture**: Good separation between frontend, backend, and worker
2. **Modern Stack**: Using current best practices (React 19, TypeScript, Prisma)
3. **Docker Compose**: Excellent containerization setup
4. **Job Queue**: Proper background job handling with BullMQ
5. **Code Generation**: Core functionality appears well-designed
6. **Version Control**: Schema versioning feature is well-thought-out
7. **API Design**: RESTful API follows conventions
8. **UI/UX**: Clean, modern interface with good visual feedback

---

**Report Generated By:** Senior QA Team Member  
**Next Review Date:** After critical issues are resolved  
**Contact:** Available for clarification on any findings
