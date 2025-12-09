import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { jobQueue, connection } from '../lib/queue';
import { JobData } from '../types/jobs';
import { prisma } from '../lib/db';
import { GeneratorService } from '../services/generator.service';
import { GitHubService } from '../services/github.service';
import { GitLabService } from '../services/gitlab.service';
import { optionalAuth, getUserId, checkAnonymousAllowed, AuthenticatedRequest } from '../middleware/auth';

// Metrics tracking
const metrics = {
    jobsProcessed: 0,
    jobsFailed: 0,
    jobsQueued: 0,
    generationsCompleted: 0,
    uploadsReceived: 0,
    crawlsStarted: 0,
    startTime: Date.now(),
};

const router = Router();
const generatorService = new GeneratorService();
const githubService = new GitHubService();
const gitlabService = new GitLabService();

// Session cookie middleware (Issue #7 - HTTP-only cookie instead of localStorage)
const SESSION_COOKIE_NAME = 'swagger2mcp_session';
const SESSION_MAX_AGE = 7 * 24 * 60 * 60 * 1000; // 7 days

const ensureSession = async (req: Request, res: Response, next: NextFunction) => {
    let sessionId = req.cookies?.[SESSION_COOKIE_NAME];

    // Also accept sessionId from body/query for backward compatibility
    if (!sessionId) {
        sessionId = req.body?.sessionId || req.query?.sessionId;
    }

    if (!sessionId) {
        sessionId = uuidv4();
    }

    // Set HTTP-only cookie
    res.cookie(SESSION_COOKIE_NAME, sessionId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: SESSION_MAX_AGE
    });

    // Ensure session exists in database
    const authReq = req as AuthenticatedRequest;
    const userId = authReq.authUser?.id;

    await prisma.session.upsert({
        where: { id: sessionId },
        update: userId ? { userId } : {},
        create: { id: sessionId, userId: userId || null },
    });

    // Attach to request for use in handlers
    (req as any).sessionId = sessionId;
    next();
};

// Apply authentication middleware FIRST, then session
router.use(optionalAuth);
router.use(ensureSession);
router.use(checkAnonymousAllowed); // Block anonymous if not allowed

// Configure Multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, '../../uploads');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, uniqueSuffix + '-' + file.originalname);
    },
});

const upload = multer({
    storage,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
        files: 1
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = /json|yaml|yml/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        // Mime type check can be tricky, relying on extension for now as primary gate
        if (extname) {
            cb(null, true);
        } else {
            cb(new Error('Only JSON and YAML files are allowed'));
        }
    }
});

// POST /api/upload
router.post('/upload', upload.single('schema'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }

    const sessionId = (req as any).sessionId;
    const authReq = req as AuthenticatedRequest;
    const userId = authReq.authUser?.id || null;

    const jobData: JobData = {
        type: 'UPLOAD',
        sessionId,
        userId, // Include userId in job data
        payload: {
            filePath: req.file.path,
            originalName: req.file.originalname,
        },
    };

    const job = await jobQueue.add('process-schema', jobData);
    metrics.uploadsReceived++;

    res.json({ jobId: job.id, status: 'queued', message: 'File uploaded and processing started' });
});

// POST /api/crawl
router.post('/crawl', async (req, res) => {
    const { url, depth, sessionId, options } = req.body;

    if (!url) {
        return res.status(400).json({ error: 'URL is required' });
    }

    // Validate depth to prevent excessive crawling
    const depthValue = parseInt(depth) || 1;
    if (depthValue < 1 || depthValue > 5) {
        return res.status(400).json({ error: 'Depth must be between 1 and 5' });
    }

    const authReq = req as AuthenticatedRequest;
    const userId = authReq.authUser?.id || null;

    const jobData: JobData = {
        type: 'CRAWL',
        sessionId: (req as any).sessionId,
        userId, // Include userId in job data
        payload: {
            url,
            depth: depthValue,
            options: options || {},
        },
    };

    const job = await jobQueue.add('crawl-site', jobData);
    metrics.crawlsStarted++;

    res.json({ jobId: job.id, status: 'queued', message: 'Crawl job started' });
});

