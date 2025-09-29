import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { authMiddleware } from '@/server/middleware/auth.middleware';

export async function middleware(request: NextRequest) {
  // Protect all routes under /api except auth endpoints
  if (request.nextUrl.pathname.startsWith('/api') &&
      !request.nextUrl.pathname.startsWith('/api/auth/login') &&
      !request.nextUrl.pathname.startsWith('/api/auth/register')) {
    return authMiddleware(request);
  }

  return NextResponse.next();
}

export const config = {
  matcher: '/api/:path*',
};