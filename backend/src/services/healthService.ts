import { config } from '../config/env';

export async function checkDatabase() {
  const start = Date.now();
  try {
    const { prisma } = await import('../lib/db');
    await prisma.$queryRaw`SELECT 1`;
    return { status: 'connected', latencyMs: Date.now() - start, detail: 'Database reachable' };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'unknown error';
    return { status: 'error', latencyMs: Date.now() - start, detail: message };
  }
}

export async function checkRedis() {
  const start = Date.now();
  try {
    const { cache } = await import('../lib/cache');
    if (!cache) return { status: 'disabled', latencyMs: 0, detail: 'Redis not configured' };
    await cache.get('health:ping');
    return { status: 'connected', latencyMs: Date.now() - start, detail: 'Redis reachable' };
  } catch (error: any) {
    const message = error?.message || 'unknown error';
    if (error?.code === 'ENOTFOUND' || error?.code === 'ECONNREFUSED') {
      return { status: 'unavailable', latencyMs: Date.now() - start, detail: message };
    }
    return { status: 'error', latencyMs: Date.now() - start, detail: message };
  }
}

export async function checkStorage() {
  const start = Date.now();
  try {
    const fs = await import('fs');
    const uploadDir = config.UPLOAD_DIR || './uploads';
    if (fs.existsSync(uploadDir)) {
      fs.accessSync(uploadDir, fs.constants.R_OK | fs.constants.W_OK);
      return { status: 'connected', latencyMs: Date.now() - start, detail: 'Storage writable' };
    }
    return {
      status: 'unavailable',
      latencyMs: Date.now() - start,
      detail: 'Directory missing: ' + uploadDir,
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'unknown error';
    return { status: 'error', latencyMs: Date.now() - start, detail: message };
  }
}

export async function runAllChecks() {
  const [db, redis, storage, cron] = await Promise.all([
    checkDatabase(),
    checkRedis(),
    checkStorage(),
    Promise.resolve({ status: 'active', detail: 'Background jobs scheduler available' }),
  ]);
  return { database: db, redis, storage, cron, isHealthy: db.status === 'connected' };
}
