import { prisma } from '../lib/db';
import { configService } from './config.service';

interface AuditLogInput {
  actorId?: string | null;
  action: string;
  target?: string | null;
  result: 'success' | 'failure';
  metadata?: Record<string, any>;
}

interface AuditQueryParams {
  action?: string;
  actorId?: string;
  startDate?: Date;
  endDate?: Date;
  result?: 'success' | 'failure';
}

interface PaginatedAuditResult {
  data: any[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

class AuditService {
  /**
   * Log an audit event
   */
  async log(input: AuditLogInput): Promise<void> {
    try {
      await prisma.audit.create({
        data: {
          actorId: input.actorId,
          action: input.action,
          target: input.target,
          result: input.result,
          metadata: input.metadata ? JSON.stringify(input.metadata) : null,
        },
      });
    } catch (error) {
      // Don't throw - audit logging should not break main flow
      console.error('Failed to log audit event:', error);
    }
  }

  /**
   * Query audit logs with filtering and pagination
   */
  async query(
    params: AuditQueryParams,
    page: number = 1,
    pageSize: number = 25
  ): Promise<PaginatedAuditResult> {
    const where: any = {};

    if (params.action) {
      where.action = { contains: params.action, mode: 'insensitive' };
    }
    if (params.actorId) {
      where.actorId = params.actorId;
    }
    if (params.result) {
      where.result = params.result;
    }
    if (params.startDate || params.endDate) {
      where.timestamp = {};
      if (params.startDate) {
        where.timestamp.gte = params.startDate;
      }
      if (params.endDate) {
        where.timestamp.lte = params.endDate;
      }
    }

    const [data, total] = await Promise.all([
      prisma.audit.findMany({
        where,
        orderBy: { timestamp: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          actor: {
            select: {
              id: true,
              email: true,
              displayName: true,
            },
          },
        },
      }),
      prisma.audit.count({ where }),
    ]);

    // Parse metadata JSON for each entry
    const parsedData = data.map(entry => ({
      ...entry,
      metadata: entry.metadata ? JSON.parse(entry.metadata) : null,
    }));

    return {
      data: parsedData,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  /**
   * Export audit logs as JSON (for download)
   */
  async exportJson(params: AuditQueryParams): Promise<any[]> {
    const where: any = {};

    if (params.action) {
      where.action = { contains: params.action, mode: 'insensitive' };
    }
    if (params.actorId) {
      where.actorId = params.actorId;
    }
    if (params.result) {
      where.result = params.result;
    }
    if (params.startDate || params.endDate) {
      where.timestamp = {};
      if (params.startDate) {
        where.timestamp.gte = params.startDate;
      }
      if (params.endDate) {
        where.timestamp.lte = params.endDate;
      }
    }

    const data = await prisma.audit.findMany({
      where,
      orderBy: { timestamp: 'desc' },
      include: {
        actor: {
          select: {
            id: true,
            email: true,
            displayName: true,
          },
        },
      },
    });

    return data.map(entry => ({
      id: entry.id,
      timestamp: entry.timestamp.toISOString(),
      actor: entry.actor ? {
        id: entry.actor.id,
        email: entry.actor.email,
        displayName: entry.actor.displayName,
      } : null,
      action: entry.action,
      target: entry.target,
      result: entry.result,
      metadata: entry.metadata ? JSON.parse(entry.metadata) : null,
    }));
  }

  /**
   * Clean up old audit logs based on retention policy
   */
  async cleanup(): Promise<number> {
    const retentionDays = await configService.getNumber('audit.retentionDays', 30);
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    const result = await prisma.audit.deleteMany({
      where: {
        timestamp: { lt: cutoffDate },
      },
    });

    console.log(`Audit cleanup: deleted ${result.count} records older than ${retentionDays} days`);
    return result.count;
  }

  /**
   * Get distinct action types for filtering
   */
  async getActionTypes(): Promise<string[]> {
    const actions = await prisma.audit.findMany({
      select: { action: true },
      distinct: ['action'],
      orderBy: { action: 'asc' },
    });
    return actions.map(a => a.action);
  }
}

export const auditService = new AuditService();
