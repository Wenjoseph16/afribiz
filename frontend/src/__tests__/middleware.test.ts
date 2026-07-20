/**
 * Tests unitaires pour les fonctions helper du middleware Next.js.
 *
 * On teste les fonctions pures exportées (isPublic, isAuthOnly, etc.)
 * qui ne nécessitent pas de mock de l'environnement Edge Runtime.
 *
 * Le test de la fonction middleware() complète nécessite un mock
 * de NextRequest/NextResponse qui peut être ajouté ultérieurement
 * avec un environnement d'intégration approprié.
 */

// Mock next/server AVANT les imports car jest.mock est hoisted
// Ce mock évite que l'import de NextResponse (Edge Runtime) ne casse
// l'environnement de test Jest.
jest.mock('next/server', () => {
  const stub = function () {
    return {};
  };
  const stubRedirect = function (url: string) {
    return { redirected: true, url: url };
  };
  return {
    NextResponse: {
      next: stub,
      redirect: stubRedirect,
    },
    NextRequest: stub,
  };
});

import { isPublic, isAuthOnly, isBusinessOnly, config } from '../middleware';

// ─── Config ───

describe('Middleware config', () => {
  it('should have a matcher defined as an array', () => {
    expect(config.matcher).toBeDefined();
    expect(Array.isArray(config.matcher)).toBe(true);
    expect(config.matcher.length).toBeGreaterThan(0);
  });
});

// ─── isPublic ───

describe('isPublic()', () => {
  it('returns true for root path', () => {
    expect(isPublic('/')).toBe(true);
  });

  it('returns true for login, signup, marketplace', () => {
    expect(isPublic('/login')).toBe(true);
    expect(isPublic('/signup')).toBe(true);
    expect(isPublic('/marketplace')).toBe(true);
  });

  it('returns true for all public routes', () => {
    const publicRoutes = [
      '/forgot-password',
      '/reset-password',
      '/verify-email',
      '/events',
      '/book',
      '/preview',
      '/about',
      '/contact',
      '/pricing',
      '/media',
      '/developers',
    ];
    publicRoutes.forEach(function (route) {
      expect(isPublic(route)).toBe(true);
    });
  });

  it('returns true for API and static routes', () => {
    expect(isPublic('/api')).toBe(true);
    expect(isPublic('/api/auth/login')).toBe(true);
    expect(isPublic('/_next')).toBe(true);
    expect(isPublic('/favicon')).toBe(true);
    expect(isPublic('/robots')).toBe(true);
  });

  it('returns false for dashboard and auth-only routes', () => {
    expect(isPublic('/dashboard')).toBe(false);
    expect(isPublic('/favorites')).toBe(false);
    expect(isPublic('/cart')).toBe(false);
    expect(isPublic('/checkout')).toBe(false);
  });

  it('returns false for nested dashboard routes', () => {
    expect(isPublic('/dashboard/products')).toBe(false);
    expect(isPublic('/dashboard/orders/123')).toBe(false);
  });

  it('returns false for nested favorites', () => {
    expect(isPublic('/favorites/my-items')).toBe(false);
  });
});

// ─── isAuthOnly ───

describe('isAuthOnly()', () => {
  it('returns true for dashboard and sub-routes', () => {
    expect(isAuthOnly('/dashboard')).toBe(true);
    expect(isAuthOnly('/dashboard/products')).toBe(true);
    expect(isAuthOnly('/dashboard/orders/123')).toBe(true);
  });

  it('returns true for favorites, cart, checkout', () => {
    expect(isAuthOnly('/favorites')).toBe(true);
    expect(isAuthOnly('/cart')).toBe(true);
    expect(isAuthOnly('/checkout')).toBe(true);
  });

  it('returns false for public routes', () => {
    expect(isAuthOnly('/')).toBe(false);
    expect(isAuthOnly('/login')).toBe(false);
    expect(isAuthOnly('/marketplace')).toBe(false);
    expect(isAuthOnly('/about')).toBe(false);
  });

  it('returns false for API routes', () => {
    expect(isAuthOnly('/api')).toBe(false);
    expect(isAuthOnly('/api/auth/login')).toBe(false);
  });
});

// ─── isBusinessOnly ───

describe('isBusinessOnly()', () => {
  it('returns true for business routes', () => {
    expect(isBusinessOnly('/business')).toBe(true);
    expect(isBusinessOnly('/business/my-slug')).toBe(true);
    expect(isBusinessOnly('/business/my-slug/products')).toBe(true);
  });

  it('returns false for non-business routes', () => {
    expect(isBusinessOnly('/')).toBe(false);
    expect(isBusinessOnly('/dashboard')).toBe(false);
    expect(isBusinessOnly('/marketplace')).toBe(false);
  });
});

// ─── Edge cases ───

describe('Edge cases', () => {
  it('handles double slashes gracefully', () => {
    // Les doubles slashes ne sont pas normalisés par le middleware
    // mais ne devraient pas crash
    expect(isPublic('//')).toBe(false);
    expect(isAuthOnly('//')).toBe(false);
  });

  it('handles empty string', () => {
    expect(isPublic('')).toBe(false);
    expect(isAuthOnly('')).toBe(false);
  });
});
