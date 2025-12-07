import React, { useState, useEffect, useCallback } from 'react';
import { Activity, CheckCircle, AlertCircle, Clock, RefreshCw, Database, Server, Layers, Users, FileJson, Zap, Pause, Play } from 'lucide-react';
import { getHealth, getMetrics } from '../../lib/admin-api';
import { getConfig } from '../../lib/api';
import type { HealthResponse, MetricsResponse } from '../../lib/admin-api';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';
import { Alert, AlertDescription } from '../../components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';

export const AdminObservability: React.FC = () => {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [metrics, setMetrics] = useState<MetricsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [pollingInterval, setPollingInterval] = useState(2000);
  const [timeframe, setTimeframe] = useState<'24h' | '7d' | '30d'>('24h');
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [healthData, metricsData] = await Promise.all([
        getHealth(),
        getMetrics(timeframe),
      ]);
      setHealth(healthData);
      setMetrics(metricsData);
      setLastUpdate(new Date());
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [timeframe]);

  // Load polling interval from config on mount
  useEffect(() => {
    const loadPollingInterval = async () => {
      try {
        const config = await getConfig();
        const observabilityConfig = config.observability || [];
        const intervalConfig = observabilityConfig.find((c: any) => c.key === 'observability.pollingInterval');
        if (intervalConfig) {
          const interval = typeof intervalConfig.value === 'number' ? intervalConfig.value : parseInt(intervalConfig.value, 10);
          if (interval >= 1000 && interval <= 10000) {
            setPollingInterval(interval);
          }
        }
      } catch {
        // Use default
      }
    };
    loadPollingInterval();
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(fetchData, pollingInterval);
    return () => clearInterval(interval);
  }, [autoRefresh, pollingInterval, fetchData]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800';
      case 'warning':
        return 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800';
      case 'degraded':
        return 'text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800';
      case 'unhealthy':
        return 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800';
      default:
        return 'text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/20 border-slate-200 dark:border-slate-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />;
      case 'warning':
      case 'degraded':
        return <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400" />;
      case 'unhealthy':
        return <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />;
      default:
        return <Activity className="w-5 h-5 text-slate-400" />;
    }
  };

  const formatUptime = (seconds: number): string => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (days > 0) return `${days}d ${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const formatDuration = (ms: number): string => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  const getFailureRate = (): number => {
    if (!metrics) return 0;
    const total = metrics.jobs.completed + metrics.jobs.failed;
    if (total === 0) return 0;
    return (metrics.jobs.failed / total) * 100;
  };

  const getFailureRateColor = (rate: number): string => {
    if (rate === 0) return 'text-emerald-600 dark:text-emerald-400';
    if (rate < 5) return 'text-amber-600 dark:text-amber-400';
    return 'text-red-600 dark:text-red-400';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground mb-1">
            Observability
          </h2>
          <p className="text-muted-foreground">
            System health and performance metrics.
          </p>
        </div>
        <div className="flex items-center gap-4">
          {/* Timeframe selector */}
          <Select value={timeframe} onValueChange={(v) => setTimeframe(v as '24h' | '7d' | '30d')}>
            <SelectTrigger className="w-[150px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="24h">Last 24 hours</SelectItem>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
            </SelectContent>
          </Select>

          {/* Auto-refresh toggle */}
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`flex items-center gap-2 px-3 py-1.5 text-sm rounded-md border transition-colors ${
              autoRefresh
                ? 'bg-primary/10 border-primary/30 text-primary'
                : 'bg-muted border-border text-muted-foreground'
            }`}
          >
            {autoRefresh ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            {autoRefresh ? `Auto (${pollingInterval / 1000}s)` : 'Paused'}
          </button>

          <Button
            variant="outline"
            size="sm"
            onClick={fetchData}
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Last update indicator */}
      {lastUpdate && (
        <p className="text-xs text-muted-foreground">
          Last updated: {lastUpdate.toLocaleTimeString()}
        </p>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Metrics Cards */}
      {metrics && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Jobs Waiting */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-2">
                <Clock className="w-4 h-4" />
                <span className="text-xs font-medium uppercase tracking-wide">Jobs Waiting</span>
              </div>
              <p className="text-2xl font-bold text-foreground">{metrics.jobs.waiting}</p>
            </CardContent>
          </Card>

          {/* Jobs Active */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-2">
                <Zap className="w-4 h-4" />
                <span className="text-xs font-medium uppercase tracking-wide">Jobs Active</span>
              </div>
              <p className="text-2xl font-bold text-primary">{metrics.jobs.active}</p>
            </CardContent>
          </Card>

          {/* Jobs Completed */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-2">
                <CheckCircle className="w-4 h-4" />
                <span className="text-xs font-medium uppercase tracking-wide">Completed</span>
              </div>
              <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{metrics.jobs.completed}</p>
            </CardContent>
          </Card>

          {/* Jobs Failed */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-2">
                <AlertCircle className="w-4 h-4" />
                <span className="text-xs font-medium uppercase tracking-wide">Failed</span>
              </div>
              <p className={`text-2xl font-bold ${metrics.jobs.failed > 0 ? 'text-destructive' : 'text-foreground'}`}>
                {metrics.jobs.failed}
              </p>
              <p className={`text-xs ${getFailureRateColor(getFailureRate())}`}>
                {getFailureRate().toFixed(1)}% failure rate
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Second row of metrics */}
      {metrics && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Schemas */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-2">
                <FileJson className="w-4 h-4" />
                <span className="text-xs font-medium uppercase tracking-wide">Total Schemas</span>
              </div>
              <p className="text-2xl font-bold text-foreground">{metrics.schemas.total}</p>
              <p className="text-xs text-muted-foreground">
                +{metrics.schemas.recent} in {timeframe}
              </p>
            </CardContent>
          </Card>

          {/* Uploads vs Crawls */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-2">
                <Layers className="w-4 h-4" />
                <span className="text-xs font-medium uppercase tracking-wide">By Type</span>
              </div>
              <div className="space-y-1">
                {metrics.schemas.byType.map((item) => (
                  <div key={item.type} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{item.type}</span>
                    <span className="font-medium text-foreground">{item._count}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Total Users */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-2">
                <Users className="w-4 h-4" />
                <span className="text-xs font-medium uppercase tracking-wide">Total Users</span>
              </div>
              <p className="text-2xl font-bold text-foreground">{metrics.users.total}</p>
              <p className="text-xs text-muted-foreground">
                {metrics.users.activeSessions} active sessions
              </p>
            </CardContent>
          </Card>

          {/* Avg Job Duration */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-2">
                <Clock className="w-4 h-4" />
                <span className="text-xs font-medium uppercase tracking-wide">Avg Duration</span>
              </div>
              <p className="text-2xl font-bold text-foreground">
                {formatDuration(metrics.jobs.avgDuration)}
              </p>
              <p className="text-xs text-muted-foreground">per job</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Overall System Status */}
      {health && (
        <div className={`rounded-lg border p-6 ${getStatusColor(health.status)}`}>
          <div className="flex items-center gap-3">
            {getStatusIcon(health.status)}
            <div>
              <h3 className="text-lg font-semibold capitalize">
                System Status: {health.status}
              </h3>
              <p className="text-sm opacity-80">
                Last checked: {new Date(health.timestamp).toLocaleTimeString()}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Health Checks Grid */}
      {health && (
        <div className="grid md:grid-cols-2 gap-4">
          {/* Backend */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Server className="w-5 h-5 text-muted-foreground" />
                  <h3 className="text-lg font-semibold text-foreground">
                    Backend API
                  </h3>
                </div>
                {getStatusIcon(health.checks.backend.status)}
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Status</span>
                  <span className={`font-medium capitalize ${getStatusColor(health.checks.backend.status)}`}>
                    {health.checks.backend.status}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Uptime</span>
                  <span className="font-medium text-foreground">
                    {formatUptime(health.checks.backend.uptime || 0)}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {health.checks.backend.message}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Database */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Database className="w-5 h-5 text-muted-foreground" />
                  <h3 className="text-lg font-semibold text-foreground">
                    PostgreSQL
                  </h3>
                </div>
                {getStatusIcon(health.checks.database.status)}
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Status</span>
                  <span className={`font-medium capitalize ${getStatusColor(health.checks.database.status)}`}>
                    {health.checks.database.status}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {health.checks.database.message}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Redis */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Layers className="w-5 h-5 text-muted-foreground" />
                  <h3 className="text-lg font-semibold text-foreground">
                    Redis Queue
                  </h3>
                </div>
                {getStatusIcon(health.checks.redis.status)}
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Status</span>
                  <span className={`font-medium capitalize ${getStatusColor(health.checks.redis.status)}`}>
                    {health.checks.redis.status}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {health.checks.redis.message}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Worker */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-muted-foreground" />
                  <h3 className="text-lg font-semibold text-foreground">
                    Background Worker
                  </h3>
                </div>
                {getStatusIcon(health.checks.worker.status)}
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Status</span>
                  <span className={`font-medium capitalize ${getStatusColor(health.checks.worker.status)}`}>
                    {health.checks.worker.status}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Active Workers</span>
                  <span className="font-medium text-foreground">
                    {health.checks.worker.activeWorkers || 0}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {health.checks.worker.message}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};
