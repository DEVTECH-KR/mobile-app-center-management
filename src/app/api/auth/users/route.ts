// src/app/api/auth/users/route.ts
import { NextResponse } from 'next/server';
import { AuthService } from '@/server/api/auth/auth.service';
import { rbacMiddleware } from '@/server/middleware/rbac.middleware';
import connectDB from '@/server/config/mongodb';

export async function GET(request: Request) {
  await connectDB();
  const { searchParams } = new URL(request.url);
  const filters = {
    name: searchParams.get('name') || undefined,
    email: searchParams.get('email') || undefined,
    role: searchParams.get('role') || undefined,
    status: searchParams.get('status') || undefined,
    classId: searchParams.get('classId') || undefined,
    promotion: searchParams.get('promotion') || undefined,
  };
  const pagination = {
    page: parseInt(searchParams.get('page') || '1'),
    limit: parseInt(searchParams.get('limit') || '10'),
    sortBy: searchParams.get('sortBy') || 'name',
    sortOrder: (searchParams.get('sortOrder') as 'asc' | 'desc') || 'asc',
  };

  const rbacCheck = await rbacMiddleware(['admin'])(request as any);
  if (rbacCheck.status !== 200) {
    return rbacCheck;
  }

  try {
    const result = await AuthService.getAll(filters, pagination);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}