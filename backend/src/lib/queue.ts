import { Queue, Worker, QueueEvents } from 'bullmq';
import IORedis from 'ioredis';

// Enhanced Redis configuration with reconnection logic
const redisOptions = {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    maxRetriesPerRequest: null, // Required for BullMQ
    enableReadyCheck: true,
    
    // Reconnection strategy
    retryStrategy(times: number) {
        const delay = Math.min(times * 50, 2000);
        console.log(`Redis reconnecting in ${delay}ms (attempt ${times})`);
        return delay;
    },
    
    // Connection timeout
    connectTimeout: 10000,
    
    // Keep-alive to detect stale connections
    keepAlive: 30000,
    
    // Automatic pipeline for better performance
    enableAutoPipelining: true,
    
    // Lazy connect - don't block startup if Redis is temporarily unavailable
    lazyConnect: false,
};

export const connection = new IORedis(redisOptions);

// Connection event handlers for monitoring
connection.on('connect', () => {
    console.log('Redis connected');
});

connection.on('ready', () => {
    console.log('Redis ready');
});

connection.on('error', (err) => {
    console.error('Redis error:', err.message);
});

connection.on('close', () => {
    console.log('Redis connection closed');
});

connection.on('reconnecting', (time: number) => {
    console.log(`Redis reconnecting in ${time}ms`);
});

// Graceful shutdown
process.on('SIGINT', async () => {
    await connection.quit();
    process.exit(0);
});

process.on('SIGTERM', async () => {
    await connection.quit();
    process.exit(0);
});

export const jobQueue = new Queue('jobQueue', { connection });
export const jobEvents = new QueueEvents('jobQueue', { connection });

// Worker will be initialized in worker.ts
