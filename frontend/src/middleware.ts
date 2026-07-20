import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// ─── Route configuration ───

const PUBLIC_ROUTES = [
  '/',
  '/login',
  '/signup',
  '/forgot-password',
  '/reset-password',
  '/verify-email',
  '/marketplace',
  '/events',
  '/book',
  '/preview',
  '/about',
  '/contact',
  '/pricing',
  '/media',
  '/developers',
  '/api',
  '/_next',
  '/favicon',
  '/robots',
  '/sitemap',
] as const;

const AUTH_ONLY_ROUTES = ['/dashboard', '/favorites', '/cart', '/checkout'] as const;

const BUSINESS_ROUTES = ['/business'] as const;

const ADMIN_ROUTES = ['/admin'] as const;

// ─── Route matchers ───

/**
 * Enhanced matcher with built-in exact-route check for '/' and wildcard support.
 * Example: '/business/*' matches '/business/123' and '/business/123/products'.
 */
function matchesPattern(pathname: string, pattern: string): boolean {
  if (pattern.endsWith('/*')) {
    const base = pattern.slice(0, -2); // Remove trailing /*
    return pathname === base || pathname.startsWith(base + '/');
  }
  // Pour '/', on exige une égalité exacte, sinon '//' ou '/dashboard' serait matché
  if (pattern === '/') return pathname === '/';
  return pathname === pattern || pathname.startsWith(pattern + '/');
}

export function isPublic(pathname: string): boolean {
  return PUBLIC_ROUTES.some((route) => matchesPattern(pathname, route));
}

export function isAuthOnly(pathname: string): boolean {
  return AUTH_ONLY_ROUTES.some((route) => matchesPattern(pathname, route));
}

export function isBusinessOnly(pathname: string): boolean {
  return BUSINESS_ROUTES.some((route) => matchesPattern(pathname, route));
}

export function isAdminOnly(pathname: string): boolean {
  return ADMIN_ROUTES.some((route) => matchesPattern(pathname, route));
}

// ─── Middleware ───

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const response = NextResponse.next();

  const accessToken = request.cookies.get('accessToken')?.value;
  const isAuthenticated = !!accessToken;

  // Redirect unauthenticated users from auth-only pages to login
  if (!isAuthenticated && isAuthOnly(pathname)) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Redirect authenticated users away from public auth pages
  if (isAuthenticated && (pathname === '/login' || pathname === '/signup')) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)'],
};
