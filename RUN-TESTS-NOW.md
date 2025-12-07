# PowerShell 7 Installation Verification

## Please run these commands in a NEW terminal window:

### 1. Verify PowerShell 7 is installed
```powershell
# Close this terminal and open a NEW PowerShell window
# Then run:
pwsh --version
```

If you see a version number (e.g., "7.x.x"), PowerShell 7 is installed correctly.

### 2. If pwsh is not found, try these locations manually:

**Check common installation paths:**
```powershell
# Windows default location
& "C:\Program Files\PowerShell\7\pwsh.exe" --version

# Alternative location
& "C:\Program Files (x86)\PowerShell\7\pwsh.exe" --version
```

### 3. Once pwsh is working, start testing:

#### Step 1: Check Docker
```powershell
cd c:\Projects\swagger2mcp
docker --version
docker-compose --version
```

#### Step 2: Check if services are already running
```powershell
docker-compose ps
```

#### Step 3: Start services (if not running)
```powershell
docker-compose up -d
```

#### Step 4: Wait for services to initialize
```powershell
Start-Sleep -Seconds 30
```

#### Step 5: Check services are healthy
```powershell
docker-compose ps
```

#### Step 6: Test the backend health endpoint
```powershell
Invoke-RestMethod -Uri "http://localhost:3000/api/health"
```

If you see an error about "Invoke-RestMethod", you might still be in Windows PowerShell 5.1.
Make sure you're running PowerShell 7 by checking the prompt says "pwsh" or run:
```powershell
$PSVersionTable.PSVersion
```

### 4. Quick Crawl Test

Once services are running and healthy:

```powershell
# Test basic crawl
$body = @{
    url = "https://petstore.swagger.io/v2/swagger.json"
    depth = 1
    sessionId = "test-$(Get-Random)"
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "http://localhost:3000/api/crawl" `
    -Method POST `
    -ContentType "application/json" `
    -Body $body

Write-Host "✓ Crawl job created: $($response.jobId)" -ForegroundColor Green
Write-Host "  Status: $($response.status)" -ForegroundColor Cyan
Write-Host "  Message: $($response.message)" -ForegroundColor Cyan

# Wait a bit for processing
Start-Sleep -Seconds 5

# Check job status
$status = Invoke-RestMethod -Uri "http://localhost:3000/api/jobs/$($response.jobId)"
Write-Host "`n✓ Job Status Check:" -ForegroundColor Green
Write-Host "  State: $($status.state)" -ForegroundColor Cyan
Write-Host "  Progress: $($status.progress)%" -ForegroundColor Cyan
```

### 5. Test Advanced Options

```powershell
# Test with all crawl options
$body = @{
    url = "https://petstore.swagger.io"
    depth = 2
    sessionId = "test-advanced-$(Get-Random)"
    options = @{
        rateLimit = 500
        userAgent = "TestCrawler/1.0"
        followRedirects = $true
    }
} | ConvertTo-Json -Depth 3

$response = Invoke-RestMethod -Uri "http://localhost:3000/api/crawl" `
    -Method POST `
    -ContentType "application/json" `
    -Body $body

Write-Host "`n✓ Advanced crawl job created: $($response.jobId)" -ForegroundColor Green

# Monitor progress
$jobId = $response.jobId
Write-Host "`nMonitoring progress..." -ForegroundColor Yellow
$lastProgress = -1
$attempts = 0
$maxAttempts = 30

do {
    Start-Sleep -Seconds 2
    $attempts++
    
    try {
        $status = Invoke-RestMethod -Uri "http://localhost:3000/api/jobs/$jobId"
        
        if ($status.progress -ne $lastProgress) {
            Write-Host "  Progress: $($status.progress)% - State: $($status.state)" -ForegroundColor Cyan
            $lastProgress = $status.progress
        }
        
        if ($status.state -eq "completed") {
            Write-Host "`n✓ Job completed successfully!" -ForegroundColor Green
            break
        } elseif ($status.state -eq "failed") {
            Write-Host "`n✗ Job failed: $($status.failedReason)" -ForegroundColor Red
            break
        }
    } catch {
        Write-Host "  Error checking status: $_" -ForegroundColor Red
        break
    }
} while ($attempts -lt $maxAttempts -and ($status.state -eq "active" -or $status.state -eq "waiting"))

