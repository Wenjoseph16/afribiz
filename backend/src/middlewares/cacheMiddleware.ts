import { Request, Response, NextFunction } from 'express';
import { cache, CacheTTL } from '../lib/cache';

// ============================================
// Express Cache Middleware
// Caches GET responses with configurable TTL.
// Bypassed when cache=refresh query param is set.
// ============================================

interface CacheMiddlewareOptions {
  /** Cache key prefix (e.g., 'marketplace') */
  prefix: string;
  /** TTL in milliseconds */
  ttl?: number;
  /** Extract cache key suffix from request (default: req.originalUrl) */
  keyFrom?: (req: Request) => string;
}

/**
 * Middleware factory: caches GET responses.
 * Usage: router.get('/search', cacheResponse({ prefix: 'marketplace', ttl: 30000 }), controller)
 */
export function cacheResponse(options: CacheMiddlewareOptions) {
  const { prefix, ttl = CacheTTL.SHORT, keyFrom } = options;

  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      next();
      return;
    }

    // Allow bypass with ?cache=refresh
    if (req.query.cache === 'refresh') {
      next();
      return;
    }

    // Clé par défaut : URL + identité quand elle existe. Sans cela, un endpoint
    // authentifié (ex. /afriscore/mine) serait mis en cache une fois pour TOUS les
    // utilisateurs → fuite de données cross-compte (score d'un autre business).
    const reqAny = req as any;
    const identity = reqAny.user?.id || reqAny.partner?.id || '';
    const defaultKey = identity ? `${req.originalUrl}::${identity}` : req.originalUrl;
    const cacheKey = `${prefix}:${keyFrom ? keyFrom(req) : defaultKey}`;

    try {
      const cached = await cache.get<any>(cacheKey);
      if (cached !== null) {
        res.json(cached);
        return;
      }
    } catch {
      // Cache miss or error — proceed normally
    }

    // Override res.json to cache the response (only 2xx responses)
    const originalJson = res.json.bind(res);
    const originalStatus = res.status.bind(res);
    let statusCode = 200;
    res.status = function (code: number): Response {
      statusCode = code;
      return originalStatus(code);
    };
    res.json = function (body: unknown): Response {
      if (statusCode >= 200 && statusCode < 300) {
        cache.set(cacheKey, body, ttl).catch(() => {});
      }
      return originalJson(body);
    };

    next();
  };
}

/**
 * Invalidate all cache entries matching a prefix pattern.
 * Call this in POST/PUT/DELETE handlers when data changes.
 */
export function invalidateCache(pattern: string) {
  return async (_req: Request, _res: Response, next: NextFunction): Promise<void> => {
    await cache.invalidate(`${pattern}:*`).catch(() => {});
    next();
  };
}
