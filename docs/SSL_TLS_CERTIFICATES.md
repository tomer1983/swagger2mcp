# SSL/TLS Certificate Management Guide

This guide covers obtaining, configuring, and managing SSL/TLS certificates for Swagger2MCP in production.

## Overview

HTTPS is mandatory for production deployments to:
- Encrypt data in transit
- Protect user credentials
- Enable modern browser features
- Improve SEO rankings
- Build user trust

## Certificate Options

### 1. Let's Encrypt (Free, Recommended for Most Cases)

**Pros:**
- Free
- Automated renewal
- Trusted by all major browsers
- Easy to set up

**Cons:**
- 90-day validity (requires auto-renewal)
- Rate limits (50 certificates per week per domain)

### 2. Commercial Certificates

**Pros:**
- Longer validity (1-2 years)
- Extended validation (EV) certificates available
- Better support

**Cons:**
- Costs money
- Manual renewal process

### 3. Cloud Provider Certificates

**Pros:**
- Integrated with cloud infrastructure
- Automatic renewal
- Free (usually)

**Cons:**
- Locked to specific cloud provider
- May require using their load balancer

## Let's Encrypt Setup

### Option 1: Certbot with Nginx

**Installation:**

```bash
# Ubuntu/Debian
sudo apt-get update
sudo apt-get install certbot python3-certbot-nginx

# RHEL/CentOS
sudo yum install certbot python3-certbot-nginx
```

**Obtain Certificate:**

```bash
# Automatic configuration (recommended)
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Manual configuration
sudo certbot certonly --nginx -d yourdomain.com
```

