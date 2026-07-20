import { Request, Response, NextFunction } from 'express';
import { logger } from '../lib/logger';
import { AuthenticatedRequest } from './auth';

const httpRequestsTotal = new Map<string, number>();
const httpRequestDuration = new Map<string, number[]>();
const dbQueryDuration: number[] = [];
const activeUsers = new Set<string>();

export function metricsMiddleware(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();
  const path = req.route?.path || req.path;
  const method = req.method;

  res.on('finish', () => {
    const duration = Date.now() - start;
    const key = `${method}:${path}:${res.statusCode}`;
    httpRequestsTotal.set(key, (httpRequestsTotal.get(key) || 0) + 1);

    const durations = httpRequestDuration.get(key) || [];
    durations.push(duration);
    httpRequestDuration.set(key, durations);

    const authReq = req as AuthenticatedRequest;
    if (authReq.user?.id) activeUsers.add(authReq.user.id);

    logger.debug('request_metric', { method, path, status: res.statusCode, duration });
  });

  next();
}

export function metricsHandler(_req: Request, res: Response) {
  const uptime = process.uptime();

  const metrics = [
    '# HELP http_requests_total Total HTTP requests',
    '# TYPE http_requests_total counter',
    ...[...httpRequestsTotal.entries()].map(
      ([key, count]) => `http_requests_total{route="${key}"} ${count}`
    ),
    '',
    '# HELP http_request_duration_seconds HTTP request duration buckets',
    '# TYPE http_request_duration_seconds histogram',
    ...[...httpRequestDuration.entries()].flatMap(([key, durations]) =>
      durations.map((d) => `http_request_duration_seconds{route="${key}"} ${d / 1000}`)
    ),
    '',
    '# HELP db_query_duration_seconds Database query duration',
    '# TYPE db_query_duration_seconds gauge',
    ...[...dbQueryDuration].map((d) => `db_query_duration_seconds ${d / 1000}`),
    '',
    '# HELP active_users Current active users count',
    '# TYPE active_users gauge',
    `active_users ${activeUsers.size}`,
    '',
    '# HELP process_uptime_seconds Process uptime',
    '# TYPE process_uptime_seconds gauge',
    `process_uptime_seconds ${uptime}`,
    '',
    '# HELP nodejs_heap_size_bytes Node.js heap size',
    '# TYPE nodejs_heap_size_bytes gauge',
    `nodejs_heap_size_bytes ${process.memoryUsage().heapUsed}`,
  ].join('\n');

  res.set('Content-Type', 'text/plain; charset=utf-8');
  res.status(200).send(metrics);
}

export function trackDbQuery(durationMs: number) {
  dbQueryDuration.push(durationMs);
  if (dbQueryDuration.length > 1000) dbQueryDuration.shift();
}
