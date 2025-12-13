# Production Deployment Checklist

This checklist ensures your Swagger2MCP deployment is production-ready and secure.

## Pre-Deployment

### Security Configuration
- [ ] Change all default passwords
  - [ ] PostgreSQL password (not `postgres`)
  - [ ] Redis password (add if needed)
  
- [ ] Generate strong secrets
  - [ ] `JWT_SECRET` - Use at least 64 random characters: `openssl rand -base64 64`
  - [ ] Session secrets if using express-session
  
- [ ] Configure CORS properly
  - [ ] Set `ALLOWED_ORIGINS` to your actual frontend domain(s)
  - [ ] Remove wildcard (*) origins from production
  
- [ ] Disable anonymous access (if required)
  - [ ] Set `ALLOW_ANONYMOUS=false` in production if authentication is required
  
- [ ] Configure OAuth providers (if using)
  - [ ] Microsoft OAuth credentials
  - [ ] Update callback URLs to production domain

### Environment Variables
- [ ] Backend `.env` configured with production values
  - [ ] `NODE_ENV=production`
  - [ ] `DATABASE_URL` pointing to production database
  - [ ] `REDIS_HOST` and `REDIS_PORT` configured
  - [ ] `FRONTEND_URL` set to production frontend URL
  - [ ] `JWT_SECRET` set to strong secret
  - [ ] `JWT_EXPIRES_IN` appropriate for your use case
  
- [ ] Frontend environment configured
  - [ ] `VITE_API_URL` pointing to production backend
  - [ ] Feature flags configured appropriately

