# Testing Instructions - Crawl Enhancements

## ⚠️ PowerShell Requirement

This system requires **PowerShell 7+** (pwsh) which is not currently installed. 

### Install PowerShell 7

**Option 1: Using winget (Windows 10/11)**
```powershell
winget install --id Microsoft.Powershell --source winget
```

**Option 2: Manual Download**
Visit: https://aka.ms/powershell and download the MSI installer.

**Option 3: Using Chocolatey**
```powershell
choco install powershell-core
```

After installation, restart your terminal and run:
```powershell
pwsh --version
```

---

## Quick Test (Once PowerShell 7 is installed)

### 1. Start Services
```powershell
cd c:\Projects\swagger2mcp
docker-compose up -d
Start-Sleep -Seconds 30
```

### 2. Test Basic Crawl
```powershell
# Test via API
$body = @{
    url = "https://petstore.swagger.io/v2/swagger.json"
    depth = 1
    sessionId = "quick-test"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/api/crawl" -Method POST -ContentType "application/json" -Body $body
```

### 3. Test Advanced Options
```powershell
# Test with all options
$body = @{
    url = "https://petstore.swagger.io"
    depth = 2
    sessionId = "advanced-test"
    options = @{
        rateLimit = 500
        userAgent = "TestCrawler/1.0"
        followRedirects = $true
        authHeaders = @{
            "X-Test" = "TestValue"
        }
    }
} | ConvertTo-Json -Depth 3

$result = Invoke-RestMethod -Uri "http://localhost:3000/api/crawl" -Method POST -ContentType "application/json" -Body $body
Write-Host "Job ID: $($result.jobId)"

# Monitor progress
do {
    Start-Sleep -Seconds 2
    $status = Invoke-RestMethod -Uri "http://localhost:3000/api/jobs/$($result.jobId)"
    Write-Host "Progress: $($status.progress)% - State: $($status.state)"
} while ($status.state -eq "active")
```

### 4. Test Cancellation
```powershell
# Start a long crawl
$body = @{
    url = "https://petstore.swagger.io"
    depth = 5
    sessionId = "cancel-test"
    options = @{ rateLimit = 1000 }
} | ConvertTo-Json -Depth 3

$result = Invoke-RestMethod -Uri "http://localhost:3000/api/crawl" -Method POST -ContentType "application/json" -Body $body
$jobId = $result.jobId

Start-Sleep -Seconds 5

# Cancel it
Invoke-RestMethod -Uri "http://localhost:3000/api/jobs/$jobId" -Method DELETE

# Check status
$status = Invoke-RestMethod -Uri "http://localhost:3000/api/jobs/$jobId"
Write-Host "State: $($status.state), Reason: $($status.failedReason)"
```

### 5. Test UI
Open browser to http://localhost:5173 and:
1. Go to Crawl tab
2. Click "Advanced Options" (should expand)
3. Fill in all fields
4. Start a crawl
5. Watch progress bar
6. Test cancellation

---

## What Was Implemented

✅ **Stop/Restart Crawl**
- Abort signal integration
- Checkpoint save/resume
- Job cancellation endpoint

✅ **Crawl Configuration**
- Authentication headers
- Rate limiting (0-2000ms)
- Custom user agent
- Follow redirects toggle

✅ **UI Enhancements**
- Collapsible advanced options panel
- Settings icon with chevron
- All configuration controls
- Dark theme styling

✅ **Progress Tracking**
- Real-time progress updates
- Callback integration
- URL counting

---

## Files Modified

### Backend
- `backend/src/services/crawler.service.ts` - Core crawler enhancements
- `backend/src/worker.ts` - Job handling with abort support
- `backend/src/routes/api.ts` - API endpoint updates

### Frontend
- `frontend/src/components/CrawlTab.tsx` - UI with advanced options
- `frontend/src/lib/api.ts` - API client updates

### Documentation
- `plan-mcpBuilderGaps.prompt.md` - Updated with Phase 4 completion
- `CRAWL-ENHANCEMENTS.md` - Implementation documentation
- `CRAWL-ENHANCEMENTS-TEST-PLAN.md` - Comprehensive test plan
- `TESTING-INSTRUCTIONS.md` - This file

---

## Code Validation

The following validations were performed:

✅ TypeScript syntax checked
✅ Interface definitions correct
✅ Import statements valid
✅ Function signatures consistent
✅ React component structure proper
✅ API endpoint contracts maintained
✅ Duplicate code removed

**Status**: Code is syntactically correct and ready for runtime testing once PowerShell 7 is available.

---

## Next Steps

1. **Install PowerShell 7** (see instructions above)
2. **Run quick test** to verify basic functionality
3. **Run full test suite** (see CRAWL-ENHANCEMENTS-TEST-PLAN.md)
4. **Document any issues** found during testing
5. **Update README.md** with new features

---

## Alternative: Manual Testing Without Scripts

If you prefer to test manually without PowerShell scripts:

### Using curl (Git Bash or WSL)
```bash
# Start crawl
curl -X POST http://localhost:3000/api/crawl \
  -H "Content-Type: application/json" \
  -d '{"url":"https://petstore.swagger.io/v2/swagger.json","depth":1,"sessionId":"manual-test"}'

# Check status (use job ID from response)
curl http://localhost:3000/api/jobs/JOB_ID

# Cancel job
curl -X DELETE http://localhost:3000/api/jobs/JOB_ID
```

### Using Postman
1. Import API collection from backend
2. Test each endpoint manually
3. Verify responses match expectations

### Using Browser DevTools
1. Open http://localhost:5173
2. Open DevTools Console and Network tabs
3. Perform crawl operations
4. Watch network requests and responses
5. Check for errors in console

---

## Support

If you encounter issues:

1. Check Docker logs: `docker-compose logs backend worker`
2. Check browser console for errors
3. Verify all services running: `docker-compose ps`
4. Restart services: `docker-compose restart`
5. Review CRAWL-ENHANCEMENTS.md for implementation details
