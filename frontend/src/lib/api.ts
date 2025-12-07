import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export const api = axios.create({
    baseURL: API_URL,
    timeout: 30000, // 30 seconds timeout
    withCredentials: true, // Enable HTTP-only cookie session (Issue #7)
});

// JWT Token Management
const TOKEN_KEY = 'auth_token';

export const getAuthToken = (): string | null => {
    return localStorage.getItem(TOKEN_KEY);
};

export const setAuthToken = (token: string) => {
    localStorage.setItem(TOKEN_KEY, token);
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
};

export const clearAuthToken = () => {
    localStorage.removeItem(TOKEN_KEY);
    delete api.defaults.headers.common['Authorization'];
};

// Initialize token from localStorage if exists
const token = getAuthToken();
if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
}

// Session ID is now managed via HTTP-only cookies on the server
// This function is kept for backward compatibility but cookies are preferred
export const getSessionId = () => {
    let sessionId = localStorage.getItem('sessionId');
    if (!sessionId) {
        sessionId = crypto.randomUUID();
        localStorage.setItem('sessionId', sessionId);
    }
    return sessionId;
};

// ===== Authentication API =====

export interface RegisterData {
    email: string;
    password: string;
    username?: string;
}

export interface LoginData {
    email: string;
    password: string;
    sessionId?: string; // For migrating anonymous sessions
}

export interface User {
    id: string;
    email: string;
    username?: string;
    displayName?: string;
    provider: string;
    role?: 'admin' | 'user'; // RBAC role
    createdAt: string;
    lastLoginAt?: string;
}

export const register = async (data: RegisterData) => {
    const res = await api.post('/auth/register', data);
    if (res.data.token) {
        setAuthToken(res.data.token);
    }
    return res.data;
};

export const login = async (data: LoginData) => {
    const res = await api.post('/auth/login', {
        ...data,
        sessionId: data.sessionId || getSessionId() // Migrate anonymous data
    });
    if (res.data.token) {
        setAuthToken(res.data.token);
    }
    return res.data;
};

export const logout = async () => {
    await api.post('/auth/logout');
    clearAuthToken();
};

export const getCurrentUser = async (): Promise<{ user: User } | null> => {
    try {
        const res = await api.get('/auth/me');
        return res.data;
    } catch (error) {
        clearAuthToken();
        return null;
    }
};

export const verifyToken = async (): Promise<{ valid: boolean; user?: User }> => {
    try {
        const res = await api.post('/auth/verify-token');
        return res.data;
    } catch (error) {
        return { valid: false };
    }
};

export const getMicrosoftAuthUrl = (): string => {
    return `${API_URL}/auth/microsoft`;
};

// ===== Schema API =====

export const uploadSchema = async (file: File) => {
    const formData = new FormData();
    formData.append('schema', file);
    // Session is now handled via HTTP-only cookie, but keep for backward compat
    formData.append('sessionId', getSessionId());
    const res = await api.post('/upload', formData);
    return res.data;
};

export const crawlUrl = async (url: string, depth: number, options?: any) => {
    const res = await api.post('/crawl', { 
        url, 
        depth, 
        sessionId: getSessionId(), // Backward compat, server prefers cookie
        options 
    });
    return res.data;
};

export const pasteSchema = async (content: string) => {
    const response = await api.post('/paste', { content });
    return response.data;
};

export const getSchemas = async () => {
    // Session ID now comes from HTTP-only cookie
    const res = await api.get('/schemas');
    return res.data;
};

export const deleteSchema = async (id: string) => {
    const res = await api.delete(`/schemas/${id}`);
    return res.data;
};

export interface GenerationOptions {
    language: 'typescript' | 'python';
    serverName?: string;
    asyncMode?: boolean;
    strictTypes?: boolean;
    includeComments?: boolean;
    generateTests?: boolean;
    includeDockerfile?: boolean;
    includeCIConfig?: 'none' | 'github' | 'gitlab' | 'both';
    routePrefix?: string;
    authType?: 'none' | 'bearer' | 'api-key' | 'basic';
    includeTestUI?: boolean;
}

export const generateServer = async (schemaId: string, language: string, options?: GenerationOptions) => {
    const res = await api.post('/generate', { 
        schemaId, 
        language, 
        options: options || {} 
    }, { responseType: 'blob' });
    return res.data;
};

export const exportToGitHub = async (schemaId: string, language: string, githubToken: string, owner: string, repoName: string) => {
    const res = await api.post('/export', { schemaId, language, githubToken, owner, repoName });
    return res.data;
};