// POST /api/paste - Submit pasted schema content
router.post('/paste', async (req: Request, res: Response) => {
    try {
        const sessionId = (req as any).sessionId;
        const authReq = req as AuthenticatedRequest;
        const userId = getUserId(authReq);
        const { content } = req.body;

        if (!content || typeof content !== 'string' || content.trim().length === 0) {
            return res.status(400).json({ error: 'Content is required and must be a non-empty string' });
        }

        // Basic size limit (same as file upload - 10MB)
        if (content.length > 10 * 1024 * 1024) {
            return res.status(400).json({ error: 'Content exceeds maximum size of 10MB' });
        }

        const jobData: JobData = {
            type: 'PASTE',
            payload: { content: content.trim() },
            sessionId,
            userId,
        };

        const job = await jobQueue.add('job', jobData);
        metrics.jobsQueued++;

        res.json({
            message: 'Schema submitted for processing',
            jobId: job.id
        });
    } catch (error: any) {
        console.error('Paste error:', error);
        res.status(500).json({ error: error.message });
    }
});

// GET /api/schemas
router.get('/schemas', async (req, res) => {
    const sessionId = (req as any).sessionId;
    const authReq = req as AuthenticatedRequest;
    const userId = authReq.authUser?.id;

    // If authenticated, show user's schemas
    // If anonymous, show anonymous schemas (userId = null) OR example schemas
    const where: any = userId
        ? { userId } // Authenticated: only their schemas
        : { userId: null }; // Anonymous: only anonymous/example schemas

    const schemas = await prisma.schema.findMany({
        where,
        orderBy: { createdAt: 'desc' },
    });

    res.json(schemas);
});

// GET /api/jobs/:id - Get job status and progress
router.get('/jobs/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const job = await jobQueue.getJob(id);

        if (!job) {
            return res.status(404).json({ error: 'Job not found' });
        }

        const state = await job.getState();
        const progress = job.progress;
        const failedReason = job.failedReason;

        res.json({
            id: job.id,
            type: job.data.type,
            state,
            progress,
            failedReason,
            createdAt: job.timestamp,
            processedAt: job.processedOn,
            finishedAt: job.finishedOn,
        });
    } catch (e) {
        console.error('Failed to get job:', e);
        res.status(500).json({ error: 'Failed to get job status' });
    }
});

// DELETE /api/jobs/:id - Cancel a job
router.delete('/jobs/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const job = await jobQueue.getJob(id);

        if (!job) {
            return res.status(404).json({ error: 'Job not found' });
        }

        const state = await job.getState();

        // Can only cancel waiting or delayed jobs
        if (state === 'waiting' || state === 'delayed') {
            await job.remove();
            res.json({ message: 'Job cancelled', id });
        } else if (state === 'active') {
            // For active crawl jobs, trigger abort controller
            if ((job as any).abortController) {
                (job as any).abortController.abort();
            }
            await job.moveToFailed(new Error('Cancelled by user'), 'cancelled');
            res.json({ message: 'Job cancellation requested', id, note: 'Active job will stop at next checkpoint' });
        } else {
            res.status(400).json({ error: `Cannot cancel job in state: ${state}` });
        }
    } catch (e) {
        console.error('Failed to cancel job:', e);
        res.status(500).json({ error: 'Failed to cancel job' });
    }
});

// POST /api/jobs/:id/retry - Retry a failed job
router.post('/jobs/:id/retry', async (req, res) => {
    const { id } = req.params;

    try {
        const job = await jobQueue.getJob(id);

        if (!job) {
            return res.status(404).json({ error: 'Job not found' });
        }

        const state = await job.getState();

        if (state !== 'failed') {
            return res.status(400).json({ error: `Can only retry failed jobs, current state: ${state}` });
        }

        await job.retry();
        res.json({ message: 'Job retry initiated', id });
    } catch (e) {
        console.error('Failed to retry job:', e);
        res.status(500).json({ error: 'Failed to retry job' });
    }
});

// GET /api/jobs - List all jobs for a session
router.get('/jobs', async (req, res) => {
    const { sessionId, status } = req.query;

    try {
        let jobs;

        if (status === 'active') {
            jobs = await jobQueue.getActive();
        } else if (status === 'waiting') {
            jobs = await jobQueue.getWaiting();
        } else if (status === 'completed') {
            jobs = await jobQueue.getCompleted();
        } else if (status === 'failed') {
            jobs = await jobQueue.getFailed();
        } else {
            // Get all jobs (recent 100)
            const [active, waiting, completed, failed] = await Promise.all([
                jobQueue.getActive(),
                jobQueue.getWaiting(),
                jobQueue.getCompleted(0, 50),
                jobQueue.getFailed(0, 50),
            ]);
            jobs = [...active, ...waiting, ...completed, ...failed];
        }

        // Filter by sessionId if provided
        if (sessionId) {
            jobs = jobs.filter(job => job.data.sessionId === sessionId);
        }

        const jobList = await Promise.all(jobs.map(async (job) => ({
            id: job.id,
            type: job.data.type,
            state: await job.getState(),
            progress: job.progress,
            createdAt: job.timestamp,
            finishedAt: job.finishedOn,
        })));

        res.json(jobList);
    } catch (e) {
        console.error('Failed to list jobs:', e);
        res.status(500).json({ error: 'Failed to list jobs' });
    }
});

