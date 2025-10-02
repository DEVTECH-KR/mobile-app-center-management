// src/middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { authMiddleware } from '@/server/middleware/auth.middleware'; // FIXED: Use @/ alias for consistency (your tsconfig has it).

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // protège /api/* sauf endpoints publics explicitement listés
  if (
    pathname.startsWith('/api') &&
    !pathname.startsWith('/api/auth/login') &&
    !pathname.startsWith('/api/auth/register')
  ) {
    return authMiddleware(request);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/api/:path*'],
};