export interface GitLabExportParams {
    schemaId: string;
    language: string;
    gitlabToken: string;
    projectPath: string;
    host?: string;
    branch?: string;
    commitMessage?: string;
}

export const exportToGitLab = async (params: GitLabExportParams) => {
    const res = await api.post('/export/gitlab', params);
    return res.data;
};

// Job Control API

export interface JobStatus {
    id: string;
    type: 'UPLOAD' | 'CRAWL';
    state: 'waiting' | 'active' | 'completed' | 'failed' | 'delayed';
    progress: number | object;
    failedReason?: string;
    createdAt: number;
    processedAt?: number;
    finishedAt?: number;
}

export const getJobStatus = async (jobId: string): Promise<JobStatus> => {
    const res = await api.get(`/jobs/${jobId}`);
    return res.data;
};

export const cancelJob = async (jobId: string) => {
    const res = await api.delete(`/jobs/${jobId}`);
    return res.data;
};

export const retryJob = async (jobId: string) => {
    const res = await api.post(`/jobs/${jobId}/retry`);
    return res.data;
};

export const listJobs = async (status?: 'active' | 'waiting' | 'completed' | 'failed'): Promise<JobStatus[]> => {
    const sessionId = getSessionId();
    const params = new URLSearchParams({ sessionId });
    if (status) params.append('status', status);
    const res = await api.get(`/jobs?${params.toString()}`);
    return res.data;
};

// ===== Schema Versioning =====

export const updateSchema = async (schemaId: string, content: string, changelog?: string) => {
    const res = await api.put(`/schemas/${schemaId}`, { content, changelog });
    return res.data;
};

export const getSchemaVersions = async (schemaId: string) => {
    const res = await api.get(`/schemas/${schemaId}/versions`);
    return res.data;
};

export const revertSchema = async (schemaId: string, version: number) => {
    const res = await api.post(`/schemas/${schemaId}/revert/${version}`);
    return res.data;
};

// ===== Webhooks =====

export interface Webhook {
    id: string;
    sessionId: string;
    url: string;
    events: string[];
    secret?: string;
    active: boolean;
    createdAt: string;
}

export const listWebhooks = async (): Promise<Webhook[]> => {
    const sessionId = getSessionId();
    const res = await api.get(`/webhooks?sessionId=${sessionId}`);
    return res.data;
};

export const createWebhook = async (url: string, events?: string[], secret?: string): Promise<Webhook> => {
    const sessionId = getSessionId();
    const res = await api.post('/webhooks', { sessionId, url, events, secret });
    return res.data;
};

export const deleteWebhook = async (webhookId: string) => {
    const res = await api.delete(`/webhooks/${webhookId}`);
    return res.data;
};

// ===== Batch Operations =====

export const generateBatch = async (
    schemaIds: string[], 
    language: 'typescript' | 'python' = 'typescript', 
    options: Partial<GenerationOptions> = {}
): Promise<Blob> => {
    const fullOptions: GenerationOptions = {
        language,
        ...options,
    };
    const res = await api.post('/generate/batch', { schemaIds, language, options: fullOptions }, {
        responseType: 'blob',
    });
    return res.data;
};

// ===== Health & Metrics =====

export interface HealthStatus {
    status: 'healthy' | 'unhealthy' | 'degraded';
    timestamp: string;
    uptime: number;
    version: string;
    checks: Record<string, {
        status: 'healthy' | 'unhealthy' | 'degraded';
        latency?: number;
        error?: string;
    }>;
}

export const getHealth = async (): Promise<HealthStatus> => {
    const res = await api.get('/health');
    return res.data;
};

export const getMetrics = async (): Promise<string> => {
    const res = await api.get('/metrics');
    return res.data;
};

// ===== Admin API =====

// Admin Health & Metrics
export interface AdminHealthStatus {
    timestamp: string;
    status: 'healthy' | 'degraded' | 'unhealthy';
    checks: {
        database: { status: string; message: string };
        redis: { status: string; message: string };
        worker: { status: string; message: string; activeWorkers: number };
        backend: { status: string; message: string; uptime: number };
    };
}

