import { PrismaClient } from '@prisma/client';
import { logger } from '../lib/logger';

let prisma: PrismaClient;

declare global {
  // eslint-disable-next-line no-var
  var __db__: PrismaClient | undefined;
}

// Prevent multiple instances in development
if (process.env.NODE_ENV === 'production') {
  prisma = new PrismaClient();
} else {
  if (!global.__db__) {
    global.__db__ = new PrismaClient();
  }
  prisma = global.__db__;
}

// Query logging in development
if (process.env.NODE_ENV === 'development') {
  prisma.$connect().then(() => {
    logger.info('Database connected');
  });
}

export { prisma };
