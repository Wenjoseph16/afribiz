/**
 * Route Factory — Standardized route creation (P47)
 *
 * Usage:
 *   import { createRouter } from '../middlewares/createRouter';
 *   const router = createRouter({ prefix: 'products', requireAuth: true });
 *   router.get('/', listProducts, { cache: { ttl: 60000 } });
 */
import { Router, Request, Response, NextFunction } from 'express';
import { authMiddleware } from './auth';
import { requireRole } from './auth';
import { cacheResponse } from './cacheMiddleware';
import { validateBody, validateQuery } from './validators';
import { catchAsyncErrors } from './errorHandler';

export interface RouteOptions {
  /** Route prefix (e.g., 'products') */
  prefix?: string;
  /** Require authentication */
  requireAuth?: boolean;
  /** Required roles (e.g., ['BUSINESS', 'ADMIN']) */
  roles?: string[];
}

export interface HandlerOptions {
  /** Zod schema for body validation */
  bodySchema?: any;
  /** Zod schema for query validation */
  querySchema?: any;
  /** Cache TTL in ms */
  cache?: { ttl: number; prefix?: string };
}

export function createRouter(options: RouteOptions = {}) {
  const router = addRouteHelpers(Router());

  // Apply auth middleware if required
  if (options.requireAuth) {
    router.use(authMiddleware);
  }

  // Apply role middleware if required
  if (options.roles && options.roles.length > 0) {
    router.use(requireRole(options.roles as any));
  }

  return router;
}

type Fn = (...args: any[]) => any;

function wrapHandler(handler: Fn, opts?: HandlerOptions) {
  let wrapped = catchAsyncErrors(handler as any);

  if (opts?.cache) {
    const cacheMw = cacheResponse({ prefix: opts.cache.prefix || 'api', ttl: opts.cache.ttl });
    const original = wrapped;
    wrapped = ((req: Request, res: Response, next: NextFunction) => {
      cacheMw(req, res, () => original(req, res, next));
    }) as any;
  }

  return wrapped;
}

// Add typed route helpers to a router instance (preferred over prototype extension)
function addRouteHelpers(router: Router) {
  (router as any).pget = function (path: string, handler: Fn, opts?: HandlerOptions) {
    return router.get(path, wrapHandler(handler, opts));
  };
  (router as any).ppost = function (path: string, handler: Fn, opts?: HandlerOptions) {
    const middlewares: any[] = [];
    if (opts?.bodySchema) middlewares.push(validateBody(opts.bodySchema));
    return router.post(path, ...middlewares, wrapHandler(handler, opts));
  };
  (router as any).pput = function (path: string, handler: Fn, opts?: HandlerOptions) {
    const middlewares: any[] = [];
    if (opts?.bodySchema) middlewares.push(validateBody(opts.bodySchema));
    return router.put(path, ...middlewares, wrapHandler(handler, opts));
  };
  (router as any).ppatch = function (path: string, handler: Fn, opts?: HandlerOptions) {
    const middlewares: any[] = [];
    if (opts?.bodySchema) middlewares.push(validateBody(opts.bodySchema));
    return router.patch(path, ...middlewares, wrapHandler(handler, opts));
  };
  (router as any).pdelete = function (path: string, handler: Fn, opts?: HandlerOptions) {
    return router.delete(path, wrapHandler(handler, opts));
  };
  return router;
}

export { addRouteHelpers };
export default createRouter;
