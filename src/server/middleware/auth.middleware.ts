
// // src/server/middleware/auth.middleware.ts
// import { NextResponse } from 'next/server';
// import type { NextRequest } from 'next/server';
// import { jwtVerify, type JWTPayload as JosePayload } from 'jose';

// const JWT_SECRET = process.env.JWT_SECRET ?? '';

// export interface JWTPayload {
//   userId?: string;
//   email?: string;
//   role?: string;
// }

// export async function authMiddleware(request: NextRequest) {
//   try {
//     const authHeader = request.headers.get('authorization') ?? '';
//     console.log('Middleware: Received auth header:', authHeader ? 'Present' : 'Missing');

//     if (!authHeader || !authHeader.startsWith('Bearer ')) {
//       console.log('Middleware: Invalid header format');
//       return NextResponse.json({ error: 'Unauthorized: No token provided' }, { status: 401 });
//     }

//     const token = authHeader.substring(7);
//     console.log('Middleware: Token:', token);

//     if (!JWT_SECRET) {
//       console.error('JWT_SECRET is not defined in env');
//       return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
//     }

//     // jose attend une clé (Uint8Array pour HS256)
//     const secret = new TextEncoder().encode(JWT_SECRET);

//     // Vérifie le token (supporte HS256 si tu as signé avec HS256)
//     const { payload } = await jwtVerify(token, secret);

//     // extrais les claims attendus (userId / role)
//     const userId = typeof (payload as any).userId === 'string' ? (payload as any).userId : (payload.sub as string | undefined) ?? '';
//     const role = typeof (payload as any).role === 'string' ? (payload as any).role : '';

//     if (!userId || !role) {
//       return NextResponse.json({ error: 'Unauthorized: invalid token payload' }, { status: 401 });
//     }

//     console.log('Middleware: Decoded userId:', userId);

//     // Ajoute les headers userId / userRole pour les handlers suivants
//     const requestHeaders = new Headers(request.headers);
//     if (userId) requestHeaders.set('userId', userId);
//     if (role) requestHeaders.set('userRole', role);

//     console.log('Middleware triggered for:', request.url);

//     return NextResponse.next({
//       request: {
//         headers: requestHeaders,
//       },
//     });
//   } catch (error: any) {
//     console.error('Middleware verify error details:', {
//       message: error?.message ?? error,
//       name: error?.name,
//     });
//     return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
//   }
// }

// src/server/middleware/auth.middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET = process.env.JWT_SECRET ?? '';

export interface JWTPayload {
  userId?: string;
  email?: string;
  role?: string;
}

export async function authMiddleware(request: NextRequest) {
  try {
    // 1️⃣ Récupérer le token depuis le header Authorization
    let token = request.headers.get('authorization')?.replace('Bearer ', '');

    // 2️⃣ Si aucun header, essayer de le récupérer depuis les cookies
    if (!token) {
      token = request.cookies.get('token')?.value;
      if (token) console.log('Middleware: Token found in cookie');
    }

    console.log('Middleware: Token:', token ?? 'Missing');

    if (!token) {
      console.log('Middleware: No token provided');
      return NextResponse.json({ error: 'Unauthorized: No token provided' }, { status: 401 });
    }

    if (!JWT_SECRET) {
      console.error('JWT_SECRET is not defined in env');
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    // jose attend une clé (Uint8Array pour HS256)
    const secret = new TextEncoder().encode(JWT_SECRET);

    // Vérifie le token (supporte HS256 si tu as signé avec HS256)
    const { payload } = await jwtVerify(token, secret);

    // extrais les claims attendus (userId / role)
    const userId = typeof (payload as any).userId === 'string' ? (payload as any).userId : (payload.sub as string | undefined) ?? '';
    const role = typeof (payload as any).role === 'string' ? (payload as any).role : '';

    if (!userId || !role) {
      return NextResponse.json({ error: 'Unauthorized: invalid token payload' }, { status: 401 });
    }

    console.log('Middleware: Decoded userId:', userId);

    // Ajoute les headers userId / userRole pour les handlers suivants
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('userId', userId);
    requestHeaders.set('userRole', role);

    console.log('Middleware triggered for:', request.url);

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  } catch (error: any) {
    console.error('Middleware verify error details:', {
      message: error?.message ?? error,
      name: error?.name,
    });
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }
}
