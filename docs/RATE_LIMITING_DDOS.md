# Rate Limiting & DDoS Protection Guide

This guide covers implementing rate limiting and DDoS protection for Swagger2MCP in production.

## Overview

Rate limiting prevents abuse by limiting the number of requests a client can make. DDoS protection adds additional layers to prevent distributed denial-of-service attacks.

## Application-Level Rate Limiting

### Express Rate Limit (Already Configured)

The backend already uses `express-rate-limit`. Review and adjust configuration in `backend/src/server.ts` or routes:

```typescript
import rateLimit from 'express-rate-limit';

// General API rate limit
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

// Stricter limit for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5, // Only 5 requests per 15 minutes for failed logins
  skipSuccessfulRequests: true, // Don't count successful logins
});

// Apply to routes
app.use('/api/', apiLimiter);
app.use('/api/auth/login', authLimiter);
```

### Production Configuration Recommendations

**API Endpoints:**
- General API: 100 requests/15 min per IP
- File Upload: 10 uploads/hour per IP
- Schema Generation: 20 generations/hour per IP
- Authentication: 5 failed attempts/15 min per IP

**Implementation Example:**

```typescript
// backend/src/middleware/rateLimits.ts
import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import { redis } from '../lib/redis';

// Use Redis for distributed rate limiting
const createRateLimiter = (windowMs: number, max: number) => {
  return rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    store: new RedisStore({
      client: redis,
      prefix: 'rate-limit:',
    }),
    handler: (req, res) => {
      res.status(429).json({
        error: 'Too many requests',
        retryAfter: res.getHeader('Retry-After'),
      });
    },
  });
};

export const apiLimiter = createRateLimiter(15 * 60 * 1000, 100);
export const uploadLimiter = createRateLimiter(60 * 60 * 1000, 10);
export const generateLimiter = createRateLimiter(60 * 60 * 1000, 20);
export const authLimiter = createRateLimiter(15 * 60 * 1000, 5);
```

## Nginx Rate Limiting

If using Nginx as a reverse proxy, add rate limiting at the proxy level:

### Basic Rate Limiting

```nginx
# /etc/nginx/nginx.conf or /etc/nginx/sites-available/swagger2mcp

# Define rate limit zones
http {
    # Limit by IP address - 10 requests per second per IP
    limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;
    
    # Stricter limit for uploads - 2 requests per second
    limit_req_zone $binary_remote_addr zone=upload_limit:10m rate=2r/s;
    
    # Very strict for auth - 1 request per 3 seconds
    limit_req_zone $binary_remote_addr zone=auth_limit:10m rate=20r/m;
    
    # Connection limit per IP
    limit_conn_zone $binary_remote_addr zone=conn_limit:10m;
    
    server {
        listen 80;
        server_name yourdomain.com;
        
        # Redirect to HTTPS
        return 301 https://$server_name$request_uri;
    }
    
    server {
        listen 443 ssl http2;
        server_name yourdomain.com;
        
        # SSL configuration
        ssl_certificate /etc/ssl/certs/yourdomain.crt;
        ssl_certificate_key /etc/ssl/private/yourdomain.key;
        
        # Security headers
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header X-XSS-Protection "1; mode=block" always;
        add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
        
        # Limit connections per IP
        limit_conn conn_limit 10;
        
        # API endpoints
        location /api/ {
            limit_req zone=api_limit burst=20 nodelay;
            limit_req_status 429;
            
            proxy_pass http://backend:3000;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            
            # Timeouts
            proxy_connect_timeout 60s;
            proxy_send_timeout 60s;
            proxy_read_timeout 60s;
        }
        
        # Upload endpoint - stricter limit
        location /api/upload {
            limit_req zone=upload_limit burst=5 nodelay;
            limit_req_status 429;
            
            # Increase body size for uploads
            client_max_body_size 50M;
            
            proxy_pass http://backend:3000;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            
            # Longer timeout for uploads
            proxy_read_timeout 300s;
        }
        
        # Auth endpoints - strictest limit
        location /api/auth/ {
            limit_req zone=auth_limit burst=2 nodelay;
            limit_req_status 429;
            
            proxy_pass http://backend:3000;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        }
        
        # Frontend
        location / {
            limit_req zone=api_limit burst=50 nodelay;
            
            proxy_pass http://frontend:80;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        }
    }
}
```

### Advanced Nginx Configuration

```nginx
# Detect and block bad bots
map $http_user_agent $bad_bot {
    default 0;
    ~*^$ 1; # Empty user agent
    ~*(bot|crawler|spider|scraper) 1;
    # Add more patterns as needed
}

# Block based on user agent
if ($bad_bot) {
    return 403;
}

# Prevent buffer overflow attacks
client_body_buffer_size 1K;
client_header_buffer_size 1k;
client_max_body_size 50M;
large_client_header_buffers 2 1k;

# Timeouts to prevent slowloris attacks
client_body_timeout 10;
client_header_timeout 10;
keepalive_timeout 5 5;
send_timeout 10;
```