// ===== SCHEMA VERSIONING ENDPOINTS =====

// PUT /api/schemas/:id - Update schema and create new version
router.put('/schemas/:id', async (req, res) => {
    const { id } = req.params;
    const { content, changelog } = req.body;
    const authReq = req as AuthenticatedRequest;
    const userId = authReq.authUser?.id;

    try {
        const schema = await prisma.schema.findUnique({
            where: { id },
        });

        if (!schema) {
            return res.status(404).json({ error: 'Schema not found' });
        }

        // Access control: users can only update their own schemas
        if (userId && schema.userId !== userId) {
            return res.status(403).json({ error: 'Access denied: You can only update your own schemas' });
        }
        if (!userId && schema.userId !== null) {
            return res.status(403).json({ error: 'Access denied: This schema belongs to another user' });
        }

        // Store current version in history
        await prisma.schemaVersion.create({
            data: {
                schemaId: id,
                version: schema.version,
                content: schema.content,
                changelog: changelog || `Version ${schema.version}`,
            },
        });

        // Update schema with new content and increment version
        const updated = await prisma.schema.update({
            where: { id },
            data: {
                content,
                version: schema.version + 1,
            },
        });

        res.json(updated);
    } catch (e) {
        console.error('Failed to update schema:', e);
        res.status(500).json({ error: 'Failed to update schema' });
    }
});

// DELETE /api/schemas/:id - Delete a schema
router.delete('/schemas/:id', async (req, res) => {
    const { id } = req.params;
    const authReq = req as AuthenticatedRequest;
    const userId = authReq.authUser?.id;

    try {
        const schema = await prisma.schema.findUnique({ where: { id } });
        if (!schema) {
            return res.status(404).json({ error: 'Schema not found' });
        }

        // Access control: users can only delete their own schemas
        if (userId && schema.userId !== userId) {
            return res.status(403).json({ error: 'Access denied: You can only delete your own schemas' });
        }
        if (!userId && schema.userId !== null) {
            return res.status(403).json({ error: 'Access denied: This schema belongs to another user' });
        }

        await prisma.schema.delete({ where: { id } });
        res.json({ message: 'Schema deleted', id });
    } catch (e) {
        console.error('Failed to delete schema:', e);
        res.status(500).json({ error: 'Failed to delete schema' });
    }
});

// GET /api/schemas/:id/versions - Get version history
router.get('/schemas/:id/versions', async (req, res) => {
    const { id } = req.params;

    try {
        const schema = await prisma.schema.findUnique({
            where: { id },
            include: {
                versions: {
                    orderBy: { version: 'desc' },
                },
            },
        });

        if (!schema) {
            return res.status(404).json({ error: 'Schema not found' });
        }

        // Include current version
        const versions = [
            {
                version: schema.version,
                content: schema.content,
                changelog: 'Current version',
                createdAt: schema.createdAt,
                isCurrent: true,
            },
            ...schema.versions.map(v => ({
                version: v.version,
                content: v.content,
                changelog: v.changelog,
                createdAt: v.createdAt,
                isCurrent: false,
            })),
        ];

        res.json(versions);
    } catch (e) {
        console.error('Failed to get versions:', e);
        res.status(500).json({ error: 'Failed to get versions' });
    }
});

// POST /api/schemas/:id/revert/:version - Revert to specific version
router.post('/schemas/:id/revert/:version', async (req, res) => {
    const { id, version } = req.params;
    const targetVersion = parseInt(version);

    try {
        const schema = await prisma.schema.findUnique({
            where: { id },
            include: {
                versions: {
                    where: { version: targetVersion },
                },
            },
        });

        if (!schema) {
            return res.status(404).json({ error: 'Schema not found' });
        }

        if (schema.versions.length === 0) {
            return res.status(404).json({ error: 'Version not found' });
        }

        const targetContent = schema.versions[0].content;

        // Store current as new version before reverting
        await prisma.schemaVersion.create({
            data: {
                schemaId: id,
                version: schema.version,
                content: schema.content,
                changelog: `Before revert to version ${targetVersion}`,
            },
        });

        // Update to reverted content
        const updated = await prisma.schema.update({
            where: { id },
            data: {
                content: targetContent,
                version: schema.version + 1,
            },
        });

        res.json({ message: `Reverted to version ${targetVersion}`, schema: updated });
    } catch (e) {
        console.error('Failed to revert:', e);
        res.status(500).json({ error: 'Failed to revert' });
    }
});

