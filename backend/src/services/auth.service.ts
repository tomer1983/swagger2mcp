import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/db';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

export interface JWTPayload {
    userId: string;
    email: string;
    username?: string;
}

export interface CreateUserData {
    email: string;
    username?: string;
    password?: string;
    provider?: string;
    providerId?: string;
    displayName?: string;
}

export class AuthService {
    /**
     * Hash a password using bcrypt
     */
    static async hashPassword(password: string): Promise<string> {
        const salt = await bcrypt.genSalt(10);
        return bcrypt.hash(password, salt);
    }

    /**
     * Compare a plain text password with a hashed password
     */
    static async comparePassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
        return bcrypt.compare(plainPassword, hashedPassword);
    }

    /**
     * Generate a JWT token for a user
     */
    static generateToken(userId: string, email: string, username?: string): string {
        const payload: JWTPayload = { userId, email, username };
        return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN as any });
    }

    /**
     * Verify and decode a JWT token
     */
    static verifyToken(token: string): JWTPayload | null {
        try {
            return jwt.verify(token, JWT_SECRET) as JWTPayload;
        } catch (error) {
            return null;
        }
    }

    /**
     * Create a new user (local auth)
     */
    static async createLocalUser(email: string, password: string, username?: string) {
        // Check if user already exists
        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            throw new Error('User with this email already exists');
        }

        if (username) {
            const existingUsername = await prisma.user.findUnique({ where: { username } });
            if (existingUsername) {
                throw new Error('Username already taken');
            }
        }

        const passwordHash = await this.hashPassword(password);

        const user = await prisma.user.create({
            data: {
                email,
                username,
                passwordHash,
                provider: 'local',
                displayName: username || email.split('@')[0],
            },
        });

        return user;
    }

    /**
     * Find or create a user from OAuth provider
     */
    static async findOrCreateOAuthUser(data: CreateUserData) {
        const { email, provider = 'microsoft', providerId, displayName } = data;

        // Try to find existing user by email or providerId
        let user = await prisma.user.findFirst({
            where: {
                OR: [
                    { email },
                    { providerId, provider },
                ],
            },
        });

        if (!user) {
            // Create new user
            user = await prisma.user.create({
                data: {
                    email,
                    provider,
                    providerId,
                    displayName: displayName || email.split('@')[0],
                },
            });
        } else if (user.provider === 'local' && provider !== 'local') {
            // Link OAuth provider to existing local account
            user = await prisma.user.update({
                where: { id: user.id },
                data: {
                    provider,
                    providerId,
                },
            });
        }

        return user;
    }

    /**
     * Authenticate a user with email and password
     */
    static async authenticateLocal(email: string, password: string) {
        const user = await prisma.user.findUnique({
            where: { email },
        });

        if (!user || user.provider !== 'local' || !user.passwordHash) {
            throw new Error('Invalid email or password');
        }

        const isPasswordValid = await this.comparePassword(password, user.passwordHash);
        if (!isPasswordValid) {
            throw new Error('Invalid email or password');
        }

        // Update last login
        await prisma.user.update({
            where: { id: user.id },
            data: { lastLoginAt: new Date() },
        });

        return user;
    }

    /**
     * Get user by ID
     */
    static async getUserById(userId: string) {
        return prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                email: true,
                username: true,
                displayName: true,
                provider: true,
                createdAt: true,
                lastLoginAt: true,
            },
        });
    }

    /**
     * Update user's last login time
     */
    static async updateLastLogin(userId: string) {
        return prisma.user.update({
            where: { id: userId },
            data: { lastLoginAt: new Date() },
        });
    }

    /**
     * Migrate anonymous session to authenticated user
     */
    static async migrateAnonymousSession(sessionId: string, userId: string) {
        // Update session to be owned by user
        await prisma.session.update({
            where: { id: sessionId },
            data: { userId },
        });

        // Update all schemas in this session to be owned by user
        await prisma.schema.updateMany({
            where: { sessionId },
            data: { userId },
        });
    }
}