**Nginx Configuration (if manual):**

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    
    # ACME challenge location for Let's Encrypt
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }
    
    # Redirect all other traffic to HTTPS
    location / {
        return 301 https://$server_name$request_uri;
    }
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;
    
    # SSL certificate files
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    
    # SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers 'ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384';
    ssl_prefer_server_ciphers off;
    
    # HSTS (HTTP Strict Transport Security)
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    
    # OCSP Stapling
    ssl_stapling on;
    ssl_stapling_verify on;
    ssl_trusted_certificate /etc/letsencrypt/live/yourdomain.com/chain.pem;
    
    # Your application configuration
    location / {
        proxy_pass http://frontend:80;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    location /api/ {
        proxy_pass http://backend:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

**Automatic Renewal:**

```bash
# Test renewal
sudo certbot renew --dry-run

# Set up auto-renewal (certbot usually configures this automatically)
# Check systemd timer
sudo systemctl status certbot.timer

# Or add to crontab
sudo crontab -e
# Add: 0 3 * * * certbot renew --quiet --post-hook "nginx -s reload"
```

### Option 2: Docker with Let's Encrypt

**Docker Compose with Certbot:**

```yaml
# docker-compose.production.yml
services:
  nginx:
    image: nginx:alpine
    container_name: swagger2mcp-nginx
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./nginx/conf.d:/etc/nginx/conf.d:ro
      - certbot-etc:/etc/letsencrypt
      - certbot-var:/var/lib/letsencrypt
      - certbot-www:/var/www/certbot
    depends_on:
      - backend
      - frontend
    networks:
      - swagger2mcp-network
    command: >
      /bin/sh -c "while :; do sleep 6h & wait $${!}; nginx -s reload; done & nginx -g 'daemon off;'"

  certbot:
    image: certbot/certbot:latest
    container_name: swagger2mcp-certbot
    volumes:
      - certbot-etc:/etc/letsencrypt
      - certbot-var:/var/lib/letsencrypt
      - certbot-www:/var/www/certbot
    entrypoint: >
      /bin/sh -c "trap exit TERM; while :; do certbot renew; sleep 12h & wait $${!}; done;"

volumes:
  certbot-etc:
  certbot-var:
  certbot-www:
```

**Initial Certificate Request:**

```bash
# Create nginx config directory
mkdir -p nginx/conf.d

# Obtain certificate
docker compose run --rm certbot certonly --webroot \
  --webroot-path=/var/www/certbot \
  --email admin@yourdomain.com \
  --agree-tos \
  --no-eff-email \
  -d yourdomain.com \
  -d www.yourdomain.com

# Reload nginx
docker compose exec nginx nginx -s reload
```

## Kubernetes with cert-manager

**Install cert-manager:**

```bash
# Add helm repo
helm repo add jetstack https://charts.jetstack.io
helm repo update

# Install cert-manager
kubectl create namespace cert-manager
helm install cert-manager jetstack/cert-manager \
  --namespace cert-manager \
  --version v1.13.0 \
  --set installCRDs=true
```

**Create ClusterIssuer (Let's Encrypt):**

```yaml
# cert-manager/letsencrypt-prod.yaml
apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: letsencrypt-prod
spec:
  acme:
    server: https://acme-v02.api.letsencrypt.org/directory
    email: admin@yourdomain.com
    privateKeySecretRef:
      name: letsencrypt-prod
    solvers:
    - http01:
        ingress:
          class: nginx
```

```bash
kubectl apply -f cert-manager/letsencrypt-prod.yaml
```

**Update Ingress for TLS:**

```yaml
# k8s/ingress.yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: swagger2mcp-ingress
  namespace: swagger2mcp
  annotations:
    cert-manager.io/cluster-issuer: "letsencrypt-prod"
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
    nginx.ingress.kubernetes.io/force-ssl-redirect: "true"
spec:
  ingressClassName: nginx
  tls:
    - hosts:
        - yourdomain.com
        - www.yourdomain.com
      secretName: swagger2mcp-tls  # cert-manager will create this secret
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

**Monitor Certificate:**

```bash
# Check certificate status
kubectl get certificate -n swagger2mcp

# Describe certificate for details
kubectl describe certificate swagger2mcp-tls -n swagger2mcp

# Check cert-manager logs
kubectl logs -n cert-manager deployment/cert-manager
```

## Cloud Provider Certificates

### AWS Certificate Manager (ACM)

```bash
# Request certificate
aws acm request-certificate \
  --domain-name yourdomain.com \
  --subject-alternative-names www.yourdomain.com \
  --validation-method DNS \
  --region us-east-1

# Get certificate ARN from output, then validate via DNS
# Add CNAME records shown in ACM console to your DNS

# Use with ALB
aws elbv2 create-listener \
  --load-balancer-arn <alb-arn> \
  --protocol HTTPS \
  --port 443 \
  --certificates CertificateArn=<certificate-arn> \
  --default-actions Type=forward,TargetGroupArn=<target-group-arn>
```

### Google Cloud SSL Certificates

```bash
# Create managed certificate
gcloud compute ssl-certificates create swagger2mcp-cert \
  --domains=yourdomain.com,www.yourdomain.com \
  --global

# Check provisioning status
gcloud compute ssl-certificates describe swagger2mcp-cert --global

# Use with load balancer
gcloud compute target-https-proxies create swagger2mcp-https-proxy \
  --ssl-certificates=swagger2mcp-cert \
  --url-map=swagger2mcp-url-map
```

### Azure App Service

```bash
# Custom domain
az webapp config hostname add \
  --webapp-name swagger2mcp-app \
  --resource-group swagger2mcp-rg \
  --hostname yourdomain.com

# Bind SSL certificate
az webapp config ssl bind \
  --name swagger2mcp-app \
  --resource-group swagger2mcp-rg \
  --certificate-thumbprint <thumbprint> \
  --ssl-type SNI
```

## Certificate Renewal Monitoring

### Automated Monitoring

**Prometheus Exporter:**

```bash
# Install ssl-exporter
docker run -d -p 9219:9219 \
  ribbybibby/ssl-exporter:latest \
  --listen-address=:9219

# Or add to docker-compose.yml
services:
  ssl-exporter:
    image: ribbybibby/ssl-exporter:latest
    container_name: swagger2mcp-ssl-exporter
    ports:
      - "9219:9219"
    command: ["--listen-address=:9219"]
```

**Prometheus Alert:**

```yaml
# monitoring/alerting-rules.yml
- alert: SSLCertificateExpiringSoon
  expr: ssl_cert_not_after - time() < 86400 * 30  # 30 days
  for: 1h
  labels:
    severity: warning
  annotations:
    summary: "SSL certificate expiring soon"
    description: "SSL certificate for {{ $labels.instance }} expires in {{ $value | humanizeDuration }}"

- alert: SSLCertificateExpired
  expr: ssl_cert_not_after - time() < 0
  for: 1m
  labels:
    severity: critical
  annotations:
    summary: "SSL certificate expired"
    description: "SSL certificate for {{ $labels.instance }} has expired"
```

### Manual Checks

```bash
# Check certificate expiration
echo | openssl s_client -servername yourdomain.com -connect yourdomain.com:443 2>/dev/null | \
  openssl x509 -noout -dates

# Check certificate details
curl -vI https://yourdomain.com 2>&1 | grep -A 10 'Server certificate'

# Using SSL Labs
# Visit: https://www.ssllabs.com/ssltest/analyze.html?d=yourdomain.com
```

## SSL/TLS Best Practices

### Security Configuration

**Strong Ciphers Only:**

```nginx
# Nginx configuration
ssl_protocols TLSv1.2 TLSv1.3;
ssl_ciphers 'ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384';
ssl_prefer_server_ciphers off;

# Diffie-Hellman parameters
ssl_dhparam /etc/nginx/dhparam.pem;
```

Generate DH parameters:
```bash
openssl dhparam -out /etc/nginx/dhparam.pem 2048
```

**Security Headers:**

```nginx
# HSTS
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;

# Other security headers
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
```

### Certificate Chain Verification

```bash
# Verify certificate chain
openssl s_client -connect yourdomain.com:443 -showcerts

# Check if chain is complete
curl -I https://yourdomain.com

# Test with SSL Labs
# Should get A+ rating with proper configuration
```

### OCSP Stapling

```nginx
ssl_stapling on;
ssl_stapling_verify on;
ssl_trusted_certificate /etc/letsencrypt/live/yourdomain.com/chain.pem;
resolver 8.8.8.8 8.8.4.4 valid=300s;
resolver_timeout 5s;
```

## Troubleshooting

### Common Issues

**Certificate Not Trusted:**
- Ensure full chain is configured (fullchain.pem, not cert.pem)
- Check intermediate certificates are included

**Mixed Content Warnings:**
- Ensure all resources (CSS, JS, images) are loaded over HTTPS
- Update backend to use HTTPS URLs

**Certificate Mismatch:**
- Verify domain name matches certificate CN/SAN
- Check for www vs non-www mismatch

**Renewal Failures:**
```bash
# Check certbot logs
sudo tail -f /var/log/letsencrypt/letsencrypt.log

# Test renewal manually
sudo certbot renew --dry-run

# Check webroot permissions
ls -la /var/www/certbot/.well-known/acme-challenge/
```

### Emergency Certificate Replacement

If certificate is compromised or expired:

```bash
# Revoke old certificate
sudo certbot revoke --cert-path /etc/letsencrypt/live/yourdomain.com/cert.pem

# Request new certificate
sudo certbot certonly --nginx -d yourdomain.com --force-renewal

# Reload nginx
sudo nginx -s reload
```

## Testing Your SSL Configuration

**Online Tools:**
- [SSL Labs](https://www.ssllabs.com/ssltest/)
- [Mozilla Observatory](https://observatory.mozilla.org/)
- [SecurityHeaders.com](https://securityheaders.com/)

**Command Line:**
```bash
# Check certificate
curl -vI https://yourdomain.com

# Test with different protocols
openssl s_client -connect yourdomain.com:443 -tls1_2
openssl s_client -connect yourdomain.com:443 -tls1_3

# Check HSTS
curl -I https://yourdomain.com | grep -i strict
```

## Certificate Backup

**Backup Certificate Files:**

```bash
# Let's Encrypt certificates
sudo tar -czf letsencrypt-backup-$(date +%Y%m%d).tar.gz /etc/letsencrypt/

# Copy to secure location
scp letsencrypt-backup-*.tar.gz user@backup-server:/backups/

# Or upload to S3
aws s3 cp letsencrypt-backup-*.tar.gz s3://your-backup-bucket/certificates/
```

**Restore:**

```bash
# Extract backup
sudo tar -xzf letsencrypt-backup-20240115.tar.gz -C /

# Reload nginx
sudo nginx -s reload
```

## Checklist

- [ ] Obtain SSL certificate (Let's Encrypt or commercial)
- [ ] Configure nginx/reverse proxy with certificate
- [ ] Enable HTTPS redirect (HTTP → HTTPS)
- [ ] Configure strong ciphers and protocols
- [ ] Enable HSTS header
- [ ] Enable OCSP stapling
- [ ] Set up automatic renewal
- [ ] Configure monitoring for expiration
- [ ] Test configuration with SSL Labs (aim for A+)
- [ ] Document renewal process
- [ ] Set up alerts for certificate expiration
- [ ] Backup certificate files
- [ ] Test renewal process
- [ ] Update application to use HTTPS URLs
- [ ] Test all functionality over HTTPS

## References

- [Let's Encrypt Documentation](https://letsencrypt.org/docs/)
- [Mozilla SSL Configuration Generator](https://ssl-config.mozilla.org/)
- [cert-manager Documentation](https://cert-manager.io/docs/)
- [OWASP TLS Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Transport_Layer_Protection_Cheat_Sheet.html)
