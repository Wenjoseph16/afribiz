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

// Soft-delete middleware: auto-filter deletedAt: null on find/count operations
// Seuls les modèles qui ont une colonne deletedAt dans le schéma Prisma doivent être listés ici
const SOFT_DELETE_MODELS = new Set([
  'ServiceCategory',
  'ProductCategory',
  'MenuCategory',
  'Rental',
  'Post',
  'Training',
  'BusinessDocument',
]);

prisma.$use(async (params, next) => {
  const { model, action } = params;
  let { args } = params;
  if (!model || !SOFT_DELETE_MODELS.has(model)) return next(params);

  const isQuery = ['findUnique', 'findFirst', 'findMany', 'count', 'aggregate'].includes(action);
  const isMutation = ['update', 'updateMany', 'delete', 'deleteMany'].includes(action);

  // Certains appels (ex: count() sans argument) passent args === undefined → on initialise
  if (isQuery || isMutation) {
    if (!args) args = {};
    if (args.where === undefined) args.where = {};
    if (args.where.deletedAt === undefined) {
      args.where.deletedAt = null;
    }
    params.args = args;
  }

  return next(params);
});

if (process.env.NODE_ENV === 'development') {
  prisma.$connect().catch((error) => {
    logger.warn(
      `Database unavailable at startup: ${error instanceof Error ? error.message : String(error)}`
    );
  });
}

export { prisma };
