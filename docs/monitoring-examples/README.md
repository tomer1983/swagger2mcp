# Monitoring & Observability Setup Guide

This guide provides examples for setting up monitoring and observability for Swagger2MCP in production.

## Overview

A production-ready monitoring stack should include:
- **Metrics**: Track application and infrastructure performance
- **Logs**: Centralized log aggregation and analysis
- **Traces**: Distributed tracing for request flows
- **Alerts**: Proactive notifications for issues
- **Dashboards**: Visualize system health and performance

## Key Metrics to Monitor

### Application Metrics
- HTTP request rate and response times
- Error rates by endpoint
- Database query performance
- Redis operations
- Job queue depth and processing rate
- Active sessions/users

### Infrastructure Metrics
- CPU and memory usage
- Disk I/O and space
- Network traffic
- Container health
- Database connections

### Business Metrics
- Schemas processed
- Successful exports
- Failed jobs
- User registrations (if applicable)

## Quick Start Examples

See the configuration files in this directory for:
- `prometheus.yml` - Prometheus scrape configuration
- `grafana/` - Pre-built Grafana dashboards
- `loki-config.yml` - Loki log aggregation
- `alerting-rules.yml` - Example alert rules

For detailed setup instructions, see the main monitoring documentation.
