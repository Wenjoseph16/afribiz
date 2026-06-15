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

    const cacheKey = `${prefix}:${keyFrom ? keyFrom(req) : req.originalUrl}`;

    try {
      const cached = await cache.get<any>(cacheKey);
      if (cached !== null) {
        res.json(cached);
        return;
      }
    } catch {
      // Cache miss or error — proceed normally
    }

    // Override res.json to cache the response
    const originalJson = res.json.bind(res);
    res.json = function (body: any): Response {
      // Cache the response asynchronously (don't await — non-blocking)
      cache.set(cacheKey, body, ttl).catch(() => {});
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
