import { Request, Response, NextFunction } from 'express';
import passport from 'passport';
import { AuthService } from '../services/auth.service';

export interface AuthUser {
    id: string;
    email: string;
    username?: string;
    displayName?: string;
    provider: string;
    role?: string;
}

export interface AuthenticatedRequest extends Request {
    user?: AuthUser;
    authUser?: AuthUser; // Use different property to avoid conflict with Passport's user
    authenticated?: boolean;
}

/**
 * Optional Authentication Middleware
 * Allows both authenticated and anonymous users
 * Sets req.authUser if authenticated, otherwise leaves it undefined
 */
export const optionalAuth = (req: Request, res: Response, next: NextFunction) => {
    // Try JWT authentication
    passport.authenticate('jwt', { session: false }, async (err: Error, user: any) => {
        if (err) {
            return next(err);
        }

        const authReq = req as AuthenticatedRequest;
        
        if (user) {
            // Fetch role from database
            try {
                const { prisma } = await import('../lib/db');
                const dbUser = await prisma.user.findUnique({
                    where: { id: user.id },
                    select: { role: true }
                });
                
                authReq.authUser = { ...user, role: dbUser?.role };
                authReq.authenticated = true;
            } catch (error) {
                console.error('Failed to fetch user role:', error);
                authReq.authUser = user;
                authReq.authenticated = true;
            }
        } else {
            authReq.authenticated = false;
        }

        next();
    })(req, res, next);
};

/**
 * Required Authentication Middleware
 * Blocks anonymous users
 */
export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
    passport.authenticate('jwt', { session: false }, async (err: Error, user: any, info: any) => {
        if (err) {
            return next(err);
        }

        if (!user) {
            return res.status(401).json({ 
                error: 'Authentication required',
                message: info?.message || 'No valid authentication token provided'
            });
        }

        const authReq = req as AuthenticatedRequest;
        
        // Fetch role from database
        try {
            const { prisma } = await import('../lib/db');
            const dbUser = await prisma.user.findUnique({
                where: { id: user.id },
                select: { role: true }
            });
            
            authReq.authUser = { ...user, role: dbUser?.role };
            authReq.authenticated = true;
        } catch (error) {
            console.error('Failed to fetch user role:', error);
            authReq.authUser = user;
            authReq.authenticated = true;
        }

        next();
    })(req, res, next);
};

/**
 * Get user ID from request (authenticated or anonymous session)
 */
export const getUserId = (req: Request): string | null => {
    const authReq = req as AuthenticatedRequest;
    return authReq.authUser?.id || null;
};

/**
 * Check if anonymous access is allowed
 */
export const isAnonymousAllowed = (): boolean => {
    return process.env.ALLOW_ANONYMOUS === 'true' || process.env.ALLOW_ANONYMOUS === '1';
};

/**
 * Middleware to block anonymous access if not allowed
 */
export const checkAnonymousAllowed = (req: Request, res: Response, next: NextFunction) => {
    const authReq = req as AuthenticatedRequest;
    
    if (!authReq.authenticated && !isAnonymousAllowed()) {
        return res.status(401).json({ 
            error: 'Authentication required',
            message: 'Anonymous access is not allowed. Please sign in.'
        });
    }

    next();
};

/**
 * Admin-only Middleware
 * Requires authentication and admin role
 */
export const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
    passport.authenticate('jwt', { session: false }, async (err: Error, user: any, info: any) => {
        if (err) {
            return next(err);
        }

        if (!user) {
            return res.status(401).json({ 
                error: 'Authentication required',
                message: info?.message || 'No valid authentication token provided'
            });
        }

        // Check if user has admin role
        try {
            const { prisma } = await import('../lib/db');
            const dbUser = await prisma.user.findUnique({
                where: { id: user.id },
                select: { role: true }
            });

            if (!dbUser || dbUser.role !== 'admin') {
                return res.status(403).json({ 
                    error: 'Forbidden',
                    message: 'Admin access required'
                });
            }

            const authReq = req as AuthenticatedRequest;
            authReq.authUser = user;
            authReq.authenticated = true;

            next();
        } catch (error) {
            return next(error);
        }
    })(req, res, next);
};
