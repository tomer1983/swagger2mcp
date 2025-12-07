# Crawl Enhancements Implementation

**Completed**: December 2, 2024  
**Phase**: 4 - Crawl Enhancements

## Overview

Enhanced the web crawler with advanced configuration options, stop/restart capabilities, and improved progress tracking. These features allow users to crawl protected APIs, control request rates, and resume interrupted crawls.

## Features Implemented

### 1. Stop/Restart Crawl

#### AbortController Integration
- **File**: `backend/src/services/crawler.service.ts`
- **Description**: Integrated `AbortSignal` support throughout the crawl loop
- **Implementation**:
  - Added `signal` parameter to `CrawlOptions` interface
  - Check `signal.aborted` before each URL visit
  - Gracefully stop crawling when abort signal received
  - Save remaining URLs to checkpoint for resume

#### Checkpoint System
- **Files**: `backend/src/services/crawler.service.ts`, `backend/src/worker.ts`
- **Description**: Save and resume crawl state
- **Implementation**:
  ```typescript
  interface CrawlCheckpoint {
    visited: string[];      // Already visited URLs
    pending: Array<{ url: string; depth: number }>;  // Pending URLs
    specs: string[];        // Found OpenAPI specs
  }
  ```
- **Methods**:
  - `getCheckpoint()`: Returns current crawl state
  - `resumeFromCheckpoint()`: Resumes from saved checkpoint
  - Checkpoint saved in job data on abort

#### Job Cancellation
- **File**: `backend/src/routes/api.ts`
- **Endpoint**: `DELETE /api/jobs/:id`
- **Enhancement**: Triggers abort controller for active crawl jobs
- **Behavior**:
  - Waiting/delayed jobs: Immediately removed from queue
  - Active jobs: Abort signal sent, stops at next checkpoint
  - Checkpoint saved for potential resume

### 2. Crawl Configuration Options

#### CrawlOptions Interface
```typescript
interface CrawlOptions {
  authHeaders?: Record<string, string>;  // Custom auth headers
  rateLimit?: number;                    // Delay in ms between requests
  userAgent?: string;                    // Custom User-Agent header
  followRedirects?: boolean;             // Toggle redirect following
  signal?: AbortSignal;                  // For cancellation support
  onProgress?: (current: number, total: number, url: string) => void;
}
```

#### Authentication Headers
- **Purpose**: Access protected API documentation
- **UI**: Auth Header + Auth Value input fields
- **Example**: `Authorization: Bearer token123`
- **Implementation**: Merged into axios request config

#### Rate Limiting
- **Purpose**: Prevent overwhelming target servers
- **UI**: Slider control (0-2000ms delay)
- **Default**: 100ms between requests
- **Implementation**: `await setTimeout()` between each request

#### Custom User Agent
- **Purpose**: Identify crawler, bypass basic filters
- **UI**: Text input field
- **Default**: `Swagger2MCP-Crawler/1.0`
- **Implementation**: Set in axios request headers

#### Follow Redirects
- **Purpose**: Control whether to follow HTTP redirects
- **UI**: Checkbox toggle
- **Default**: `true` (follow redirects)
- **Implementation**: `maxRedirects` in axios config (5 or 0)

### 3. Progress Tracking

#### Real-time Progress Updates
- **Callback**: `onProgress(current, total, url)`
- **Updates**: After each URL processed
- **Integration**: Connected to BullMQ job progress (10%-90% range)
- **Tracking**:
  - `processedUrls`: Number of URLs visited
  - `totalUrls`: Total URLs discovered
  - Current URL being crawled

#### Job Progress API
- **Endpoint**: `GET /api/jobs/:id`
- **Returns**: Current progress percentage
- **Frontend**: Progress bar updates via polling

### 4. Advanced Options UI

#### Collapsible Panel
- **Component**: `CrawlTab.tsx`
- **Trigger**: "Advanced Options" button with Settings icon
- **State**: Expandable/collapsible with chevron indicator
- **Styling**: Dark theme with gray-800 background

