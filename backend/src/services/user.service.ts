import { prisma } from '../lib/db';
import bcrypt from 'bcryptjs';

interface UserCreateInput {
  email: string;
  password: string;
  username?: string;
  displayName?: string;
  role?: 'user' | 'admin';
}

interface UserUpdateInput {
  username?: string;
  displayName?: string;
  role?: 'user' | 'admin';
  isActive?: boolean;
}

interface UserQueryParams {
  search?: string;
  sortBy?: 'email' | 'username' | 'displayName' | 'role' | 'createdAt' | 'lastLoginAt';
  sortOrder?: 'asc' | 'desc';
}

interface PaginatedUserResult {
  data: any[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

class UserService {
  /**
   * List users with pagination, search, and sorting
   */
  async listUsers(
    page: number = 1,
    pageSize: number = 10,
    params: UserQueryParams = {}
  ): Promise<PaginatedUserResult> {
    const where: any = {};

    if (params.search) {
      where.OR = [
        { email: { contains: params.search, mode: 'insensitive' } },
        { username: { contains: params.search, mode: 'insensitive' } },
        { displayName: { contains: params.search, mode: 'insensitive' } },
      ];
    }

    const orderBy: any = {};
    const sortBy = params.sortBy || 'createdAt';
    const sortOrder = params.sortOrder || 'desc';
    orderBy[sortBy] = sortOrder;

    const [data, total] = await Promise.all([
      prisma.user.findMany({
        where,
        orderBy,
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          id: true,
          email: true,
          username: true,
          displayName: true,
          role: true,
          provider: true,
          isActive: true,
          createdAt: true,
          lastLoginAt: true,
          _count: {
            select: { sessions: true },
          },
        },
      }),
      prisma.user.count({ where }),
    ]);

    return {
      data: data.map(user => ({
        ...user,
        sessionCount: user._count.sessions,
        _count: undefined,
      })),
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  /**
   * Get a single user by ID
   */
  async getUser(id: string): Promise<any | null> {
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        username: true,
        displayName: true,
        role: true,
        provider: true,
        isActive: true,
        createdAt: true,
        lastLoginAt: true,
        _count: {
          select: { sessions: true, schemas: true },
        },
      },
    });

    if (!user) return null;

    return {
      ...user,
      sessionCount: user._count.sessions,
      schemaCount: user._count.schemas,
      _count: undefined,
    };
  }

  /**
   * Create a new local user
   */
  async createUser(input: UserCreateInput): Promise<any> {
    // Check if email already exists
    const existing = await prisma.user.findUnique({
      where: { email: input.email },
    });
    if (existing) {
      throw new Error('User with this email already exists');
    }

    // Check if username already exists (if provided)
    if (input.username) {
      const existingUsername = await prisma.user.findUnique({
        where: { username: input.username },
      });
      if (existingUsername) {
        throw new Error('Username already taken');
      }
    }

    // Hash password
    const passwordHash = await bcrypt.hash(input.password, 12);

    const user = await prisma.user.create({
      data: {
        email: input.email,
        passwordHash,
        username: input.username,
        displayName: input.displayName,
        role: input.role || 'user',
        provider: 'local',
        isActive: true,
      },
      select: {
        id: true,
        email: true,
        username: true,
        displayName: true,
        role: true,
        provider: true,
        isActive: true,
        createdAt: true,
      },
    });

    return user;
  }

  /**
   * Update a user
   */
  async updateUser(id: string, input: UserUpdateInput): Promise<any> {
    // Check if user exists
    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing) {
      throw new Error('User not found');
    }

    // Check if username is being changed and if it's already taken
    if (input.username && input.username !== existing.username) {
      const existingUsername = await prisma.user.findUnique({
        where: { username: input.username },
      });
      if (existingUsername) {
        throw new Error('Username already taken');
      }
    }

    const user = await prisma.user.update({
      where: { id },
      data: {
        username: input.username,
        displayName: input.displayName,
        role: input.role,
        isActive: input.isActive,
      },
      select: {
        id: true,
        email: true,
        username: true,
        displayName: true,
        role: true,
        provider: true,
        isActive: true,
        createdAt: true,
        lastLoginAt: true,
      },
    });

    return user;
  }

  /**
   * Soft delete a user (set isActive to false)
   */
  async deleteUser(id: string): Promise<void> {
    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing) {
      throw new Error('User not found');
    }

    await prisma.user.update({
      where: { id },
      data: { isActive: false },
    });
  }

  /**
   * Hard delete a user (permanent)
   */
  async permanentlyDeleteUser(id: string): Promise<void> {
    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing) {
      throw new Error('User not found');
    }

    // Delete related data first
    await prisma.session.deleteMany({ where: { userId: id } });
    await prisma.audit.deleteMany({ where: { actorId: id } });
    await prisma.user.delete({ where: { id } });
  }

  /**
   * Reset a user's password
   */
  async resetPassword(id: string, newPassword: string): Promise<void> {
    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing) {
      throw new Error('User not found');
    }

    if (existing.provider !== 'local') {
      throw new Error('Cannot reset password for OAuth users');
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({
      where: { id },
      data: { passwordHash },
    });
  }
}

export const userService = new UserService();