## Cloud-Based DDoS Protection

### Option 1: Cloudflare (Recommended for Small-Medium Deployments)

1. **Set up Cloudflare:**
   - Point your domain to Cloudflare nameservers
   - Enable proxy (orange cloud) for your domain
   - Cloudflare provides DDoS protection automatically

2. **Configure Security Settings:**
   - Security → WAF → Enable
   - Security → Rate Limiting → Configure rules
   - Security → Bot Fight Mode → Enable
   - SSL/TLS → Full (strict)

3. **Rate Limiting Rules (Cloudflare):**
   ```
   # API endpoints
   If: (http.request.uri.path contains "/api/")
   Then: Rate limit 100 requests per minute per IP
   
   # Upload endpoint
   If: (http.request.uri.path contains "/api/upload")
   Then: Rate limit 10 requests per minute per IP
   
   # Auth endpoints
   If: (http.request.uri.path contains "/api/auth/")
   Then: Rate limit 5 requests per minute per IP
   ```

4. **Page Rules:**
   - Cache static assets
   - Bypass cache for API endpoints
   - Always use HTTPS

### Option 2: AWS WAF (for AWS Deployments)

```yaml
# AWS WAF Configuration (CloudFormation/Terraform)
WebACL:
  Type: AWS::WAFv2::WebACL
  Properties:
    Scope: REGIONAL
    DefaultAction:
      Allow: {}
    Rules:
      # Rate limiting rule
      - Name: RateLimitRule
        Priority: 1
        Statement:
          RateBasedStatement:
            Limit: 2000  # requests per 5 minutes
            AggregateKeyType: IP
        Action:
          Block: {}
        VisibilityConfig:
          SampledRequestsEnabled: true
          CloudWatchMetricsEnabled: true
          MetricName: RateLimitRule
      
      # Geo-blocking (if needed)
      - Name: GeoBlockingRule
        Priority: 2
        Statement:
          GeoMatchStatement:
            CountryCodes:
              - XX  # Replace with countries to block
        Action:
          Block: {}
        VisibilityConfig:
          SampledRequestsEnabled: true
          CloudWatchMetricsEnabled: true
          MetricName: GeoBlockingRule
      
      # AWS Managed Rules - Core Rule Set
      - Name: AWSManagedRulesCommonRuleSet
        Priority: 3
        OverrideAction:
          None: {}
        Statement:
          ManagedRuleGroupStatement:
            VendorName: AWS
            Name: AWSManagedRulesCommonRuleSet
        VisibilityConfig:
          SampledRequestsEnabled: true
          CloudWatchMetricsEnabled: true
          MetricName: AWSManagedRulesCommonRuleSet
```

### Option 3: Google Cloud Armor (for GCP)

```yaml
# Cloud Armor Security Policy
apiVersion: compute.googleapis.com/v1
kind: SecurityPolicy
metadata:
  name: swagger2mcp-security-policy
spec:
  rules:
    # Rate limiting
    - action: rate_based_ban
      match:
        config:
          srcIpRanges:
            - "*"
      rateLimitOptions:
        conformAction: allow
        exceedAction: deny-403
        enforceOnKey: IP
        rateLimitThreshold:
          count: 100
          intervalSec: 60
    
    # OWASP rules
    - action: deny-403
      match:
        expr:
          expression: evaluatePreconfiguredExpr('xss-stable')
    
    - action: deny-403
      match:
        expr:
          expression: evaluatePreconfiguredExpr('sqli-stable')
```

## Kubernetes Ingress Rate Limiting

If using Kubernetes with Nginx Ingress Controller:

```yaml
# Ingress with rate limiting annotations
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: swagger2mcp-ingress
  namespace: swagger2mcp
  annotations:
    # Rate limiting
    nginx.ingress.kubernetes.io/limit-rps: "10"
    nginx.ingress.kubernetes.io/limit-burst-multiplier: "2"
    nginx.ingress.kubernetes.io/limit-connections: "10"
    
    # Connection limits
    nginx.ingress.kubernetes.io/limit-whitelist: "10.0.0.0/8"
    
    # Cors
    nginx.ingress.kubernetes.io/enable-cors: "true"
    nginx.ingress.kubernetes.io/cors-allow-origin: "https://yourdomain.com"
    
    # SSL redirect
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
    nginx.ingress.kubernetes.io/force-ssl-redirect: "true"
    
    # Body size
    nginx.ingress.kubernetes.io/proxy-body-size: "50m"
spec:
  ingressClassName: nginx
  tls:
    - hosts:
        - yourdomain.com
      secretName: swagger2mcp-tls
  rules:
    - host: yourdomain.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: frontend-service
                port:
                  number: 80
          - path: /api
            pathType: Prefix
            backend:
              service:
                name: backend-service
                port:
                  number: 3000
```