// ===== WEBHOOK ENDPOINTS =====

// GET /api/webhooks - List webhooks for session
router.get('/webhooks', async (req, res) => {
    const { sessionId } = req.query;

    if (!sessionId) {
        return res.status(400).json({ error: 'Session ID required' });
    }

    try {
        const webhooks = await prisma.webhook.findMany({
            where: { sessionId: String(sessionId) },
            orderBy: { createdAt: 'desc' },
        });
        res.json(webhooks);
    } catch (e) {
        console.error('Failed to list webhooks:', e);
        res.status(500).json({ error: 'Failed to list webhooks' });
    }
});

// POST /api/webhooks - Create webhook
router.post('/webhooks', async (req, res) => {
    const { sessionId, url, events, secret } = req.body;

    if (!sessionId || !url) {
        return res.status(400).json({ error: 'Session ID and URL are required' });
    }

    try {
        const webhook = await prisma.webhook.create({
            data: {
                sessionId,
                url,
                events: events || ['job.completed', 'job.failed'],
                secret: secret || null,
            },
        });
        res.json(webhook);
    } catch (e) {
        console.error('Failed to create webhook:', e);
        res.status(500).json({ error: 'Failed to create webhook' });
    }
});

// DELETE /api/webhooks/:id - Delete webhook
router.delete('/webhooks/:id', async (req, res) => {
    const { id } = req.params;

    try {
        await prisma.webhook.delete({ where: { id } });
        res.json({ message: 'Webhook deleted' });
    } catch (e) {
        console.error('Failed to delete webhook:', e);
        res.status(500).json({ error: 'Failed to delete webhook' });
    }
});

// ===== GENERATION ENDPOINTS =====

// POST /api/generate
router.post('/generate', async (req, res) => {
    const { schemaId, language, options = {} } = req.body;
    const authReq = req as AuthenticatedRequest;
    const userId = authReq.authUser?.id;

    const schema = await prisma.schema.findUnique({
        where: { id: schemaId },
    });

    if (!schema) {
        return res.status(404).json({ error: 'Schema not found' });
    }

    // Access control: users can only generate from their own schemas or anonymous/example schemas
    if (userId && schema.userId !== null && schema.userId !== userId) {
        return res.status(403).json({ error: 'Access denied: You can only generate from your own schemas or example schemas' });
    }
    if (!userId && schema.userId !== null) {
        return res.status(403).json({ error: 'Access denied: This schema belongs to a registered user' });
    }

    try {
        // Check schema size before processing (Issue #29)
        const sizeBytes = Buffer.byteLength(schema.content, 'utf8');
        if (sizeBytes > 100 * 1024 * 1024) { // 100MB limit
            return res.status(413).json({
                error: 'Schema too large for processing',
                size: `${(sizeBytes / 1024 / 1024).toFixed(2)}MB`,
                limit: '100MB'
            });
        }

        const spec = JSON.parse(schema.content);
        const zipBuffer = await generatorService.generate(spec, language || 'typescript', options);
        metrics.generationsCompleted++;

        res.setHeader('Content-Type', 'application/zip');
        res.setHeader('Content-Disposition', `attachment; filename=mcp-server-${schemaId}.zip`);
        res.send(zipBuffer);
    } catch (e) {
        console.error('Generation failed:', e);
        res.status(500).json({ error: 'Generation failed' });
    }
});

// POST /api/generate/batch - Generate multiple schemas at once
router.post('/generate/batch', async (req, res) => {
    const { schemaIds, language, options = {}, sessionId } = req.body;

    if (!Array.isArray(schemaIds) || schemaIds.length === 0) {
        return res.status(400).json({ error: 'schemaIds array is required' });
    }

    if (schemaIds.length > 10) {
        return res.status(400).json({ error: 'Maximum 10 schemas per batch' });
    }

    // Issue #11: Offload to job queue for timeout protection
    try {
        const job = await jobQueue.add('BATCH_GENERATE', {
            type: 'BATCH_GENERATE',
            payload: { schemaIds, language, options },
            sessionId: sessionId || 'anonymous',
        });

        metrics.jobsQueued++;

        res.json({
            message: 'Batch generation started',
            jobId: job.id,
            note: 'Poll /api/jobs/:id for status. Result will be available at /api/downloads/:filename'
        });
    } catch (e) {
        console.error('Failed to queue batch generation:', e);
        res.status(500).json({ error: 'Failed to start batch generation' });
    }
});