#### Form Layout
```
┌─────────────────────────────────────┐
│ Base URL                            │
│ [https://api.example.com/docs     ] │
├─────────────────────────────────────┤
│ Crawl Depth: 2                      │
│ [●────────] 1 (Fast) ↔ 5 (Deep)     │
├─────────────────────────────────────┤
│ ⚙️ Advanced Options ▼               │
│ ┌───────────────────────────────┐   │
│ │ Auth Header    │ Auth Value   │   │
│ │ [Authorization]│ [Bearer tok...]│  │
│ │                                │   │
│ │ Rate Limit: 100ms              │   │
│ │ [●──────] 0ms ↔ 2s             │   │
│ │                                │   │
│ │ User Agent                     │   │
│ │ [Swagger2MCP-Crawler/1.0]      │   │
│ │                                │   │
│ │ [✓] Follow redirects           │   │
│ └───────────────────────────────┘   │
└─────────────────────────────────────┘
```

## Technical Details

### Backend Changes

#### `crawler.service.ts`
- Added `CrawlOptions` and `CrawlCheckpoint` interfaces
- Enhanced `visit()` method with options support
- Implemented checkpoint save/restore logic
- Added progress tracking state variables
- Integrated abort signal checks

#### `worker.ts`
- Extract crawl options from job payload
- Create `AbortController` per job
- Pass options to crawler service
- Save checkpoint on abort/error
- Support checkpoint resume

#### `api.ts`
- Updated `POST /api/crawl` to accept options
- Enhanced `DELETE /api/jobs/:id` to abort crawls
- Pass options through to job payload

### Frontend Changes

#### `CrawlTab.tsx`
- Added state variables for all options
- Created collapsible advanced options panel
- Implemented auth header inputs
- Added rate limit slider
- Added user agent input
- Added follow redirects checkbox
- Built options object before API call

#### `api.ts`
- Updated `crawlUrl()` signature to accept options
- Pass options in request body

## Usage Examples

### Basic Crawl
```typescript
await crawlUrl('https://api.example.com/docs', 2);
```

### Authenticated Crawl
```typescript
await crawlUrl('https://api.example.com/docs', 2, {
  authHeaders: {
    'Authorization': 'Bearer token123'
  }
});
```

### Slow Crawl (Rate Limited)
```typescript
await crawlUrl('https://api.example.com/docs', 3, {
  rateLimit: 1000,  // 1 second delay between requests
  userAgent: 'MyBot/1.0'
});
```

### Cancel Crawl
```bash
curl -X DELETE http://localhost:3000/api/jobs/12345
```

### Resume Crawl (Automatic)
When a crawl is cancelled, the checkpoint is saved in the job data. Retrying the job will automatically resume from the checkpoint.

```bash
curl -X POST http://localhost:3000/api/jobs/12345/retry
```

## Testing Checklist

- [x] Start basic crawl without options
- [x] Start crawl with auth headers
- [x] Start crawl with custom user agent
- [x] Start crawl with rate limiting
- [x] Toggle follow redirects
- [x] Cancel active crawl
- [x] Verify checkpoint saved
- [x] Resume crawl from checkpoint
- [x] Progress updates display correctly
- [x] Advanced options panel toggles
- [x] All UI inputs work correctly

## Known Limitations

1. **Checkpoint Resume**: Currently manual via retry endpoint, not automatic UI button
2. **Progress Display**: Shows percentage but not specific URL being crawled in UI
3. **Auth Methods**: Only supports header-based auth, not OAuth flows
4. **Domain Restriction**: Still limits crawling to same hostname for depth > 0

## Future Enhancements

1. **Resume Button**: Add explicit "Resume Crawl" button in UI when checkpoint exists
2. **Crawl History**: Show list of visited URLs in real-time
3. **URL Filters**: Allow regex patterns to include/exclude URLs
4. **Concurrent Requests**: Add option for parallel crawling (with max concurrency)
5. **Cookie Support**: Add cookie jar for session-based crawling
6. **Robots.txt**: Respect robots.txt directives

## Files Modified

### Backend
- `backend/src/services/crawler.service.ts` - Enhanced with options and checkpoints
- `backend/src/worker.ts` - Added abort controller and checkpoint handling
- `backend/src/routes/api.ts` - Updated crawl endpoint and job cancellation

### Frontend
- `frontend/src/components/CrawlTab.tsx` - Added advanced options UI
- `frontend/src/lib/api.ts` - Updated crawlUrl() signature

### Documentation
- `plan-mcpBuilderGaps.prompt.md` - Marked Phase 4 as completed
- `CRAWL-ENHANCEMENTS.md` - This document

## Success Metrics

- ✅ All crawl configuration options implemented
- ✅ Stop/restart with checkpoint system working
- ✅ Progress tracking integrated
- ✅ UI provides all controls
- ✅ No breaking changes to existing functionality
- ✅ Code follows existing patterns and style
