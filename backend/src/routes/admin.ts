import { Router, Response } from 'express';
import { prisma } from '../lib/db';
import { connection, jobQueue } from '../lib/queue';
import { requireAdmin, AuthenticatedRequest } from '../middleware/auth';
import { configService } from '../services/config.service';
import { auditService } from '../services/audit.service';
import { userService } from '../services/user.service';

const router = Router();

// Track backend start time
const startTime = Date.now();

// Health check endpoint - checks all system components
router.get('/health', requireAdmin, async (req, res) => {
  const health: any = {
    timestamp: new Date().toISOString(),
    status: 'healthy',
    checks: {},
  };

  try {
    // Check Database (PostgreSQL via Prisma)
    try {
      await prisma.$queryRaw`SELECT 1`;
      health.checks.database = {
        status: 'healthy',
        message: 'PostgreSQL connection successful',
      };
    } catch (error: any) {
      health.checks.database = {
        status: 'unhealthy',
        message: error.message,
      };
      health.status = 'degraded';
    }

    // Check Redis (via IORedis connection)
    try {
      const pong = await connection.ping();
      health.checks.redis = {
        status: pong === 'PONG' ? 'healthy' : 'unhealthy',
        message: pong === 'PONG' ? 'Redis connection successful' : 'Unexpected ping response',
      };
    } catch (error: any) {
      health.checks.redis = {
        status: 'unhealthy',
        message: error.message,
      };
      health.status = 'degraded';
    }

    // Check Worker (by checking if there are any active workers in BullMQ)
    try {
      const workers = await jobQueue.getWorkers();
      health.checks.worker = {
        status: workers.length > 0 ? 'healthy' : 'warning',
        message: `${workers.length} worker(s) active`,
        activeWorkers: workers.length,
      };
      if (workers.length === 0) {
        health.status = 'degraded';
      }
    } catch (error: any) {
      health.checks.worker = {
        status: 'unhealthy',
        message: error.message,
      };
      health.status = 'degraded';
    }

    // Backend API is healthy if we got here
    health.checks.backend = {
      status: 'healthy',
      message: 'API responding',
      uptime: Math.floor((Date.now() - startTime) / 1000),
    };

    res.status(health.status === 'healthy' ? 200 : 503).json(health);
  } catch (error: any) {
    res.status(500).json({
      timestamp: new Date().toISOString(),
      status: 'unhealthy',
      error: error.message,
    });
  }
});

// Metrics endpoint - provides system metrics and statistics
router.get('/metrics', requireAdmin, async (req, res) => {
  try {
    const now = Date.now();
    const oneDayAgo = new Date(now - 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);

    // Get timeframe from query (default: 24h)
    const timeframe = req.query.timeframe as string || '24h';
    let startDate: Date;
    switch (timeframe) {
      case '7d':
        startDate = sevenDaysAgo;
        break;
      case '30d':
        startDate = thirtyDaysAgo;
        break;
      default:
        startDate = oneDayAgo;
    }

    // Total schemas generated (all time)
    const totalSchemas = await prisma.schema.count();

    // Schemas created in timeframe
    const recentSchemas = await prisma.schema.count({
      where: {
        createdAt: { gte: startDate },
      },
    });

    // Job statistics from BullMQ
    const jobCounts = await jobQueue.getJobCounts();

    // Failed jobs in timeframe
    const failedJobs = await jobQueue.getFailed(0, -1);
    const recentFailedJobs = failedJobs.filter(job =>
      job.timestamp && job.timestamp >= startDate.getTime()
    );

    // Completed jobs in timeframe  
    const completedJobs = await jobQueue.getCompleted(0, -1);
    const recentCompletedJobs = completedJobs.filter(job =>
      job.finishedOn && job.finishedOn >= startDate.getTime()
    );

    // Calculate average generation time
    let avgGenerationTime = 0;
    if (recentCompletedJobs.length > 0) {
      const totalTime = recentCompletedJobs.reduce((sum, job) => {
        const duration = job.finishedOn! - (job.processedOn || job.timestamp);
        return sum + duration;
      }, 0);
      avgGenerationTime = Math.round(totalTime / recentCompletedJobs.length);
    }

    // User statistics
    const totalUsers = await prisma.user.count();
    const recentUsers = await prisma.user.count({
      where: {
        createdAt: { gte: startDate },
      },
    });

    // Active sessions (users who logged in within timeframe)
    const activeSessions = await prisma.user.count({
      where: {
        lastLoginAt: { gte: startDate },
      },
    });

    const metrics = {
      timestamp: new Date().toISOString(),
      timeframe,
      uptime: Math.floor((now - startTime) / 1000),
      schemas: {
        total: totalSchemas,
        recent: recentSchemas,
        byType: await prisma.schema.groupBy({
          by: ['type'],
          _count: true,
        }),
      },
      jobs: {
        waiting: jobCounts.waiting || 0,
        active: jobCounts.active || 0,
        completed: recentCompletedJobs.length,
        failed: recentFailedJobs.length,
        avgDuration: avgGenerationTime,
      },
      users: {
        total: totalUsers,
        recent: recentUsers,
        activeSessions,
      },
    };

    res.json(metrics);
  } catch (error: any) {
    console.error('Metrics error:', error);
    res.status(500).json({
      error: 'Failed to retrieve metrics',
      message: error.message,
    });
  }
});

// ============================================
// Configuration Endpoints
// ============================================

// Get all configuration grouped by category
router.get('/config', requireAdmin, async (req: any, res: any) => {
  try {
    const config = await configService.getAll();
    res.json(config);
  } catch (error: any) {
    console.error('Config get error:', error);
    res.status(500).json({ error: 'Failed to get configuration' });
  }
});