// GET /api/downloads/:filename - Download generated files
router.get('/downloads/:filename', (req, res) => {
    const { filename } = req.params;
    // Basic sanitization to prevent directory traversal
    const safeFilename = path.basename(filename);
    const filePath = path.join(__dirname, '../downloads', safeFilename);

    if (fs.existsSync(filePath)) {
        res.download(filePath);
    } else {
        res.status(404).json({ error: 'File not found' });
    }
});

// POST /api/export
router.post('/export', async (req, res) => {
    const { schemaId, language, githubToken, repoName, owner } = req.body;

    if (!githubToken || !repoName || !owner) {
        return res.status(400).json({ error: 'GitHub token, owner, and repo name are required' });
    }

    const schema = await prisma.schema.findUnique({
        where: { id: schemaId },
    });

    if (!schema) {
        return res.status(404).json({ error: 'Schema not found' });
    }

    try {
        const spec = JSON.parse(schema.content);
        const repoUrl = await githubService.exportToGitHub(githubToken, owner, repoName, spec, language || 'typescript');
        res.json({ url: repoUrl });
    } catch (e: any) {
        console.error('Export failed:', e);
        res.status(500).json({ error: 'GitHub export failed. Please check your token and repository settings.' });
    }
});

// POST /api/export/gitlab
router.post('/export/gitlab', async (req, res) => {
    const { schemaId, language, gitlabToken, projectPath, host, branch, commitMessage } = req.body;

    if (!gitlabToken || !projectPath) {
        return res.status(400).json({ error: 'GitLab token and project path are required' });
    }

    const schema = await prisma.schema.findUnique({
        where: { id: schemaId },
    });

    if (!schema) {
        return res.status(404).json({ error: 'Schema not found' });
    }

    try {
        const spec = JSON.parse(schema.content);
        const repoUrl = await gitlabService.exportToGitLab(
            {
                token: gitlabToken,
                projectPath,
                host: host || 'https://gitlab.com',
                branch: branch || 'main',
                commitMessage: commitMessage || 'Initial commit from Swagger2MCP',
            },
            spec,
            language || 'typescript'
        );
        res.json({ url: repoUrl });
    } catch (e: any) {
        console.error('GitLab export failed:', e);
        res.status(500).json({ error: 'GitLab export failed. Please check your token and project settings.' });
    }
});

// ===== CONNECTION VALIDATION ENDPOINTS =====

// POST /api/validate/github - Validate GitHub connection
router.post('/validate/github', async (req, res) => {
    const { token, owner, repo } = req.body;

    if (!token) {
        return res.status(400).json({ error: 'GitHub token is required' });
    }

    try {
        // Use Octokit to validate the token
        const { Octokit } = await import('@octokit/rest');
        const octokit = new Octokit({ auth: token });

        // First, validate the token by getting the authenticated user
        const { data: user } = await octokit.users.getAuthenticated();

        let result: { valid: boolean; message: string; details?: any } = {
            valid: true,
            message: `Authenticated as ${user.login}`,
            details: { username: user.login }
        };

        // If owner and repo are provided, check if the repo exists and permissions
        if (owner && repo) {
            try {
                const { data: repoData } = await octokit.repos.get({ owner, repo });
                result.details = {
                    ...result.details,
                    repoExists: true,
                    permissions: Object.keys(repoData.permissions || {}).filter(k => (repoData.permissions as any)[k])
                };
                result.message = `Authenticated as ${user.login}. Repository ${owner}/${repo} exists with push access.`;
            } catch (repoError: any) {
                if (repoError.status === 404) {
                    // Repo doesn't exist, but that's OK - we can create it
                    result.details = { ...result.details, repoExists: false };
                    result.message = `Authenticated as ${user.login}. Repository ${owner}/${repo} will be created.`;
                } else {
                    throw repoError;
                }
            }
        }

        res.json(result);
    } catch (e: any) {
        console.error('GitHub validation failed:', e);
        const message = e.status === 401
            ? 'Invalid GitHub token. Please check your Personal Access Token.'
            : e.message || 'GitHub connection failed';
        res.status(400).json({ valid: false, message });
    }
});

