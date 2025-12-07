import { api } from './api';

export interface HealthCheck {
  status: 'healthy' | 'degraded' | 'unhealthy';
  message: string;
  uptime?: number;
  activeWorkers?: number;
}

export interface HealthResponse {
  timestamp: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  checks: {
    backend: HealthCheck;
    database: HealthCheck;
    redis: HealthCheck;
    worker: HealthCheck;
  };
}

export interface MetricsResponse {
  timestamp: string;
  timeframe: '24h' | '7d' | '30d';
  uptime: number;
  schemas: {
    total: number;
    recent: number;
    byType: Array<{ type: string; _count: number }>;
  };
  jobs: {
    waiting: number;
    active: number;
    completed: number;
    failed: number;
    avgDuration: number;
  };
  users: {
    total: number;
    recent: number;
    activeSessions: number;
  };
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  actor: {
    id: string;
    email: string;
    displayName: string | null;
  } | null;
  action: string;
  target: string | null;
  result: 'success' | 'failure';
  metadata: Record<string, any> | null;
}

export interface AuditQueryParams {
  page?: number;
  pageSize?: number;
  action?: string;
  actorId?: string;
  result?: 'success' | 'failure';
  startDate?: string;
  endDate?: string;
}

export interface PaginatedAuditResult {
  data: AuditLogEntry[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// Admin API calls
export const getHealth = async (): Promise<HealthResponse> => {
  const res = await api.get('/admin/health');
  return res.data;
};

export const getMetrics = async (timeframe: '24h' | '7d' | '30d' = '24h'): Promise<MetricsResponse> => {
  const res = await api.get('/admin/metrics', { params: { timeframe } });
  return res.data;
};

// Audit API calls
export const getAuditLogs = async (params: AuditQueryParams = {}): Promise<PaginatedAuditResult> => {
  const res = await api.get('/admin/audit', { params });
  return res.data;
};

export const getAuditActions = async (): Promise<string[]> => {
  const res = await api.get('/admin/audit/actions');
  return res.data;
};

export const exportAuditLogs = async (params: Omit<AuditQueryParams, 'page' | 'pageSize'> = {}): Promise<Blob> => {
  const res = await api.get('/admin/audit/export', { 
    params,
    responseType: 'blob'
  });
  return res.data;
};
