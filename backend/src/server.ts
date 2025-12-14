import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import { execSync } from 'child_process';
import passport from './config/passport';
import apiRouter from './routes/api';
import authRouter from './routes/auth';
import adminRouter from './routes/admin';
import { errorHandler, notFoundHandler, requestIdMiddleware } from './middleware/errorHandler';
import { configService } from './services/config.service';
import { userService } from './services/user.service';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Rate limiting to prevent API abuse (Issue #8)
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many requests, please try again later.' }
});

app.use(cors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || 'http://localhost:5173',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
}));
app.use(express.json());
app.use(cookieParser());
app.use(requestIdMiddleware); // Add request ID tracking
app.use(passport.initialize()); // Initialize Passport
app.use('/api/', limiter);

app.use('/api/auth', authRouter);
app.use('/api/admin', adminRouter);
app.use('/api', apiRouter);

app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
});

// 404 handler (must be after all routes)
app.use(notFoundHandler);

// Global error handler (must be last)
app.use(errorHandler);

app.listen(port, async () => {
    // Run database migrations on startup
    try {
        console.log('Running database migrations...');
        execSync('npx prisma migrate deploy', {
            stdio: 'inherit',
            env: process.env
        });
        console.log('Database migrations completed');
    } catch (error) {
        console.error('Failed to run migrations:', error);
        // Don't exit - migrations may have already been applied
    }

    // Seed default config values
    try {
        await configService.seedDefaults();
    } catch (error) {
        console.error('Failed to seed config defaults:', error);
    }

    // Seed default admin user
    try {
        await userService.seedDefaultAdmin();
    } catch (error) {
        console.error('Failed to seed admin user:', error);
    }

    console.log(`Server running on port ${port}`);
});