// POST /api/validate/gitlab - Validate GitLab connection
router.post('/validate/gitlab', async (req, res) => {
    const { token, host, projectPath } = req.body;

    if (!token) {
        return res.status(400).json({ error: 'GitLab token is required' });
    }

    const gitlabHost = host || 'https://gitlab.com';

    try {
        // Validate the token by getting the current user
        const userResponse = await fetch(`${gitlabHost}/api/v4/user`, {
            headers: { 'PRIVATE-TOKEN': token }
        });

        if (!userResponse.ok) {
            throw new Error(userResponse.status === 401
                ? 'Invalid GitLab token. Please check your Personal Access Token.'
                : `GitLab API error: ${userResponse.statusText}`
            );
        }

        const user = await userResponse.json() as { username: string };

        let result: { valid: boolean; message: string; details?: any } = {
            valid: true,
            message: `Authenticated as ${user.username}`,
            details: { username: user.username }
        };

        // If projectPath is provided, check if the project exists
        if (projectPath) {
            const encodedPath = encodeURIComponent(projectPath);
            const projectResponse = await fetch(`${gitlabHost}/api/v4/projects/${encodedPath}`, {
                headers: { 'PRIVATE-TOKEN': token }
            });

            if (projectResponse.ok) {
                const project = await projectResponse.json() as { permissions?: any };
                result.details = { ...result.details, repoExists: true };
                result.message = `Authenticated as ${user.username}. Project ${projectPath} exists.`;
            } else if (projectResponse.status === 404) {
                result.details = { ...result.details, repoExists: false };
                result.message = `Authenticated as ${user.username}. Project ${projectPath} will be created.`;
            } else {
                throw new Error(`Failed to check project: ${projectResponse.statusText}`);
            }
        }

        res.json(result);
    } catch (e: any) {
        console.error('GitLab validation failed:', e);
        res.status(400).json({ valid: false, message: e.message || 'GitLab connection failed' });
    }
});

// ===== SAVED REPOSITORIES ENDPOINTS =====

// GET /api/repositories - List saved repositories for user
router.get('/repositories', async (req, res) => {
    const authReq = req as AuthenticatedRequest;
    const userId = authReq.authUser?.id;

    if (!userId) {
        return res.status(401).json({ error: 'Authentication required to access saved repositories' });
    }

    const { type } = req.query; // Optional filter by type

    try {
        const where: any = { userId };
        if (type && (type === 'github' || type === 'gitlab')) {
            where.type = type;
        }

        const repositories = await prisma.savedRepository.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                type: true,
                name: true,
                description: true,
                owner: true,
                repo: true,
                projectPath: true,
                host: true,
                branch: true,
                createdAt: true,
                // Note: token is NOT returned for security
            }
        });

        res.json(repositories);
    } catch (e) {
        console.error('Failed to list repositories:', e);
        res.status(500).json({ error: 'Failed to list repositories' });
    }
});

// POST /api/repositories - Create saved repository
router.post('/repositories', async (req, res) => {
    const authReq = req as AuthenticatedRequest;
    const userId = authReq.authUser?.id;

    if (!userId) {
        return res.status(401).json({ error: 'Authentication required to save repositories' });
    }

    const { type, name, description, owner, repo, projectPath, host, branch, token } = req.body;

    if (!type || !name || !token) {
        return res.status(400).json({ error: 'Type, name, and token are required' });
    }

    if (type !== 'github' && type !== 'gitlab') {
        return res.status(400).json({ error: 'Type must be "github" or "gitlab"' });
    }

    try {
        const existingName = await prisma.savedRepository.findFirst({
            where: { userId, name }
        });

        if (existingName) {
            return res.status(409).json({ error: 'A saved configuration with this name already exists' });
        }

        const repository = await prisma.savedRepository.create({
            data: {
                userId,
                type,
                name,
                description,
                owner: type === 'github' ? owner : null,
                repo: type === 'github' ? repo : null,
                projectPath: type === 'gitlab' ? projectPath : null,
                host: type === 'gitlab' ? (host || 'https://gitlab.com') : null,
                branch: type === 'gitlab' ? (branch || 'main') : null,
                token, // In production, this should be encrypted
            },
            select: {
                id: true,
                type: true,
                name: true,
                description: true,
                owner: true,
                repo: true,
                projectPath: true,
                host: true,
                branch: true,
                createdAt: true,
            }
        });

        await prisma.audit.create({
            data: {
                actorId: userId,
                action: 'repository.create',
                target: repository.id,
                result: 'success',
                metadata: JSON.stringify({ name, type })
            }
        });

        res.json(repository);
    } catch (e) {
        console.error('Failed to create repository:', e);
        res.status(500).json({ error: 'Failed to save repository' });
    }
});