// Update configuration values
router.patch('/config', requireAdmin, async (req: any, res: any) => {
  try {
    const updates = req.body as Record<string, any>;

    // Convert values to strings for storage
    const stringUpdates: Record<string, string> = {};
    for (const [key, value] of Object.entries(updates)) {
      stringUpdates[key] = typeof value === 'string' ? value : JSON.stringify(value);
    }

    await configService.setMany(stringUpdates);

    // Log audit event
    await auditService.log({
      actorId: req.user?.id,
      action: 'config.update',
      target: null,
      result: 'success',
      metadata: { keys: Object.keys(updates) },
    });

    res.json({ message: 'Configuration updated', keys: Object.keys(updates) });
  } catch (error: any) {
    console.error('Config update error:', error);
    res.status(500).json({ error: 'Failed to update configuration' });
  }
});

// ============================================
// User Management Endpoints
// ============================================

// List all users with pagination
router.get('/users', requireAdmin, async (req: any, res: any) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 10;
    const search = req.query.search as string;
    const sortBy = req.query.sortBy as any;
    const sortOrder = req.query.sortOrder as 'asc' | 'desc';

    const result = await userService.listUsers(page, pageSize, { search, sortBy, sortOrder });
    res.json(result);
  } catch (error: any) {
    console.error('Users list error:', error);
    res.status(500).json({ error: 'Failed to list users' });
  }
});

// Get a single user
router.get('/users/:id', requireAdmin, async (req: any, res: any) => {
  try {
    const user = await userService.getUser(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  } catch (error: any) {
    console.error('User get error:', error);
    res.status(500).json({ error: 'Failed to get user' });
  }
});

// Create a new user
router.post('/users', requireAdmin, async (req: any, res: any) => {
  try {
    const { email, password, username, displayName, role } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await userService.createUser({ email, password, username, displayName, role });

    await auditService.log({
      actorId: req.user?.id,
      action: 'user.create',
      target: user.id,
      result: 'success',
      metadata: { email, role: role || 'user' },
    });

    res.status(201).json(user);
  } catch (error: any) {
    console.error('User create error:', error);
    res.status(400).json({ error: error.message || 'Failed to create user' });
  }
});

// Update a user
router.patch('/users/:id', requireAdmin, async (req: any, res: any) => {
  try {
    const { username, displayName, role, isActive } = req.body;
    const user = await userService.updateUser(req.params.id, { username, displayName, role, isActive });

    await auditService.log({
      actorId: req.user?.id,
      action: 'user.update',
      target: req.params.id,
      result: 'success',
      metadata: { changes: req.body },
    });

    res.json(user);
  } catch (error: any) {
    console.error('User update error:', error);
    res.status(400).json({ error: error.message || 'Failed to update user' });
  }
});

// Delete (deactivate) a user
router.delete('/users/:id', requireAdmin, async (req: any, res: any) => {
  try {
    // Prevent admin from deleting themselves
    if (req.params.id === req.user?.id) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }

    await userService.deleteUser(req.params.id);

    await auditService.log({
      actorId: req.user?.id,
      action: 'user.delete',
      target: req.params.id,
      result: 'success',
      metadata: {},
    });

    res.json({ message: 'User deactivated' });
  } catch (error: any) {
    console.error('User delete error:', error);
    res.status(400).json({ error: error.message || 'Failed to delete user' });
  }
});

// Reset user password
router.post('/users/:id/reset-password', requireAdmin, async (req: any, res: any) => {
  try {
    const { newPassword } = req.body;
    if (!newPassword || newPassword.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    await userService.resetPassword(req.params.id, newPassword);

    await auditService.log({
      actorId: req.user?.id,
      action: 'user.password_reset',
      target: req.params.id,
      result: 'success',
      metadata: {},
    });

    res.json({ message: 'Password reset successfully' });
  } catch (error: any) {
    console.error('Password reset error:', error);
    res.status(400).json({ error: error.message || 'Failed to reset password' });
  }
});

// ============================================
// Audit Log Endpoints
// ============================================

// Get audit logs with filtering
router.get('/audit', requireAdmin, async (req: any, res: any) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 25;
    const action = req.query.action as string;
    const actorId = req.query.actorId as string;
    const result = req.query.result as 'success' | 'failure';
    const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
    const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;

    const logs = await auditService.query(
      { action, actorId, result, startDate, endDate },
      page,
      pageSize
    );
    res.json(logs);
  } catch (error: any) {
    console.error('Audit query error:', error);
    res.status(500).json({ error: 'Failed to query audit logs' });
  }
});

// Export audit logs as JSON
router.get('/audit/export', requireAdmin, async (req: any, res: any) => {
  try {
    const action = req.query.action as string;
    const actorId = req.query.actorId as string;
    const result = req.query.result as 'success' | 'failure';
    const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
    const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;

    const logs = await auditService.exportJson({ action, actorId, result, startDate, endDate });

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename=audit-logs-${new Date().toISOString().split('T')[0]}.json`);
    res.json(logs);
  } catch (error: any) {
    console.error('Audit export error:', error);
    res.status(500).json({ error: 'Failed to export audit logs' });
  }
});

// Get available action types for filtering
router.get('/audit/actions', requireAdmin, async (req: any, res: any) => {
  try {
    const actions = await auditService.getActionTypes();
    res.json(actions);
  } catch (error: any) {
    console.error('Audit actions error:', error);
    res.status(500).json({ error: 'Failed to get action types' });
  }
});

export default router;
