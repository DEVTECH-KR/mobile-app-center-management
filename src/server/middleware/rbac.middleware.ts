// src/server/middleware/rbac.middleware.ts
import { NextResponse } from 'next/server';
import { type NextRequest } from 'next/server';

export type AllowedRoles = 'admin' | 'teacher' | 'student';

export function rbacMiddleware(allowedRoles: AllowedRoles[]) {
  return async function(request: NextRequest) {
    try {
      const userRole = request.headers.get('userRole') as AllowedRoles;
      
      if (!userRole) {
        return NextResponse.json(
          { error: 'Unauthorized - No role provided' },
          { status: 401 }
        );
      }

      if (!allowedRoles.includes(userRole)) {
        return NextResponse.json(
          { error: 'Forbidden - Insufficient permissions' },
          { status: 403 }
        );
      }

      return NextResponse.next();
    } catch (error) {
      return NextResponse.json(
        { error: 'Authorization failed' },
        { status: 401 }
      );
    }
  };
}