if ($attempts -ge $maxAttempts) {
    Write-Host "`n⚠ Timeout waiting for job to complete" -ForegroundColor Yellow
}
```

### 6. Test Job Cancellation

```powershell
# Start a slow crawl
$body = @{
    url = "https://petstore.swagger.io"
    depth = 3
    sessionId = "test-cancel-$(Get-Random)"
    options = @{
        rateLimit = 1000
    }
} | ConvertTo-Json -Depth 3

$response = Invoke-RestMethod -Uri "http://localhost:3000/api/crawl" `
    -Method POST `
    -ContentType "application/json" `
    -Body $body

$jobId = $response.jobId
Write-Host "`n✓ Slow crawl started: $jobId" -ForegroundColor Green
Write-Host "  Waiting 5 seconds before cancelling..." -ForegroundColor Yellow

Start-Sleep -Seconds 5

# Cancel the job
Write-Host "`nCancelling job..." -ForegroundColor Yellow
$cancelResponse = Invoke-RestMethod -Uri "http://localhost:3000/api/jobs/$jobId" -Method DELETE
Write-Host "  $($cancelResponse.message)" -ForegroundColor Cyan

Start-Sleep -Seconds 2

# Check final status
$finalStatus = Invoke-RestMethod -Uri "http://localhost:3000/api/jobs/$jobId"
Write-Host "`n✓ Job cancelled:" -ForegroundColor Green
Write-Host "  State: $($finalStatus.state)" -ForegroundColor Cyan
Write-Host "  Reason: $($finalStatus.failedReason)" -ForegroundColor Cyan
```

### 7. Test UI (Manual)

Open your browser to: http://localhost:5173

1. Click on the "Crawl" tab
2. Enter URL: `https://petstore.swagger.io/v2/swagger.json`
3. Set depth slider to 2
4. Click "Advanced Options" button
5. Verify the panel expands
6. Try setting:
   - Auth Header: `Authorization`
   - Auth Value: `Bearer test123`
   - Rate Limit: Move slider to 500ms
   - User Agent: Change to `MyTestCrawler/1.0`
   - Ensure "Follow redirects" is checked
7. Click "Start Crawl"
8. Watch the progress bar
9. Check the "Schemas" tab to see if specs were found

### 8. Check Backend Logs

If anything fails:
```powershell
# View backend logs
docker-compose logs backend --tail=50

# View worker logs
docker-compose logs worker --tail=50

# Follow logs in real-time
docker-compose logs -f
```

### 9. Cleanup

When done testing:
```powershell
# Stop services
docker-compose down

# Or to remove all data
docker-compose down -v
```

---

## Troubleshooting

### "Cannot connect to backend"
```powershell
# Check if backend is running
docker-compose ps

# Restart backend
docker-compose restart backend

# Check backend logs
docker-compose logs backend
```

### "Job stuck in waiting state"
```powershell
# Check if worker is running
docker-compose ps worker

# Restart worker
docker-compose restart worker

# Check worker logs
docker-compose logs worker
```

### "Database connection error"
```powershell
# Check if postgres is running
docker-compose ps postgres

# Restart postgres
docker-compose restart postgres
```

---

## Expected Test Results

✅ **Basic Crawl**: Job completes, 1 schema found  
✅ **Advanced Options**: Job runs with custom settings  
✅ **Rate Limiting**: Job takes longer to complete  
✅ **Job Cancellation**: Job stops and saves checkpoint  
✅ **UI**: Advanced options panel works, all inputs functional  
✅ **Progress**: Real-time updates visible  

---

## Notes

- PowerShell 7 must be used (not Windows PowerShell 5.1)
- Docker Desktop must be running
- Ports 3000, 5173, 5432, 6379 must be available
- First run may take longer as Docker pulls images
- If you just installed PowerShell 7, you may need to close ALL terminal windows and open a new one
