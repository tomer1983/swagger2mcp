import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import passport from './config/passport';
import apiRouter from './routes/api';
import authRouter from './routes/auth';
import adminRouter from './routes/admin';
import { errorHandler, notFoundHandler, requestIdMiddleware } from './middleware/errorHandler';
import { configService } from './services/config.service';

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
    // Seed default config values
    try {
        await configService.seedDefaults();
    } catch (error) {
        console.error('Failed to seed config defaults:', error);
    }
    console.log(`Server running on port ${port}`);
});