## IP Allowlisting/Blocklisting

### Application Level

```typescript
// backend/src/middleware/ipFilter.ts
import { Request, Response, NextFunction } from 'express';

const BLOCKED_IPS = process.env.BLOCKED_IPS?.split(',') || [];
const ALLOWED_IPS = process.env.ALLOWED_IPS?.split(',') || [];

export const ipFilter = (req: Request, res: Response, next: NextFunction) => {
  const clientIp = req.ip || req.connection.remoteAddress || '';
  
  // If allowlist is configured, only allow those IPs
  if (ALLOWED_IPS.length > 0) {
    if (!ALLOWED_IPS.includes(clientIp)) {
      return res.status(403).json({ error: 'Access denied' });
    }
  }
  
  // Check blocklist
  if (BLOCKED_IPS.includes(clientIp)) {
    return res.status(403).json({ error: 'Access denied' });
  }
  
  next();
};

// Apply to specific routes
app.use('/api/admin', ipFilter);
```

### Nginx Level

```nginx
# IP allowlist for admin endpoints
location /api/admin/ {
    allow 10.0.0.0/8;      # Internal network
    allow 203.0.113.0/24;  # Office IP range
    deny all;
    
    proxy_pass http://backend:3000;
}

# Block specific IPs
deny 192.0.2.1;
deny 198.51.100.0/24;
```

## Monitoring & Alerts

### Metrics to Track

- Request rate per endpoint
- 429 (Too Many Requests) responses
- Blocked requests
- Unique IPs making requests
- Failed authentication attempts

### Alert Examples

```yaml
# Prometheus alert for high rate limit hits
- alert: HighRateLimitHits
  expr: rate(http_requests_total{status="429"}[5m]) > 10
  for: 5m
  labels:
    severity: warning
  annotations:
    summary: "High number of rate limit hits"
    description: "More than 10 requests per second are being rate limited"

# Alert for potential DDoS
- alert: PotentialDDoS
  expr: rate(http_requests_total[1m]) > 1000
  for: 2m
  labels:
    severity: critical
  annotations:
    summary: "Possible DDoS attack"
    description: "Request rate is abnormally high: {{ $value }} req/s"
```

## Testing Rate Limits

```bash
# Test rate limit with curl
for i in {1..150}; do
  curl -s -o /dev/null -w "%{http_code}\n" https://yourdomain.com/api/health
  sleep 0.1
done

# Should see 200s first, then 429s after hitting limit

# Test with Apache Bench
ab -n 1000 -c 10 https://yourdomain.com/api/health

# Test with k6 (load testing tool)
k6 run - <<EOF
import http from 'k6/http';
import { check } from 'k6';

export default function() {
  const res = http.get('https://yourdomain.com/api/health');
  check(res, {
    'status is 200 or 429': (r) => r.status === 200 || r.status === 429,
  });
}
EOF
```

## Best Practices

1. **Layer your protection:**
   - Cloud provider DDoS protection (Cloudflare/AWS Shield)
   - Web Application Firewall (WAF)
   - Nginx rate limiting
   - Application-level rate limiting

2. **Use Redis for distributed rate limiting:**
   - Ensures rate limits work across multiple instances
   - Already configured with express-rate-limit + RedisStore

3. **Different limits for different endpoints:**
   - Stricter for auth, upload, generation
   - Looser for read-only endpoints
   - Very loose for health checks

4. **Consider authenticated users:**
   - Higher limits for authenticated users
   - Per-user rate limiting instead of per-IP
   - API key-based rate limiting

5. **Monitor and adjust:**
   - Track legitimate users hitting limits
   - Adjust thresholds based on actual usage
   - Alert on unusual patterns

6. **Graceful degradation:**
   - Return proper 429 status codes
   - Include Retry-After header
   - Provide clear error messages

7. **Documentation:**
   - Document rate limits in API docs
   - Provide guidance for users who hit limits
   - Explain how to request higher limits

## References

- [OWASP: Denial of Service](https://owasp.org/www-community/attacks/Denial_of_Service)
- [Nginx Rate Limiting](https://www.nginx.com/blog/rate-limiting-nginx/)
- [Express Rate Limit](https://github.com/express-rate-limit/express-rate-limit)
- [Cloudflare DDoS Protection](https://www.cloudflare.com/ddos/)