export interface AdminMetrics {
    timestamp: string;
    timeframe: string;
    uptime: number;
    schemas: {
        total: number;
        recent: number;
        byType: { type: string; _count: number }[];
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

export const getAdminHealth = async (): Promise<AdminHealthStatus> => {
    const res = await api.get('/admin/health');
    return res.data;
};

export const getAdminMetrics = async (timeframe: '24h' | '7d' | '30d' = '24h'): Promise<AdminMetrics> => {
    const res = await api.get(`/admin/metrics?timeframe=${timeframe}`);
    return res.data;
};

// Configuration
export interface ConfigData {
    [category: string]: { key: string; value: any }[];
}

export const getConfig = async (): Promise<ConfigData> => {
    const res = await api.get('/admin/config');
    return res.data;
};

export const updateConfig = async (updates: Record<string, any>): Promise<void> => {
    await api.patch('/admin/config', updates);
};

// User Management
export interface AdminUser {
    id: string;
    email: string;
    username: string | null;
    displayName: string | null;
    role: 'admin' | 'user';
    provider: string;
    isActive: boolean;
    createdAt: string;
    lastLoginAt: string | null;
    sessionCount?: number;
    schemaCount?: number;
}

export interface PaginatedUsers {
    data: AdminUser[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
}

export interface UserCreateData {
    email: string;
    password: string;
    username?: string;
    displayName?: string;
    role?: 'user' | 'admin';
}

export interface UserUpdateData {
    username?: string;
    displayName?: string;
    role?: 'user' | 'admin';
    isActive?: boolean;
}

export const getUsers = async (params: {
    page?: number;
    pageSize?: number;
    search?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
} = {}): Promise<PaginatedUsers> => {
    const searchParams = new URLSearchParams();
    if (params.page) searchParams.set('page', params.page.toString());
    if (params.pageSize) searchParams.set('pageSize', params.pageSize.toString());
    if (params.search) searchParams.set('search', params.search);
    if (params.sortBy) searchParams.set('sortBy', params.sortBy);
    if (params.sortOrder) searchParams.set('sortOrder', params.sortOrder);
    const res = await api.get(`/admin/users?${searchParams.toString()}`);
    return res.data;
};

export const getUser = async (id: string): Promise<AdminUser> => {
    const res = await api.get(`/admin/users/${id}`);
    return res.data;
};

export const createUser = async (data: UserCreateData): Promise<AdminUser> => {
    const res = await api.post('/admin/users', data);
    return res.data;
};

export const updateUser = async (id: string, data: UserUpdateData): Promise<AdminUser> => {
    const res = await api.patch(`/admin/users/${id}`, data);
    return res.data;
};

export const deleteUser = async (id: string): Promise<void> => {
    await api.delete(`/admin/users/${id}`);
};

export const resetUserPassword = async (id: string, newPassword: string): Promise<void> => {
    await api.post(`/admin/users/${id}/reset-password`, { newPassword });
};

// Audit Logs
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

export interface PaginatedAuditLogs {
    data: AuditLogEntry[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
}

export const getAuditLogs = async (params: {
    page?: number;
    pageSize?: number;
    action?: string;
    actorId?: string;
    result?: 'success' | 'failure';
    startDate?: string;
    endDate?: string;
} = {}): Promise<PaginatedAuditLogs> => {
    const searchParams = new URLSearchParams();
    if (params.page) searchParams.set('page', params.page.toString());
    if (params.pageSize) searchParams.set('pageSize', params.pageSize.toString());
    if (params.action) searchParams.set('action', params.action);
    if (params.actorId) searchParams.set('actorId', params.actorId);
    if (params.result) searchParams.set('result', params.result);
    if (params.startDate) searchParams.set('startDate', params.startDate);
    if (params.endDate) searchParams.set('endDate', params.endDate);
    const res = await api.get(`/admin/audit?${searchParams.toString()}`);
    return res.data;
};

export const exportAuditLogs = async (params: {
    action?: string;
    actorId?: string;
    result?: 'success' | 'failure';
    startDate?: string;
    endDate?: string;
} = {}): Promise<Blob> => {
    const searchParams = new URLSearchParams();
    if (params.action) searchParams.set('action', params.action);
    if (params.actorId) searchParams.set('actorId', params.actorId);
    if (params.result) searchParams.set('result', params.result);
    if (params.startDate) searchParams.set('startDate', params.startDate);
    if (params.endDate) searchParams.set('endDate', params.endDate);
    const res = await api.get(`/admin/audit/export?${searchParams.toString()}`, {
        responseType: 'blob',
    });
    return res.data;
};

export const getAuditActionTypes = async (): Promise<string[]> => {
    const res = await api.get('/admin/audit/actions');
    return res.data;
};