// GET /api/repositories/:id/token - Get token for a saved repository (secure endpoint)
router.get('/repositories/:id/token', async (req, res) => {
    const authReq = req as AuthenticatedRequest;
    const userId = authReq.authUser?.id;
    const { id } = req.params;

    if (!userId) {
        return res.status(401).json({ error: 'Authentication required' });
    }

    try {
        const repository = await prisma.savedRepository.findFirst({
            where: { id, userId },
            select: { token: true, type: true, owner: true, repo: true, projectPath: true, host: true, branch: true }
        });

        if (!repository) {
            return res.status(404).json({ error: 'Repository not found' });
        }

        res.json(repository);
    } catch (e) {
        console.error('Failed to get repository token:', e);
        res.status(500).json({ error: 'Failed to get repository' });
    }
});

// PUT /api/repositories/:id - Update saved repository
router.put('/repositories/:id', async (req, res) => {
    const authReq = req as AuthenticatedRequest;
    const userId = authReq.authUser?.id;
    const { id } = req.params;

    if (!userId) {
        return res.status(401).json({ error: 'Authentication required' });
    }

    const { name, description, owner, repo, projectPath, host, branch, token } = req.body;

    try {
        const existing = await prisma.savedRepository.findFirst({
            where: { id, userId }
        });

        if (!existing) {
            return res.status(404).json({ error: 'Repository not found' });
        }

        const updateData: any = {};
        if (name !== undefined) updateData.name = name;
        if (description !== undefined) updateData.description = description;
        if (owner !== undefined) updateData.owner = owner;
        if (repo !== undefined) updateData.repo = repo;
        if (projectPath !== undefined) updateData.projectPath = projectPath;
        if (host !== undefined) updateData.host = host;
        if (branch !== undefined) updateData.branch = branch;
        if (token !== undefined) updateData.token = token;

        const repository = await prisma.savedRepository.update({
            where: { id },
            data: updateData,
            select: {
                id: true,
                type: true,
                name: true,
                description: true,
                owner: true,
                repo: true,
                projectPath: true,
                host: true,
                branch: true,
                createdAt: true,
            }
        });

        await prisma.audit.create({
            data: {
                actorId: userId,
                action: 'repository.update',
                target: id,
                result: 'success',
                metadata: JSON.stringify({ updates: Object.keys(updateData) })
            }
        });

        res.json(repository);
    } catch (e) {
        console.error('Failed to update repository:', e);
        res.status(500).json({ error: 'Failed to update repository' });
    }
});

// DELETE /api/repositories/:id - Delete saved repository
router.delete('/repositories/:id', async (req, res) => {
    const authReq = req as AuthenticatedRequest;
    const userId = authReq.authUser?.id;
    const { id } = req.params;

    if (!userId) {
        return res.status(401).json({ error: 'Authentication required' });
    }

    try {
        const existing = await prisma.savedRepository.findFirst({
            where: { id, userId }
        });

        if (!existing) {
            return res.status(404).json({ error: 'Repository not found' });
        }

        await prisma.savedRepository.delete({ where: { id } });

        await prisma.audit.create({
            data: {
                actorId: userId,
                action: 'repository.delete',
                target: id,
                result: 'success',
                metadata: JSON.stringify({ name: existing.name })
            }
        });

        res.json({ message: 'Repository deleted' });
    } catch (e) {
        console.error('Failed to delete repository:', e);
        res.status(500).json({ error: 'Failed to delete repository' });
    }
});

// ===== HEALTH & METRICS ENDPOINTS =====

