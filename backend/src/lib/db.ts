import { PrismaClient } from '@prisma/client';
import { logger } from '../lib/logger';

const globalForPrisma = globalThis as typeof globalThis & { __db__?: PrismaClient };

let prisma: PrismaClient;

if (process.env.NODE_ENV === 'production') {
  prisma = new PrismaClient();
} else {
  if (!globalForPrisma.__db__) {
    globalForPrisma.__db__ = new PrismaClient();
  }
  prisma = globalForPrisma.__db__;
}

if (process.env.NODE_ENV === 'development') {
  prisma.$connect().then(() => {
    logger.info('Database connected');
  });
}

export { prisma };
