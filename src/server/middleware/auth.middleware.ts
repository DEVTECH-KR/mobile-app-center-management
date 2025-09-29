import { NextResponse } from 'next/server';
import { type NextRequest } from 'next/server';
import * as jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET as string;

export interface JWTPayload {
  userId: string;
  email: string;
  role: string;
}

export async function authMiddleware(request: NextRequest) {
  try {
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json(
        { error: 'No token provided' },
        { status: 401 }
      );
    }

    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
    
    // Clone the request and add user info to headers
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('userId', decoded.userId);
    requestHeaders.set('userRole', decoded.role);

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Invalid token' },
      { status: 401 }
    );
  }
}