# Crawl Enhancements - Test Plan & Validation

**Date**: December 2, 2024  
**Status**: Implementation Complete - Ready for Testing

## Prerequisites for Testing

### System Requirements
- Docker Desktop installed and running
- PowerShell 6+ (pwsh) installed
- Ports 3000, 5173, 5432, 6379 available

### Quick Installation (PowerShell 6+)
```powershell
# Install PowerShell 7 (if not installed)
winget install --id Microsoft.Powershell --source winget

# Verify installation
pwsh --version
```

## Test Environment Setup

### 1. Start Services
```powershell
cd c:\Projects\swagger2mcp

# Start all services with Docker Compose
docker-compose up -d

# Wait for services to be healthy (30 seconds)
Start-Sleep -Seconds 30

# Check service status
docker-compose ps
```

### 2. Verify Services
```powershell
# Check backend health
Invoke-RestMethod -Uri "http://localhost:3000/api/health"

# Check frontend is running
Start-Process "http://localhost:5173"
```

## Test Cases

### Test 1: Basic Crawl (No Options)

**Objective**: Verify basic crawl functionality still works

**Steps**:
1. Open browser to http://localhost:5173
2. Click "Crawl" tab
3. Enter URL: `https://petstore.swagger.io/v2/swagger.json`
4. Set depth: 1
5. Click "Start Crawl"

**Expected Result**:
- Job created successfully
- Progress bar appears and updates
- Schema found and saved
- No errors in console

**API Test**:
```powershell
$body = @{
    url = "https://petstore.swagger.io/v2/swagger.json"
    depth = 1
    sessionId = "test-session-1"
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "http://localhost:3000/api/crawl" `
    -Method POST `
    -ContentType "application/json" `
    -Body $body

Write-Host "Job ID: $($response.jobId)"

# Check job status
Start-Sleep -Seconds 5
$status = Invoke-RestMethod -Uri "http://localhost:3000/api/jobs/$($response.jobId)"
Write-Host "Job Status: $($status.state)"
Write-Host "Progress: $($status.progress)%"
```

---

### Test 2: Advanced Options - Rate Limiting

**Objective**: Verify rate limiting works and slows down requests

**Steps**:
1. Click "Advanced Options" button
2. Set Rate Limit slider to 1000ms (1 second)
3. Enter URL: `https://petstore.swagger.io`
4. Set depth: 2
5. Click "Start Crawl"
6. Observe console logs for timing

**Expected Result**:
- Advanced options panel expands
- Crawl takes noticeably longer
- ~1 second delay between requests visible in logs
- All URLs still processed correctly

**API Test**:
```powershell
$body = @{
    url = "https://petstore.swagger.io"
    depth = 2
    sessionId = "test-session-2"
    options = @{
        rateLimit = 1000
        userAgent = "TestCrawler/1.0"
    }
} | ConvertTo-Json -Depth 3

$start = Get-Date
$response = Invoke-RestMethod -Uri "http://localhost:3000/api/crawl" `
    -Method POST `
    -ContentType "application/json" `
    -Body $body

# Monitor progress
do {
    Start-Sleep -Seconds 2
    $status = Invoke-RestMethod -Uri "http://localhost:3000/api/jobs/$($response.jobId)"
    Write-Host "Progress: $($status.progress)% - State: $($status.state)"
} while ($status.state -eq "active" -or $status.state -eq "waiting")

$duration = (Get-Date) - $start
Write-Host "Completed in: $($duration.TotalSeconds) seconds"
```

---

### Test 3: Advanced Options - Authentication

**Objective**: Verify custom auth headers are sent

**Steps**:
1. Expand "Advanced Options"
2. Auth Header: `Authorization`
3. Auth Value: `Bearer test-token-12345`
4. Enter a test URL (or use httpbin.org for echo)
5. Click "Start Crawl"

**Expected Result**:
- Auth header included in requests
- No authentication errors
- Request proceeds normally

**API Test with Echo Service**:
```powershell
# Using httpbin.org to echo back headers
$body = @{
    url = "https://httpbin.org/headers"
    depth = 1
    sessionId = "test-session-3"
    options = @{
        authHeaders = @{
            "Authorization" = "Bearer test-token-12345"
            "X-Custom-Header" = "CustomValue"
        }
    }
} | ConvertTo-Json -Depth 3

