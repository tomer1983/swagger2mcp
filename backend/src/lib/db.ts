import { PrismaClient } from '@prisma/client';

// Connection pool configuration for optimal performance
const prismaOptions = {
    datasources: {
        db: {
            url: process.env.DATABASE_URL,
        },
    },
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] as const : ['error'] as const,
    // Connection pool settings
    // Prisma automatically manages connection pooling based on DATABASE_URL parameters
    // Add ?connection_limit=10&pool_timeout=20 to DATABASE_URL for custom pool size
};

export const prisma = new PrismaClient(prismaOptions);

// Graceful shutdown - close connections on app termination
process.on('SIGINT', async () => {
    await prisma.$disconnect();
    process.exit(0);
});

process.on('SIGTERM', async () => {
    await prisma.$disconnect();
    process.exit(0);
});
