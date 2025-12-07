import React, { useState, useEffect, useCallback } from 'react';
import { FileText, Download, RefreshCw, Search, ChevronDown, ChevronRight, CheckCircle, XCircle, Filter, Clock } from 'lucide-react';
import { getAuditLogs, getAuditActions, exportAuditLogs } from '../../lib/admin-api';
import { getConfig } from '../../lib/api';
import type { AuditLogEntry, AuditQueryParams, PaginatedAuditResult } from '../../lib/admin-api';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Card, CardContent } from '../../components/ui/card';
import { Alert, AlertDescription } from '../../components/ui/alert';
import { Badge } from '../../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';

export const AdminAudit: React.FC = () => {
  const [logs, setLogs] = useState<PaginatedAuditResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionTypes, setActionTypes] = useState<string[]>([]);
  const [retentionDays, setRetentionDays] = useState<number>(30);
  
  // Filters
  const [filters, setFilters] = useState<AuditQueryParams>({
    page: 1,
    pageSize: 25,
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getAuditLogs(filters);
      setLogs(data);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to load audit logs');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  // Initial load
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const [actions, config] = await Promise.all([
          getAuditActions(),
          getConfig(),
        ]);
        setActionTypes(actions);
        
        // Get retention days from config
        const systemConfig = config.system || [];
        const retentionConfig = systemConfig.find((c: any) => c.key === 'audit.retentionDays');
        if (retentionConfig) {
          const days = typeof retentionConfig.value === 'number' 
            ? retentionConfig.value 
            : parseInt(retentionConfig.value, 10);
          if (!isNaN(days)) setRetentionDays(days);
        }
      } catch {
        // Use defaults
      }
    };
    loadInitialData();
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const handleExport = async () => {
    try {
      setExporting(true);
      const { page, pageSize, ...exportParams } = filters;
      const blob = await exportAuditLogs(exportParams);
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `audit-logs-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err: any) {
      setError(err.message || 'Failed to export logs');
    } finally {
      setExporting(false);
    }
  };

  const toggleRowExpanded = (id: string) => {
    setExpandedRows(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleFilterChange = (key: keyof AuditQueryParams, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value || undefined,
      page: key === 'page' ? value : 1, // Reset to page 1 on filter change
    }));
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    handleFilterChange('action', searchTerm);
  };

  const clearFilters = () => {
    setFilters({ page: 1, pageSize: 25 });
    setSearchTerm('');
  };

  const formatTimestamp = (timestamp: string): string => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  const formatRelativeTime = (timestamp: string): string => {
    const now = new Date();
    const then = new Date(timestamp);
    const diffMs = now.getTime() - then.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  const getActorDisplay = (entry: AuditLogEntry): string => {
    if (!entry.actor) return 'System';
    return entry.actor.displayName || entry.actor.email;
  };

  const hasActiveFilters = filters.action || filters.result || filters.startDate || filters.endDate;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground mb-1">
            Audit Logs
          </h2>
          <p className="text-muted-foreground">
            View system audit trail and activity logs.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            disabled={exporting || !logs?.data.length}
          >
            <Download className={`w-4 h-4 mr-2 ${exporting ? 'animate-pulse' : ''}`} />
            Export JSON
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchLogs}
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Retention Notice */}
      <Alert className="bg-primary/5 border-primary/20">
        <Clock className="w-4 h-4" />
        <AlertDescription>
          Audit logs are automatically cleaned up after <strong>{retentionDays} days</strong>. 
          Configure this in System settings.
        </AlertDescription>
      </Alert>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <span className="font-medium text-foreground">Filters</span>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="text-xs text-primary hover:underline ml-2"
              >
                Clear all
              </button>
            )}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Action search */}
            <form onSubmit={handleSearch} className="relative">
              <Input
                type="text"
                placeholder="Search action..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
              <Search className="w-4 h-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            </form>

            {/* Action type dropdown */}
            <Select 
              value={filters.action || 'all'} 
              onValueChange={(v) => {
                handleFilterChange('action', v === 'all' ? '' : v);
                setSearchTerm(v === 'all' ? '' : v);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="All Actions" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Actions</SelectItem>
                {actionTypes.map((action) => (
                  <SelectItem key={action} value={action}>{action}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Result filter */}
            <Select 
              value={filters.result || 'all'} 
              onValueChange={(v) => handleFilterChange('result', v === 'all' ? undefined : v as 'success' | 'failure')}
            >
              <SelectTrigger>
                <SelectValue placeholder="All Results" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Results</SelectItem>
                <SelectItem value="success">Success</SelectItem>
                <SelectItem value="failure">Failure</SelectItem>
              </SelectContent>
            </Select>

            {/* Start date */}
            <div className="relative">
              <Input
                type="date"
                value={filters.startDate?.split('T')[0] || ''}
                onChange={(e) => handleFilterChange('startDate', e.target.value ? new Date(e.target.value).toISOString() : undefined)}
                placeholder="Start date"
              />
            </div>

            {/* End date */}
            <div className="relative">
              <Input
                type="date"
                value={filters.endDate?.split('T')[0] || ''}
                onChange={(e) => handleFilterChange('endDate', e.target.value ? new Date(e.target.value).toISOString() : undefined)}
                placeholder="End date"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Audit Log Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50 border-b border-border">
              <tr>
                <th className="w-8 px-4 py-3"></th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Timestamp
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Actor
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Action
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Target
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Result
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading && !logs ? (
                // Loading skeleton
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-4 py-4"><div className="w-4 h-4 bg-muted rounded" /></td>
                    <td className="px-4 py-4"><div className="w-32 h-4 bg-muted rounded" /></td>
                    <td className="px-4 py-4"><div className="w-24 h-4 bg-muted rounded" /></td>
                    <td className="px-4 py-4"><div className="w-28 h-4 bg-muted rounded" /></td>
                    <td className="px-4 py-4"><div className="w-20 h-4 bg-muted rounded" /></td>
                    <td className="px-4 py-4"><div className="w-16 h-4 bg-muted rounded" /></td>
                  </tr>
                ))
              ) : logs?.data.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center">
                    <FileText className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
                    <p className="text-muted-foreground">No audit logs found</p>
                    {hasActiveFilters && (
                      <button
                        onClick={clearFilters}
                        className="text-primary hover:underline text-sm mt-2"
                      >
                        Clear filters
                      </button>
                    )}
                  </td>
                </tr>
              ) : (
                logs?.data.map((entry) => (
                  <React.Fragment key={entry.id}>
                    <tr 
                      className={`hover:bg-muted/50 transition-colors ${
                        entry.metadata ? 'cursor-pointer' : ''
                      }`}
                      onClick={() => entry.metadata && toggleRowExpanded(entry.id)}
                    >
                      <td className="px-4 py-4 text-muted-foreground">
                        {entry.metadata ? (
                          expandedRows.has(entry.id) ? (
                            <ChevronDown className="w-4 h-4" />
                          ) : (
                            <ChevronRight className="w-4 h-4" />
                          )
                        ) : null}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex flex-col">
                          <span className="text-sm text-foreground">
                            {formatTimestamp(entry.timestamp)}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {formatRelativeTime(entry.timestamp)}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span className="text-sm text-foreground">
                          {getActorDisplay(entry)}
                        </span>
                        {entry.actor?.email && entry.actor?.displayName && (
                          <span className="block text-xs text-muted-foreground">
                            {entry.actor.email}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        <Badge variant="secondary">
                          {entry.action}
                        </Badge>
                      </td>
                      <td className="px-4 py-4 text-sm text-muted-foreground max-w-[200px] truncate">
                        {entry.target || '-'}
                      </td>
                      <td className="px-4 py-4">
                        {entry.result === 'success' ? (
                          <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                            <CheckCircle className="w-4 h-4" />
                            <span className="text-xs font-medium">Success</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-destructive">
                            <XCircle className="w-4 h-4" />
                            <span className="text-xs font-medium">Failure</span>
                          </span>
                        )}
                      </td>
                    </tr>
                    {/* Expanded metadata row */}
                    {expandedRows.has(entry.id) && entry.metadata && (
                      <tr className="bg-muted/50">
                        <td colSpan={6} className="px-4 py-4">
                          <div className="ml-8">
                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                              Details
                            </p>
                            <pre className="text-xs bg-muted p-3 rounded-md overflow-x-auto text-foreground">
                              {JSON.stringify(entry.metadata, null, 2)}
                            </pre>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {logs && logs.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border">
            <div className="text-sm text-muted-foreground">
              Showing {((logs.page - 1) * logs.pageSize) + 1} to {Math.min(logs.page * logs.pageSize, logs.total)} of {logs.total} entries
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleFilterChange('page', logs.page - 1)}
                disabled={logs.page <= 1 || loading}
              >
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {logs.page} of {logs.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleFilterChange('page', logs.page + 1)}
                disabled={logs.page >= logs.totalPages || loading}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};