// GET /api/health - Health check endpoint
router.get('/health', async (req, res) => {
    const checks: Record<string, { status: 'healthy' | 'unhealthy' | 'degraded'; latency?: number; error?: string }> = {};

    // Check Redis connection
    const redisStart = Date.now();
    try {
        await connection.ping();
        checks.redis = { status: 'healthy', latency: Date.now() - redisStart };
    } catch (e: any) {
        checks.redis = { status: 'unhealthy', error: e.message };
    }

    // Check PostgreSQL connection
    const pgStart = Date.now();
    try {
        await prisma.$queryRaw`SELECT 1`;
        checks.postgres = { status: 'healthy', latency: Date.now() - pgStart };
    } catch (e: any) {
        checks.postgres = { status: 'unhealthy', error: e.message };
    }

    // Check job queue
    try {
        const waiting = await jobQueue.getWaitingCount();
        const active = await jobQueue.getActiveCount();
        const failed = await jobQueue.getFailedCount();
        checks.queue = {
            status: failed > 10 ? 'degraded' : 'healthy',
            latency: 0,
        };
        (checks.queue as any).waiting = waiting;
        (checks.queue as any).active = active;
        (checks.queue as any).failed = failed;
    } catch (e: any) {
        checks.queue = { status: 'unhealthy', error: e.message };
    }

    // Synthetic transaction tests for core functionality
    const syntheticStart = Date.now();
    try {
        // Test 1: Database read operation
        const schemaCount = await prisma.schema.count();

        // Test 2: Session lookup (common operation)
        const recentSessions = await prisma.session.findMany({
            take: 1,
            orderBy: { createdAt: 'desc' },
        });

        // Test 3: Verify generator service can be loaded
        const generatorLoaded = typeof generatorService !== 'undefined' && generatorService !== null;

        checks.synthetic = {
            status: 'healthy',
            latency: Date.now() - syntheticStart,
        };
        (checks.synthetic as any).tests = {
            database_read: schemaCount >= 0,
            session_lookup: true,
            generator_loaded: generatorLoaded,
        };
    } catch (e: any) {
        checks.synthetic = {
            status: 'unhealthy',
            latency: Date.now() - syntheticStart,
            error: e.message,
        };
    }

    // Component readiness checks
    try {
        // Check if uploads directory exists and is writable
        const fs = await import('fs/promises');
        const path = await import('path');
        const uploadsDir = path.join(process.cwd(), 'uploads');
        await fs.access(uploadsDir, (await import('fs')).constants.W_OK);
        checks.filesystem = { status: 'healthy', latency: 0 };
    } catch (e: any) {
        checks.filesystem = { status: 'unhealthy', error: 'Uploads directory not writable' };
    }

    // Overall status
    const allHealthy = Object.values(checks).every(c => c.status === 'healthy');
    const anyUnhealthy = Object.values(checks).some(c => c.status === 'unhealthy');
    const overallStatus = anyUnhealthy ? 'unhealthy' : (allHealthy ? 'healthy' : 'degraded');

    res.status(overallStatus === 'unhealthy' ? 503 : 200).json({
        status: overallStatus,
        timestamp: new Date().toISOString(),
        uptime: Math.floor((Date.now() - metrics.startTime) / 1000),
        version: process.env.npm_package_version || '1.0.0',
        checks,
    });
});

// GET /api/metrics - Prometheus-format metrics
router.get('/metrics', async (req, res) => {
    try {
        const waiting = await jobQueue.getWaitingCount();
        const active = await jobQueue.getActiveCount();
        const completed = await jobQueue.getCompletedCount();
        const failed = await jobQueue.getFailedCount();
        const schemaCount = await prisma.schema.count();
        const sessionCount = await prisma.session.count();

        const uptime = Math.floor((Date.now() - metrics.startTime) / 1000);

        const prometheusMetrics = `
# HELP swagger2mcp_uptime_seconds Server uptime in seconds
# TYPE swagger2mcp_uptime_seconds gauge
swagger2mcp_uptime_seconds ${uptime}

# HELP swagger2mcp_jobs_total Total jobs by status
# TYPE swagger2mcp_jobs_total counter
swagger2mcp_jobs_total{status="waiting"} ${waiting}
swagger2mcp_jobs_total{status="active"} ${active}
swagger2mcp_jobs_total{status="completed"} ${completed}
swagger2mcp_jobs_total{status="failed"} ${failed}

# HELP swagger2mcp_schemas_total Total schemas stored
# TYPE swagger2mcp_schemas_total gauge
swagger2mcp_schemas_total ${schemaCount}

# HELP swagger2mcp_sessions_total Total sessions
# TYPE swagger2mcp_sessions_total gauge
swagger2mcp_sessions_total ${sessionCount}

# HELP swagger2mcp_uploads_total Total uploads received
# TYPE swagger2mcp_uploads_total counter
swagger2mcp_uploads_total ${metrics.uploadsReceived}

# HELP swagger2mcp_crawls_total Total crawls started
# TYPE swagger2mcp_crawls_total counter
swagger2mcp_crawls_total ${metrics.crawlsStarted}

# HELP swagger2mcp_generations_total Total generations completed
# TYPE swagger2mcp_generations_total counter
swagger2mcp_generations_total ${metrics.generationsCompleted}
`.trim();

        res.set('Content-Type', 'text/plain; version=0.0.4');
        res.send(prometheusMetrics);
    } catch (e: any) {
        console.error('Failed to collect metrics:', e);
        res.status(500).json({ error: 'Failed to collect metrics' });
    }
});

// Export metrics tracker for use in other routes
export { metrics };

export default router;
