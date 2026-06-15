import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const locale = request.cookies.get('locale')?.value || 'fr';
  const response = NextResponse.next();
  if (!request.cookies.has('locale')) {
    response.cookies.set('locale', 'fr', { path: '/', maxAge: 31536000 });
  }
  return response;
}
