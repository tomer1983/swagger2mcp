import { Router, Request, Response } from 'express';
import passport from '../config/passport';
import { AuthService } from '../services/auth.service';
import { optionalAuth, requireAuth, AuthenticatedRequest } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();

/**
 * POST /api/auth/register
 * Register a new user with email and password
 */
// Public registration disabled - users must be created by admin
// router.post('/register', asyncHandler(async (req: Request, res: Response) => {
//     const { email, password, username } = req.body;
//
//     if (!email || !password) {
//         return res.status(400).json({ error: 'Email and password are required' });
//     }
//
//     if (password.length < 8) {
//         return res.status(400).json({ error: 'Password must be at least 8 characters long' });
//     }
//
//     try {
//         const user = await AuthService.createLocalUser(email, password, username);
//         const token = AuthService.generateToken(user.id, user.email, user.username || undefined);
//
//         res.status(201).json({
//             message: 'User registered successfully',
//             token,
//             user: {
//                 id: user.id,
//                 email: user.email,
//                 username: user.username,
//                 displayName: user.displayName,
//                 provider: user.provider,
//             },
//         });
//     } catch (error: any) {
//         if (error.message.includes('already exists') || error.message.includes('already taken')) {
//             return res.status(409).json({ error: error.message });
//         }
//         throw error;
//     }
// }));

/**
 * POST /api/auth/login
 * Login with email and password
 */
router.post('/login', asyncHandler(async (req: Request, res: Response) => {
    const { email, password, sessionId } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
    }

    passport.authenticate('local', { session: false }, async (err: Error, user: any, info: any) => {
        if (err) {
            return res.status(500).json({ error: 'Authentication error' });
        }

        if (!user) {
            return res.status(401).json({ error: info?.message || 'Invalid email or password' });
        }

        // If sessionId provided, migrate anonymous data to user
        if (sessionId) {
            try {
                await AuthService.migrateAnonymousSession(sessionId, user.id);
            } catch (error) {
                console.error('Failed to migrate session:', error);
            }
        }

        const token = AuthService.generateToken(user.id, user.email, user.username || undefined);

        res.json({
            message: 'Login successful',
            token,
            user: {
                id: user.id,
                email: user.email,
                username: user.username,
                displayName: user.displayName,
                provider: user.provider,
                role: user.role,
            },
        });
    })(req, res);
}));

/**
 * GET /api/auth/microsoft
 * Initiate Microsoft OAuth2 flow
 */
router.get('/microsoft', (req: Request, res: Response, next) => {
    if (!process.env.MICROSOFT_CLIENT_ID) {
        return res.status(501).json({ error: 'Microsoft authentication not configured' });
    }

    passport.authenticate('microsoft', {
        session: false,
        prompt: 'select_account',
    })(req, res, next);
});

/**
 * GET /api/auth/microsoft/callback
 * Microsoft OAuth2 callback
 */
router.get('/microsoft/callback', (req: Request, res: Response, next) => {
    passport.authenticate('microsoft', { session: false }, async (err: Error, user: any, info: any) => {
        if (err || !user) {
            const errorMsg = err?.message || info?.message || 'Microsoft authentication failed';
            return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}?auth_error=${encodeURIComponent(errorMsg)}`);
        }

        const token = AuthService.generateToken(user.id, user.email, user.username || undefined);

        // Redirect to frontend with token
        res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}?auth_token=${token}`);
    })(req, res, next);
});

/**
 * GET /api/auth/me
 * Get current authenticated user
 */
router.get('/me', requireAuth, asyncHandler(async (req: Request, res: Response) => {
    const authReq = req as AuthenticatedRequest;

    const user = await AuthService.getUserById(authReq.authUser!.id);

    if (!user) {
        return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user });
}));

/**
 * POST /api/auth/logout
 * Logout (client-side operation, but endpoint for consistency)
 */
router.post('/logout', (req: Request, res: Response) => {
    res.json({ message: 'Logout successful' });
});

/**
 * POST /api/auth/verify-token
 * Verify if a token is valid
 */
router.post('/verify-token', optionalAuth, (req: Request, res: Response) => {
    const authReq = req as AuthenticatedRequest;

    if (authReq.authenticated && authReq.authUser) {
        res.json({
            valid: true,
            user: authReq.authUser
        });
    } else {
        res.json({ valid: false });
    }
});

export default router;
