# Kubernetes Deployment Guide

This guide covers deploying swagger2mcp to Kubernetes using raw manifests or Helm charts.

## Prerequisites

- [kubectl](https://kubernetes.io/docs/tasks/tools/) v1.25+
- [Helm](https://helm.sh/docs/intro/install/) v3.10+ (for Helm deployment)
- Access to a Kubernetes cluster (local or cloud)

## Quick Start with Manifests

### 1. Create Namespace and Secrets

```bash
# Apply namespace
kubectl apply -f k8s/namespace.yaml

# Copy and configure secrets
cp k8s/secrets.yaml.template k8s/secrets.yaml
# Edit k8s/secrets.yaml with your actual credentials

kubectl apply -f k8s/secrets.yaml
kubectl apply -f k8s/configmap.yaml
```

### 2. Deploy Infrastructure

```bash
# Deploy Redis
kubectl apply -f k8s/redis/

# Deploy PostgreSQL
kubectl apply -f k8s/postgres/

# Wait for infrastructure to be ready
kubectl wait --for=condition=ready pod -l app.kubernetes.io/component=redis -n swagger2mcp --timeout=120s
kubectl wait --for=condition=ready pod -l app.kubernetes.io/component=postgres -n swagger2mcp --timeout=120s
```

### 3. Deploy Application

```bash
# Deploy backend, worker, and frontend
kubectl apply -f k8s/backend/
kubectl apply -f k8s/worker/
kubectl apply -f k8s/frontend/

# Optional: Deploy ingress
kubectl apply -f k8s/ingress.yaml
```

### 4. Verify Deployment

```bash
# Check all pods are running
kubectl get pods -n swagger2mcp

# Check services
kubectl get svc -n swagger2mcp
```

### 5. Access the Application

**Port Forward (for testing):**
```bash
kubectl port-forward svc/frontend 5173:5173 -n swagger2mcp
kubectl port-forward svc/backend 3000:3000 -n swagger2mcp
```

**Via Ingress:**
Add `swagger2mcp.local` to your `/etc/hosts` pointing to your ingress controller IP.

---

## Helm Chart Deployment

### Installation

```bash
# Install directly from the charts directory
helm install swagger2mcp ./charts/swagger2mcp \
  --namespace swagger2mcp \
  --create-namespace

# Or with custom values
helm install swagger2mcp ./charts/swagger2mcp \
  --namespace swagger2mcp \
  --create-namespace \
  -f my-values.yaml
```

### Configuration

Key values to override in production:

| Parameter | Description | Default |
|-----------|-------------|---------|
| `secrets.jwtSecret` | JWT signing secret | `dev-secret-key...` |
| `secrets.postgresPassword` | PostgreSQL password | `postgres` |
| `secrets.adminEmail` | Default admin email | `admin@swagger2mcp.local` |
| `secrets.adminPassword` | Default admin password | `changeme123` |
| `backend.replicaCount` | Backend replicas | `1` |
| `ingress.enabled` | Enable ingress | `true` |
| `ingress.host` | Ingress hostname | `swagger2mcp.local` |

### Upgrade

```bash
helm upgrade swagger2mcp ./charts/swagger2mcp \
  --namespace swagger2mcp \
  -f my-values.yaml
```

### Uninstall

```bash
helm uninstall swagger2mcp --namespace swagger2mcp
kubectl delete namespace swagger2mcp
```

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                      Ingress                             │
│                    (swagger2mcp.local)                   │
└─────────────────────┬───────────────────────────────────┘
                      │
          ┌───────────┴───────────┐
          │                       │
          ▼                       ▼
    ┌──────────┐           ┌──────────┐
    │ Frontend │           │ Backend  │
    │  (5173)  │           │  (3000)  │
    └──────────┘           └────┬─────┘
                                │
                    ┌───────────┴───────────┐
                    │                       │
                    ▼                       ▼
              ┌──────────┐           ┌──────────┐
              │  Redis   │           │ Postgres │
              │  (6379)  │           │  (5432)  │
              └──────────┘           └──────────┘
                    ▲
                    │
              ┌──────────┐
              │  Worker  │
              └──────────┘
```

---

## Troubleshooting

### Check Pod Logs
```bash
kubectl logs -f deployment/backend -n swagger2mcp
kubectl logs -f deployment/worker -n swagger2mcp
```

### Describe Failing Pods
```bash
kubectl describe pod <pod-name> -n swagger2mcp
```

### Database Connection Issues
Ensure PostgreSQL is running and the `DATABASE_URL` in the configmap is correct:
```bash
kubectl get configmap swagger2mcp-config -n swagger2mcp -o yaml
```
