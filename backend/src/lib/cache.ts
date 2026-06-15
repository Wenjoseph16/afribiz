import { logger } from './logger';

// ============================================
// Cache Manager
// Redis-backed with in-memory fallback.
// Activated when REDIS_URL is set in env.
// ============================================

interface CacheEntry {
  data: string;
  expiresAt: number;
}

class MemoryCache {
  private store = new Map<string, CacheEntry>();
  private cleanupInterval: ReturnType<typeof setInterval>;

  constructor() {
    // Cleanup expired entries every 60s
    this.cleanupInterval = setInterval(() => this.cleanup(), 60_000);
  }

  async get(key: string): Promise<string | null> {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }
    return entry.data;
  }

  async set(key: string, value: string, ttlMs: number): Promise<void> {
    this.store.set(key, { data: value, expiresAt: Date.now() + ttlMs });
  }

  async del(pattern: string): Promise<void> {
    // Support glob-style deletion (e.g., "cache:marketplace:*")
    if (pattern.endsWith('*')) {
      const prefix = pattern.slice(0, -1);
      for (const key of this.store.keys()) {
        if (key.startsWith(prefix)) this.store.delete(key);
      }
    } else {
      this.store.delete(pattern);
    }
  }

  async flush(): Promise<void> {
    this.store.clear();
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (now > entry.expiresAt) this.store.delete(key);
    }
  }

  destroy(): void {
    clearInterval(this.cleanupInterval);
    this.store.clear();
  }
}

type CacheClient = {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, ttlMs: number): Promise<void>;
  del(pattern: string): Promise<void>;
  flush(): Promise<void>;
};

let client: CacheClient;
let redisClient: any = null;

/**
 * Initialize the cache client.
 * Uses Redis if REDIS_URL is set, otherwise falls back to in-memory cache.
 */
export async function initCache(redisUrl?: string): Promise<void> {
  if (redisUrl && redisUrl.length > 0) {
    try {
      const Redis = (await import('ioredis')).default;
      redisClient = new Redis(redisUrl, {
        maxRetriesPerRequest: 3,
        retryStrategy(times: number) {
          if (times > 3) return null;
          return Math.min(times * 200, 2000);
        },
        lazyConnect: true,
      });

      await redisClient.connect();

      client = {
        async get(key: string): Promise<string | null> {
          return redisClient.get(key);
        },
        async set(key: string, value: string, ttlMs: number): Promise<void> {
          await redisClient.set(key, value, 'PX', ttlMs);
        },
        async del(pattern: string): Promise<void> {
          if (pattern.endsWith('*')) {
            const keys = await redisClient.keys(pattern);
            if (keys.length > 0) await redisClient.del(...keys);
          } else {
            await redisClient.del(pattern);
          }
        },
        async flush(): Promise<void> {
          await redisClient.flushdb();
        },
      };

      logger.info('🚀 Cache: Redis connecté');
    } catch (err) {
      logger.warn(`⚠️  Cache: Redis indisponible (${(err as Error).message}), utilisation du cache mémoire`);
      client = new MemoryCache();
    }
  } else {
    client = new MemoryCache();
    logger.info('📦 Cache: Mémoire (Redis non configuré)');
  }
}

/** Cache key prefix constants */
export const CacheKeys = {
  marketplace: (q: string) => `cache:marketplace:${q}`,
  trending: 'cache:marketplace:trending',
} as const;

/** Default TTLs in milliseconds */
export const CacheTTL = {
  SHORT: 30_000,   // 30s — search results (freshness matters)
  MEDIUM: 300_000, // 5min — trending, categories
  LONG: 3600_000,  // 1h — static data
} as const;

// Export cache client functions
export const cache = {
  async get<T>(key: string): Promise<T | null> {
    const raw = await client.get(key);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  },

  async set<T>(key: string, value: T, ttlMs: number = CacheTTL.MEDIUM): Promise<void> {
    await client.set(key, JSON.stringify(value), ttlMs);
  },

  /** Invalidate by key or prefix pattern */
  async invalidate(pattern: string): Promise<void> {
    await client.del(pattern);
  },

  /** Flush all cache */
  async flush(): Promise<void> {
    await client.flush();
  },
};