### SSL/TLS Configuration
- [ ] SSL certificates obtained
  - [ ] Valid SSL certificate from trusted CA
  - [ ] Automatic renewal configured (e.g., Let's Encrypt)
  
- [ ] HTTPS configured
  - [ ] Reverse proxy (nginx/traefik) configured for TLS termination
  - [ ] HTTP to HTTPS redirect enabled
  - [ ] HSTS headers configured
  
- [ ] Certificate monitoring
  - [ ] Alerts for certificate expiration (30 days before)

### Database Setup
- [ ] Production database provisioned
  - [ ] Sufficient storage allocated
  - [ ] Backups configured (see Backup section below)
  - [ ] Connection pooling configured
  
- [ ] Migrations applied
  - [ ] Run `npx prisma migrate deploy` in backend
  - [ ] Verify schema matches expected state
  
- [ ] Database performance tuning
  - [ ] Appropriate indexes created
  - [ ] PostgreSQL configuration optimized for workload
  - [ ] Connection limits configured

### Container & Infrastructure
- [ ] Use production Dockerfiles
  - [ ] Build with `Dockerfile.production` (not development `Dockerfile`)
  - [ ] Multi-stage builds for smaller images
  - [ ] Non-root user configured
  
- [ ] Container security
  - [ ] Scan images for vulnerabilities (Trivy/Snyk)
  - [ ] Use official base images
  - [ ] Keep base images updated
  
- [ ] Resource limits configured
  - [ ] CPU limits appropriate for workload
  - [ ] Memory limits set (prevent OOM)
  - [ ] Storage limits for uploads directory

### Secrets Management
- [ ] Never commit secrets to git
  - [ ] `.env` files in `.gitignore`
  - [ ] Secrets rotated if accidentally committed
  
- [ ] Use proper secrets management
  - [ ] Kubernetes Secrets / AWS Secrets Manager / HashiCorp Vault
  - [ ] Secrets encrypted at rest
  - [ ] Access logging enabled for secret access

## Deployment

### Build & Test
- [ ] CI/CD pipeline passing
  - [ ] All tests passing
  - [ ] Linting passing
  - [ ] Security scans clean
  
- [ ] Build production images
  ```bash
  docker build -f backend/Dockerfile.production -t swagger2mcp-backend:v1.0.0 backend/
  docker build -f frontend/Dockerfile.production -t swagger2mcp-frontend:v1.0.0 frontend/
  ```
  
- [ ] Push to container registry
  ```bash
  docker tag swagger2mcp-backend:v1.0.0 your-registry/swagger2mcp-backend:v1.0.0
  docker push your-registry/swagger2mcp-backend:v1.0.0
  docker tag swagger2mcp-frontend:v1.0.0 your-registry/swagger2mcp-frontend:v1.0.0
  docker push your-registry/swagger2mcp-frontend:v1.0.0
  ```

### Kubernetes Deployment (if applicable)
- [ ] Update image tags in manifests/Helm values
- [ ] Create namespace: `kubectl create namespace swagger2mcp`
- [ ] Create secrets: `kubectl apply -f k8s/secrets.yaml`
- [ ] Apply configurations: `kubectl apply -f k8s/`
- [ ] Or use Helm: `helm install swagger2mcp ./charts/swagger2mcp -f production-values.yaml`
- [ ] Verify pod status: `kubectl get pods -n swagger2mcp`
- [ ] Check logs: `kubectl logs -n swagger2mcp deployment/backend`

### Docker Compose Deployment (if applicable)
- [ ] Update `docker-compose.yml` for production
  - [ ] Use production Dockerfiles
  - [ ] Configure restart policies: `restart: unless-stopped`
  - [ ] Remove volume mounts for source code
  
- [ ] Deploy:
  ```bash
  docker compose -f docker-compose.production.yml up -d
  ```

## Post-Deployment

### Monitoring & Observability
- [ ] Health checks configured
  - [ ] Backend: `http://your-domain/health`
  - [ ] Frontend: HTTP 200 on root path
  - [ ] Database connectivity verified
  - [ ] Redis connectivity verified
  
- [ ] Logging configured
  - [ ] Application logs aggregated (ELK/Grafana Loki/CloudWatch)
  - [ ] Log retention policy set
  - [ ] Error alerts configured
  
- [ ] Metrics & monitoring
  - [ ] Prometheus/Datadog/New Relic configured
  - [ ] Key metrics tracked:
    - [ ] Request rate
    - [ ] Error rate
    - [ ] Response time (p50, p95, p99)
    - [ ] Database query performance
    - [ ] Job queue length
  
- [ ] Alerting
  - [ ] High error rate alerts
  - [ ] Service down alerts
  - [ ] Disk space alerts
  - [ ] Database connection alerts
  - [ ] Certificate expiration alerts

### Backup & Disaster Recovery
- [ ] Automated backups configured
  - [ ] Database backups daily (minimum)
  - [ ] Backup retention: 30 days (recommended)
  - [ ] Backups encrypted
  - [ ] Backups stored off-site / different region
  
- [ ] Backup verification
  - [ ] Test restore procedure monthly
  - [ ] Document restore time (RTO)
  - [ ] Document data loss tolerance (RPO)
  
- [ ] Disaster recovery plan documented
  - [ ] Recovery procedures documented
  - [ ] Contact information for on-call
  - [ ] Runbook for common incidents

### Performance & Scaling
- [ ] Load testing completed
  - [ ] Expected load tested (concurrent users)
  - [ ] Peak load tested (2x expected minimum)
  - [ ] Performance benchmarks documented
  
- [ ] Auto-scaling configured (if needed)
  - [ ] Horizontal pod autoscaling (Kubernetes)
  - [ ] CPU/Memory thresholds set
  - [ ] Min/max replicas configured
  
- [ ] CDN configured (optional)
  - [ ] Static assets served from CDN
  - [ ] Cache headers configured
  - [ ] CDN purge strategy defined

### Security Hardening
- [ ] Security headers configured
  - [ ] `X-Frame-Options: SAMEORIGIN`
  - [ ] `X-Content-Type-Options: nosniff`
  - [ ] `X-XSS-Protection: 1; mode=block`
  - [ ] `Strict-Transport-Security` (HSTS)
  - [ ] `Content-Security-Policy` configured
  
- [ ] Rate limiting enabled
  - [ ] API rate limits appropriate for usage
  - [ ] Brute force protection on auth endpoints
  - [ ] DDoS protection (CloudFlare/AWS WAF)
  
- [ ] Network security
  - [ ] Database not exposed to internet
  - [ ] Redis not exposed to internet
  - [ ] Firewall rules configured
  - [ ] VPC/private networks used
  
- [ ] Security scanning
  - [ ] Container scanning enabled (Trivy)
  - [ ] Dependency scanning enabled (npm audit)
  - [ ] SAST/DAST scanning in CI/CD
  - [ ] Regular security reviews scheduled

### Compliance & Documentation
- [ ] Privacy compliance
  - [ ] GDPR compliance (if handling EU data)
  - [ ] Data retention policies documented
  - [ ] User data deletion procedure
  
- [ ] Documentation updated
  - [ ] Production architecture documented
  - [ ] API documentation current
  - [ ] Runbooks created for common tasks
  - [ ] Incident response plan documented
  
- [ ] Access control
  - [ ] Admin access audited
  - [ ] Service accounts using least privilege
  - [ ] MFA enabled for admin access
  - [ ] Access logs monitored

## Validation

### Smoke Tests
Run these tests after deployment:

```bash
# Backend health
curl https://your-domain/health

# API health with details
curl https://your-domain/api/health

# Frontend loads
curl https://your-frontend-domain/

# Database connectivity (check backend logs)
# Redis connectivity (check backend logs)

# Test file upload (via UI)
# Test OpenAPI schema generation (via UI)
# Test GitHub/GitLab export (via UI)
```

### Performance Validation
- [ ] Response times acceptable
  - [ ] p95 < 500ms for API calls
  - [ ] p99 < 1s for API calls
  
- [ ] No error spikes after deployment
- [ ] Database queries performing well
- [ ] Job queue processing normally

### User Acceptance
- [ ] Core user flows tested
  - [ ] Upload OpenAPI schema
  - [ ] Crawl documentation URL
  - [ ] Generate MCP server
  - [ ] Export to GitHub
  - [ ] Authentication flow (if enabled)

## Rollback Plan

If issues occur after deployment:

1. **Immediate rollback**
   ```bash
   # Kubernetes
   kubectl rollout undo deployment/backend -n swagger2mcp
   kubectl rollout undo deployment/frontend -n swagger2mcp
   
   # Docker Compose
   docker compose down
   # Edit docker-compose.yml to use previous image tags
   docker compose up -d
   ```

2. **Database rollback**
   - Restore from backup if migrations were destructive
   - Document rollback procedure in migration notes

3. **Verify rollback**
   - Run smoke tests
   - Check error rates
   - Verify user-facing functionality

## Ongoing Maintenance

- [ ] Dependency updates
  - [ ] Review Dependabot PRs weekly
  - [ ] Security updates applied within 7 days
  
- [ ] Certificate renewal
  - [ ] Automated renewal configured
  - [ ] Manual renewal procedure documented
  
- [ ] Backup testing
  - [ ] Monthly restore tests in staging
  - [ ] Quarterly disaster recovery drills
  
- [ ] Security reviews
  - [ ] Quarterly security audits
  - [ ] Annual penetration testing
  
- [ ] Performance reviews
  - [ ] Monthly performance metrics review
  - [ ] Capacity planning quarterly

## Support & Incident Response

### On-Call Information
- Primary on-call: [Contact info]
- Secondary on-call: [Contact info]
- Escalation path: [Details]

### Monitoring Dashboards
- Application metrics: [Dashboard URL]
- Infrastructure metrics: [Dashboard URL]
- Logs: [Log aggregation URL]

### Common Issues & Solutions
See [RUNBOOK.md](./RUNBOOK.md) for:
- Database connection issues
- Redis connection issues
- Job queue stuck
- High memory usage
- Certificate expiration
- Deployment failures

## Sign-off

- [ ] DevOps lead approval
- [ ] Security team approval
- [ ] Product owner approval
- [ ] Deployment date scheduled
- [ ] Stakeholders notified
- [ ] Rollback plan reviewed

---

**Last Updated:** [Date]  
**Next Review:** [Date]  
**Maintained by:** [Team/Person]