$response = Invoke-RestMethod -Uri "http://localhost:3000/api/crawl" `
    -Method POST `
    -ContentType "application/json" `
    -Body $body

Write-Host "Job ID: $($response.jobId)"
```

---

### Test 4: Custom User Agent

**Objective**: Verify custom user agent is sent

**Steps**:
1. Expand "Advanced Options"
2. User Agent: `MyCrawler/2.0 (Testing)`
3. Enter URL: `https://httpbin.org/user-agent`
4. Click "Start Crawl"

**Expected Result**:
- Custom user agent sent in requests
- Visible in server logs if available

**API Test**:
```powershell
$body = @{
    url = "https://httpbin.org/user-agent"
    depth = 1
    sessionId = "test-session-4"
    options = @{
        userAgent = "MyCrawler/2.0 (Testing)"
    }
} | ConvertTo-Json -Depth 3

$response = Invoke-RestMethod -Uri "http://localhost:3000/api/crawl" `
    -Method POST `
    -ContentType "application/json" `
    -Body $body
```

---

### Test 5: Follow Redirects Toggle

**Objective**: Verify redirect behavior can be controlled

**Steps**:
1. Expand "Advanced Options"
2. Uncheck "Follow redirects"
3. Enter URL that redirects (e.g., `http://github.com`)
4. Click "Start Crawl"

**Expected Result**:
- Crawler stops at redirect
- Does not follow to final destination
- No error thrown

**API Test**:
```powershell
# Test with redirects enabled
$body1 = @{
    url = "http://github.com"
    depth = 1
    sessionId = "test-session-5a"
    options = @{
        followRedirects = $true
    }
} | ConvertTo-Json -Depth 3

$response1 = Invoke-RestMethod -Uri "http://localhost:3000/api/crawl" `
    -Method POST `
    -ContentType "application/json" `
    -Body $body1

# Test with redirects disabled
$body2 = @{
    url = "http://github.com"
    depth = 1
    sessionId = "test-session-5b"
    options = @{
        followRedirects = $false
    }
} | ConvertTo-Json -Depth 3

$response2 = Invoke-RestMethod -Uri "http://localhost:3000/api/crawl" `
    -Method POST `
    -ContentType "application/json" `
    -Body $body2
```

---

### Test 6: Job Cancellation

**Objective**: Verify active crawls can be cancelled

**Steps**:
1. Start a deep crawl (depth 5) on a large site
2. Click "Cancel" button while crawl is active
3. Observe job status changes to "failed" or "cancelled"

**Expected Result**:
- Job stops processing
- Checkpoint saved with partial progress
- Job marked as failed with "Cancelled by user" message

**API Test**:
```powershell
# Start a long-running crawl
$body = @{
    url = "https://petstore.swagger.io"
    depth = 5
    sessionId = "test-session-6"
    options = @{
        rateLimit = 500
    }
} | ConvertTo-Json -Depth 3

$response = Invoke-RestMethod -Uri "http://localhost:3000/api/crawl" `
    -Method POST `
    -ContentType "application/json" `
    -Body $body

$jobId = $response.jobId
Write-Host "Started job: $jobId"

# Wait a bit for it to start
Start-Sleep -Seconds 3

# Cancel the job
Write-Host "Cancelling job..."
$cancelResponse = Invoke-RestMethod -Uri "http://localhost:3000/api/jobs/$jobId" `
    -Method DELETE

Write-Host $cancelResponse.message

# Check final status
Start-Sleep -Seconds 2
$finalStatus = Invoke-RestMethod -Uri "http://localhost:3000/api/jobs/$jobId"
Write-Host "Final State: $($finalStatus.state)"
Write-Host "Failed Reason: $($finalStatus.failedReason)"
```

