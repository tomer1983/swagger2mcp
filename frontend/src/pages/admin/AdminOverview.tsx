import React, { useState, useEffect } from 'react';
import { TrendingUp, Zap, AlertCircle, Clock, RefreshCw } from 'lucide-react';
import { StatCard } from '../../components/admin/StatCard';
import { getMetrics } from '../../lib/admin-api';
import type { MetricsResponse } from '../../lib/admin-api';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Alert, AlertDescription } from '../../components/ui/alert';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '../../components/ui/select';

export const AdminOverview: React.FC = () => {
  const [metrics, setMetrics] = useState<MetricsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeframe, setTimeframe] = useState<'24h' | '7d' | '30d'>('24h');

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getMetrics(timeframe);
      setMetrics(data);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to load metrics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, [timeframe]);

  const formatDuration = (ms: number): string => {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}m`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold mb-1">
            Overview
          </h2>
          <p className="text-muted-foreground">
            System metrics and activity summary.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select
            value={timeframe}
            onValueChange={(v) => setTimeframe(v as '24h' | '7d' | '30d')}
          >
            <SelectTrigger className="w-[150px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="24h">Last 24 hours</SelectItem>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="icon"
            onClick={fetchMetrics}
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Stat Cards */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="MCPs Generated"
          value={metrics?.schemas.total ?? 0}
          subtitle={`${metrics?.schemas.recent ?? 0} in ${timeframe}`}
          icon={TrendingUp}
          iconColor="text-emerald-500"
        />
        <StatCard
          title="Jobs Running"
          value={metrics?.jobs.active ?? 0}
          subtitle={`${metrics?.jobs.waiting ?? 0} queued`}
          icon={Zap}
          iconColor="text-sky-500"
        />
        <StatCard
          title={`Failures (${timeframe})`}
          value={metrics?.jobs.failed ?? 0}
          subtitle={`${metrics?.jobs.completed ?? 0} completed`}
          icon={AlertCircle}
          iconColor="text-destructive"
        />
        <StatCard
          title="Avg Gen Time"
          value={metrics ? formatDuration(metrics.jobs.avgDuration) : '0s'}
          subtitle="Average duration"
          icon={Clock}
          iconColor="text-amber-500"
        />
      </div>

      {/* Additional Stats */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Schemas by Type
            </CardTitle>
          </CardHeader>
          <CardContent>
            {metrics?.schemas.byType && metrics.schemas.byType.length > 0 ? (
              <div className="space-y-2">
                {metrics.schemas.byType.map((type) => (
                  <div key={type.type} className="flex items-center justify-between">
                    <span className="text-sm capitalize">
                      {type.type}
                    </span>
                    <span className="text-sm font-semibold">
                      {type._count}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No data</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm">Total</span>
                <span className="text-sm font-semibold">
                  {metrics?.users.total ?? 0}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Active</span>
                <span className="text-sm font-semibold">
                  {metrics?.users.activeSessions ?? 0}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">New</span>
                <span className="text-sm font-semibold">
                  {metrics?.users.recent ?? 0}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              System Uptime
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {metrics ? formatDuration(metrics.uptime * 1000) : '0s'}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Since last restart
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
