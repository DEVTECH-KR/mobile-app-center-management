// // src/server/middleware/auth.middleware.ts
// import { NextResponse } from 'next/server';
// import { type NextRequest } from 'next/server';
// import * as jwt from 'jsonwebtoken';

// const JWT_SECRET = process.env.JWT_SECRET as string;

// export interface JWTPayload {
//   userId: string;
//   email: string;
//   role: string;
// }

// export async function authMiddleware(request: NextRequest) {
//   try {
//     const authHeader = request.headers.get('Authorization');
//     console.log('Middleware: Received auth header:', authHeader ? 'Present' : 'Missing'); 

//     if (!authHeader || !authHeader.startsWith('Bearer ')) {
//       console.log('Middleware: Invalid header format');
//       return NextResponse.json(
//         { error: 'No token provided' },
//         { status: 401 }
//       );
//     }

//     const token = authHeader.substring(7);
//     console.log('Middleware: Token length:', token.length); 

//     const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
//     console.log('Middleware: Decoded userId:', decoded.userId); 
    
//     // Clone the request and add user info to headers
//     const requestHeaders = new Headers(request.headers);
//     requestHeaders.set('userId', decoded.userId);
//     requestHeaders.set('userRole', decoded.role);

//     console.log('Middleware triggered for:', request.url);

//     return NextResponse.next({
//       request: {
//         headers: requestHeaders,
//       },
//     });
//   } catch (error: any) {
//     console.error('Middleware verify error details:', {
//       message: error.message,
//       name: error.name,
//       code: error.code, 
//     }); 
//     return NextResponse.json(
//       { error: 'Invalid token' },
//       { status: 401 }
//     );
//   }
// }

// src/server/middleware/auth.middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify, type JWTPayload as JosePayload } from 'jose';

const JWT_SECRET = process.env.JWT_SECRET ?? '';

export interface JWTPayload {
  userId?: string;
  email?: string;
  role?: string;
  // jose peut aussi exposer d'autres claims
}

export async function authMiddleware(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization') ?? '';
    console.log('Middleware: Received auth header:', authHeader ? 'Present' : 'Missing');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('Middleware: Invalid header format');
      return NextResponse.json({ error: 'No token provided' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    console.log('Middleware: Token length:', token.length);

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

    console.log('Middleware: Decoded userId:', userId);

    // Ajoute les headers userId / userRole pour les handlers suivants
    const requestHeaders = new Headers(request.headers);
    if (userId) requestHeaders.set('userId', userId);
    if (role) requestHeaders.set('userRole', role);

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