---

### Test 7: Checkpoint Resume (Manual Retry)

**Objective**: Verify cancelled crawl can be resumed from checkpoint

**Steps**:
1. Start a crawl and cancel it mid-way (see Test 6)
2. Use retry endpoint to resume
3. Verify crawl continues from checkpoint

**Expected Result**:
- Retry picks up from checkpoint
- Previously visited URLs not re-crawled
- Crawl completes successfully

**API Test**:
```powershell
# Assuming you have a cancelled job ID from Test 6
$jobId = "your-cancelled-job-id"

# Retry the job
Write-Host "Retrying job: $jobId"
$retryResponse = Invoke-RestMethod -Uri "http://localhost:3000/api/jobs/$jobId/retry" `
    -Method POST

Write-Host $retryResponse.message

# Monitor the retried job
do {
    Start-Sleep -Seconds 2
    $status = Invoke-RestMethod -Uri "http://localhost:3000/api/jobs/$jobId"
    Write-Host "Progress: $($status.progress)% - State: $($status.state)"
} while ($status.state -eq "active" -or $status.state -eq "waiting")

Write-Host "Final State: $($status.state)"
```

---

### Test 8: Progress Tracking

**Objective**: Verify real-time progress updates work

**Steps**:
1. Start a crawl with depth 3
2. Watch progress bar in UI
3. Verify progress updates smoothly

**Expected Result**:
- Progress bar starts at 0%
- Updates incrementally as URLs are processed
- Reaches 100% when complete
- Progress corresponds to actual work done

**API Test**:
```powershell
$body = @{
    url = "https://petstore.swagger.io"
    depth = 3
    sessionId = "test-session-8"
    options = @{
        rateLimit = 200
    }
} | ConvertTo-Json -Depth 3

$response = Invoke-RestMethod -Uri "http://localhost:3000/api/crawl" `
    -Method POST `
    -ContentType "application/json" `
    -Body $body

$jobId = $response.jobId
Write-Host "Monitoring progress for job: $jobId"

$lastProgress = 0
do {
    Start-Sleep -Seconds 1
    $status = Invoke-RestMethod -Uri "http://localhost:3000/api/jobs/$jobId"
    if ($status.progress -ne $lastProgress) {
        Write-Host "Progress: $($status.progress)% - State: $($status.state)"
        $lastProgress = $status.progress
    }
} while ($status.state -eq "active" -or $status.state -eq "waiting")

Write-Host "Completed with state: $($status.state)"
```

---

### Test 9: Combined Options

**Objective**: Verify all options work together

**Steps**:
1. Expand "Advanced Options"
2. Set all options:
   - Auth: `Authorization: Bearer test123`
   - Rate Limit: 300ms
   - User Agent: `Combined-Test/1.0`
   - Follow Redirects: checked
3. Start crawl
4. Cancel mid-way
5. Retry to resume

**Expected Result**:
- All options respected
- Crawl works correctly with combined settings
- Cancel/resume works with options preserved

**API Test**:
```powershell
$body = @{
    url = "https://petstore.swagger.io"
    depth = 3
    sessionId = "test-session-9"
    options = @{
        authHeaders = @{
            "Authorization" = "Bearer test123"
        }
        rateLimit = 300
        userAgent = "Combined-Test/1.0"
        followRedirects = $true
    }
} | ConvertTo-Json -Depth 3

$response = Invoke-RestMethod -Uri "http://localhost:3000/api/crawl" `
    -Method POST `
    -ContentType "application/json" `
    -Body $body

