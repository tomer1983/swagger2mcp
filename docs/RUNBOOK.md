# Production Runbook for Swagger2MCP

This runbook provides operational procedures for common production scenarios.

## Table of Contents
- [Service Health Checks](#service-health-checks)
- [Common Issues](#common-issues)
- [Emergency Procedures](#emergency-procedures)
- [Maintenance Procedures](#maintenance-procedures)
- [Performance Troubleshooting](#performance-troubleshooting)

## Service Health Checks

### Quick Health Check
```bash
# Check all services
curl https://yourdomain.com/health
curl https://yourdomain.com/api/health

# Expected response (200 OK):
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "checks": {
    "redis": {"status": "healthy", "latency": 5},
    "postgres": {"status": "healthy", "latency": 10},
    "queue": {"status": "healthy", "active": 2, "waiting": 0}
  }
}
```

### Detailed Service Checks

**Kubernetes:**
```bash
# Check pod status
kubectl get pods -n swagger2mcp

# Check pod logs
kubectl logs -n swagger2mcp deployment/backend --tail=100
kubectl logs -n swagger2mcp deployment/worker --tail=100

# Check service endpoints
kubectl get endpoints -n swagger2mcp

# Describe problematic pod
kubectl describe pod -n swagger2mcp <pod-name>
```

**Docker Compose:**
```bash
# Check container status
docker compose ps

# Check container logs
docker compose logs backend --tail=100
docker compose logs worker --tail=100

# Check container resource usage
docker stats
```

## Common Issues

### 1. Database Connection Issues

**Symptoms:**
- Backend health check fails
- "Cannot connect to database" errors
- Timeouts on database queries

**Diagnosis:**
```bash
# Check if PostgreSQL is running
docker compose ps postgres
# or
kubectl get pods -n swagger2mcp -l app=postgres

# Test database connection
docker exec swagger2mcp-postgres-1 psql -U postgres -c "SELECT 1"

# Check connection count
docker exec swagger2mcp-postgres-1 psql -U postgres -c \
  "SELECT count(*) FROM pg_stat_activity;"
```

**Resolution:**
1. Restart database if it's down:
   ```bash
   docker compose restart postgres
   # or
   kubectl rollout restart deployment/postgres -n swagger2mcp
   ```

2. If connection pool exhausted:
   ```bash
   # Restart backend to reset connections
   docker compose restart backend worker
   ```

3. If database is corrupted:
   - Stop application (backend + worker)
   - Restore from backup (see BACKUP_RECOVERY_TEMPLATE.md)
   - Start application

### 2. Redis Connection Issues

**Symptoms:**
- Job queue not processing
- "Redis connection refused" errors
- Worker not picking up jobs

**Diagnosis:**
```bash
# Check Redis status
docker exec swagger2mcp-redis-1 redis-cli ping
# Expected: PONG

# Check Redis memory
docker exec swagger2mcp-redis-1 redis-cli INFO memory

# Check queue length
docker exec swagger2mcp-redis-1 redis-cli LLEN bull:default:wait
```

**Resolution:**
1. Restart Redis:
   ```bash
   docker compose restart redis
   ```

2. If Redis out of memory:
   ```bash
   # Clear old keys (be careful!)
   docker exec swagger2mcp-redis-1 redis-cli FLUSHDB
   # Then restart worker
   docker compose restart worker
   ```

### 3. Worker Not Processing Jobs

**Symptoms:**
- Jobs stuck in "waiting" state
- File uploads not being processed
- Crawl jobs not running

**Diagnosis:**
```bash
# Check worker is running
docker compose ps worker
kubectl get pods -n swagger2mcp -l app=worker

# Check worker logs for errors
docker compose logs worker --tail=100

# Check Redis queue
docker exec swagger2mcp-redis-1 redis-cli LLEN bull:default:wait
docker exec swagger2mcp-redis-1 redis-cli LLEN bull:default:active
docker exec swagger2mcp-redis-1 redis-cli LLEN bull:default:failed
```

**Resolution:**
1. Restart worker:
   ```bash
   docker compose restart worker
   ```

2. If jobs are stuck in "active":
   ```bash
   # Worker may have crashed - restart will pick them up
   docker compose restart worker
   ```

3. Check for failed jobs:
   ```bash
   # View failed job details (requires redis-cli scripting or admin UI)
   docker exec swagger2mcp-redis-1 redis-cli LRANGE bull:default:failed 0 -1
   ```

### 4. High Memory Usage

**Symptoms:**
- OOM (Out of Memory) errors
- Containers being killed
- Slow performance

**Diagnosis:**
```bash
# Check container memory usage
docker stats

# Check specific service
kubectl top pods -n swagger2mcp

# Check for memory leaks in logs
docker compose logs backend | grep -i "memory\|heap"
```

**Resolution:**
1. Restart affected service:
   ```bash
   docker compose restart backend
   ```

2. Increase memory limits (if legitimate usage):
   - Update docker-compose.yml or Kubernetes manifests
   - Apply changes

3. Investigate memory leak:
   - Enable Node.js heap profiling
   - Check for unclosed connections
   - Review recent code changes

### 5. Slow Response Times

**Symptoms:**
- API calls taking > 1 second
- Timeouts
- Users reporting slow performance

**Diagnosis:**
```bash
# Check response times
curl -w "@curl-format.txt" -o /dev/null -s https://yourdomain.com/api/health

# curl-format.txt content:
# time_namelookup: %{time_namelookup}\n
# time_connect: %{time_connect}\n
# time_total: %{time_total}\n

# Check database slow queries
docker exec swagger2mcp-postgres-1 psql -U postgres -c \
  "SELECT pid, now() - pg_stat_activity.query_start AS duration, query 
   FROM pg_stat_activity 
   WHERE state = 'active' AND now() - pg_stat_activity.query_start > interval '5 seconds';"

# Check for high CPU
docker stats
```

**Resolution:**
1. Identify bottleneck (database, Redis, application)
2. Scale horizontally if needed:
   ```bash
   # Kubernetes
   kubectl scale deployment backend --replicas=3 -n swagger2mcp
   
   # Docker Compose (requires swarm mode or manual scaling)
   ```
3. Optimize slow queries (add indexes, review N+1 queries)
4. Enable caching if not already enabled

### 6. File Upload Failures

**Symptoms:**
- "File too large" errors
- Upload timeouts
- "Cannot save file" errors

**Diagnosis:**
```bash
# Check disk space
df -h

# Check uploads directory permissions
ls -la backend/uploads/

# Check nginx/reverse proxy limits
# (if using nginx, check client_max_body_size)
```

**Resolution:**
1. Increase upload size limits:
   - Backend: Multer configuration
   - Nginx: `client_max_body_size 50M;`
   - Kubernetes Ingress: annotation for max body size

2. Clean up old uploads if disk is full:
   ```bash
   # Find files older than 30 days
   find backend/uploads/ -type f -mtime +30
   # Delete after verification
   find backend/uploads/ -type f -mtime +30 -delete
   ```

## Emergency Procedures

### Total Service Outage

1. **Assess the situation:**
   ```bash
   # Check all services
   docker compose ps
   kubectl get pods -n swagger2mcp
   ```

2. **Check recent changes:**
   ```bash
   git log -n 5 --oneline
   kubectl rollout history deployment/backend -n swagger2mcp
   ```

3. **Rollback if recent deployment:**
   ```bash
   # Kubernetes
   kubectl rollout undo deployment/backend -n swagger2mcp
   kubectl rollout undo deployment/worker -n swagger2mcp
   
   # Docker
   # Update image tags in docker-compose.yml to previous version
   docker compose down
   docker compose up -d
   ```

4. **If database issue, restore from backup:**
   - See BACKUP_RECOVERY_TEMPLATE.md

### Data Loss / Corruption

1. **Stop all writes immediately:**
   ```bash
   # Scale down backend and worker
   kubectl scale deployment backend --replicas=0 -n swagger2mcp
   kubectl scale deployment worker --replicas=0 -n swagger2mcp
   ```

2. **Assess damage:**
   - Query database for affected records
   - Check backup timestamps

3. **Restore from backup:**
   - Use most recent clean backup
   - Follow BACKUP_RECOVERY_TEMPLATE.md

4. **Verify data integrity:**
   - Run data validation queries
   - Test critical workflows

5. **Resume service:**
   ```bash
   kubectl scale deployment backend --replicas=2 -n swagger2mcp
   kubectl scale deployment worker --replicas=1 -n swagger2mcp
   ```

### Security Incident

1. **Isolate affected systems:**
   ```bash
   # Block external traffic
   # Update firewall rules or security groups
   ```

2. **Collect evidence:**
   - Export logs immediately
   - Take snapshots of affected systems
   ```bash
   docker compose logs > incident-logs-$(date +%Y%m%d-%H%M%S).txt
   ```

3. **Rotate all secrets:**
   - JWT_SECRET
   - Database passwords
   - API tokens
   - OAuth credentials

4. **Update and redeploy:**
   - Apply security patches
   - Review and harden configuration
   - Redeploy services

## Maintenance Procedures

### Scheduled Downtime

**Pre-maintenance:**
1. Notify users (via banner, email, etc.)
2. Enable maintenance mode if available
3. Backup database
4. Document rollback plan

**During maintenance:**
1. Put application in maintenance mode
2. Perform updates
3. Run migrations if needed
4. Test functionality

**Post-maintenance:**
1. Run smoke tests
2. Check error rates
3. Monitor for issues
4. Disable maintenance mode
5. Notify users

### Database Migrations

```bash
# 1. Backup database first
./scripts/backup/docker-backup.sh

# 2. Apply migrations
cd backend
npx prisma migrate deploy

# 3. Verify migration
npx prisma migrate status

# 4. If issues, rollback
# Restore from backup taken in step 1
```

### Updating Dependencies

```bash
# 1. Review security advisories
npm audit

# 2. Update dependencies in development
npm update

# 3. Run tests
npm test

# 4. Build and test locally
docker compose -f docker-compose.production.yml build
docker compose -f docker-compose.production.yml up -d

# 5. Deploy to staging first, then production
```

### Certificate Renewal

```bash
# If using Let's Encrypt with certbot
certbot renew --dry-run  # Test renewal
certbot renew            # Actual renewal

# Reload nginx/reverse proxy
nginx -s reload
# or
kubectl rollout restart deployment/nginx -n swagger2mcp
```

## Performance Troubleshooting

### High CPU Usage

1. Identify process:
   ```bash
   docker stats
   kubectl top pods -n swagger2mcp
   ```

2. Check for CPU-intensive operations:
   - Large file processing
   - Complex schema parsing
   - Infinite loops (bug)

3. Scale if legitimate load:
   ```bash
   kubectl scale deployment backend --replicas=3 -n swagger2mcp
   ```

### High Database Load

1. Identify slow queries:
   ```bash
   docker exec swagger2mcp-postgres-1 psql -U postgres -c \
     "SELECT * FROM pg_stat_statements ORDER BY mean_time DESC LIMIT 10;"
   ```

2. Add indexes if needed
3. Optimize queries
4. Consider read replicas for read-heavy workloads

### Network Issues

1. Check network connectivity:
   ```bash
   # From backend to database
   kubectl exec -it deployment/backend -n swagger2mcp -- \
     nc -zv postgres-service 5432
   
   # From backend to Redis
   kubectl exec -it deployment/backend -n swagger2mcp -- \
     nc -zv redis-service 6379
   ```

2. Check network policies (Kubernetes)
3. Check security groups (Cloud providers)
4. Check DNS resolution

## Escalation

If issues cannot be resolved:

1. **Check documentation:**
   - README.md
   - API Documentation
   - Security Policy

2. **Contact:**
   - On-call engineer: [Contact]
   - DevOps team: [Contact]
   - Security team (for security issues): [Contact]

3. **Create incident:**
   - Document issue thoroughly
   - Include logs and diagnostics
   - Track in incident management system

## References

- [Production Deployment Checklist](PRODUCTION_DEPLOYMENT_CHECKLIST.md)
- [Backup and Recovery](BACKUP_RECOVERY_TEMPLATE.md)
- [Monitoring Documentation](monitoring-examples/README.md)
- [Security Policy](../SECURITY.md)