Write-Host "Job ID: $($response.jobId)"
```

---

### Test 10: Error Handling

**Objective**: Verify error handling for invalid inputs

**Test Cases**:
- Invalid URL format
- Unreachable URL
- Timeout scenarios
- Invalid auth credentials

**API Tests**:
```powershell
# Test 1: Invalid URL
try {
    $body = @{
        url = "not-a-valid-url"
        depth = 1
        sessionId = "test-error-1"
    } | ConvertTo-Json
    
    Invoke-RestMethod -Uri "http://localhost:3000/api/crawl" `
        -Method POST `
        -ContentType "application/json" `
        -Body $body
} catch {
    Write-Host "✓ Invalid URL rejected: $($_.Exception.Message)"
}

# Test 2: Unreachable URL
$body = @{
    url = "https://this-domain-definitely-does-not-exist-12345.com"
    depth = 1
    sessionId = "test-error-2"
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "http://localhost:3000/api/crawl" `
    -Method POST `
    -ContentType "application/json" `
    -Body $body

# Check job fails gracefully
Start-Sleep -Seconds 5
$status = Invoke-RestMethod -Uri "http://localhost:3000/api/jobs/$($response.jobId)"
Write-Host "✓ Unreachable URL handled: $($status.state)"
```

---

## Validation Checklist

### Code Quality
- [ ] No TypeScript compilation errors
- [ ] No ESLint warnings
- [ ] All imports resolve correctly
- [ ] Consistent code style maintained

### Functionality
- [ ] Basic crawl works without options
- [ ] Rate limiting delays requests appropriately
- [ ] Auth headers are sent correctly
- [ ] Custom user agent is sent
- [ ] Follow redirects toggle works
- [ ] Job cancellation stops crawl
- [ ] Checkpoint saved on cancel
- [ ] Resume from checkpoint works
- [ ] Progress updates in real-time
- [ ] All options work together

### UI/UX
- [ ] Advanced options panel toggles smoothly
- [ ] All input fields accept values
- [ ] Sliders update labels correctly
- [ ] Form validation works
- [ ] Error messages display clearly
- [ ] Progress bar animates smoothly
- [ ] Layout responsive and clean

### Backend
- [ ] API endpoints respond correctly
- [ ] Job queue processes tasks
- [ ] Worker handles options properly
- [ ] Abort signal propagates correctly
- [ ] Checkpoint data structure correct
- [ ] Database saves schemas
- [ ] Redis manages queue properly

### Error Handling
- [ ] Invalid URLs rejected
- [ ] Network errors handled gracefully
- [ ] Timeout scenarios handled
- [ ] Abort errors don't spam logs
- [ ] Failed jobs can be retried

---

## Performance Benchmarks

Run these tests to ensure performance is acceptable:

```powershell
# Test 1: Basic crawl speed (no rate limit)
$start = Get-Date
# ... run basic crawl ...
$duration = (Get-Date) - $start
Write-Host "Basic crawl: $($duration.TotalSeconds)s"

# Test 2: Rate limited crawl (1000ms)
$start = Get-Date
# ... run rate limited crawl ...
$duration = (Get-Date) - $start
Write-Host "Rate limited crawl: $($duration.TotalSeconds)s"
# Should be significantly longer

# Test 3: Deep crawl (depth 5)
$start = Get-Date
# ... run deep crawl ...
$duration = (Get-Date) - $start
Write-Host "Deep crawl: $($duration.TotalSeconds)s"
```

**Expected Results**:
- Basic crawl: < 10 seconds
- Rate limited (1s delay, 5 URLs): ~5-7 seconds
- Deep crawl: varies by site, but should complete

---

## Cleanup

After testing:

```powershell
# Stop all services
docker-compose down

# Optional: Remove volumes
docker-compose down -v

# Check logs if issues found
docker-compose logs backend
docker-compose logs worker
```

---

## Known Issues / Limitations

Document any issues found during testing:

1. **Issue**: [Description]
   - **Reproduction**: [Steps]
   - **Workaround**: [If any]
   - **Priority**: [High/Medium/Low]

---

## Sign-off

- [ ] All test cases passed
- [ ] No critical issues found
- [ ] Performance acceptable
- [ ] Documentation updated
- [ ] Ready for production

**Tested By**: _________________  
**Date**: _________________  
**Notes**: _________________
