// src/app/api/auth/users/route.ts
import { NextResponse } from 'next/server';
import { UserModel } from '@/server/api/models';
import { rbacMiddleware } from '@/server/middleware/rbac.middleware';
import connectDB from '@/server/config/mongodb';

export async function GET(request: Request) {
  await connectDB();
  const { searchParams } = new URL(request.url);
  const role = searchParams.get('role');

  console.log('Route getUsers: Query:', { role }); // Debug log

  const rbacCheck = await rbacMiddleware(['admin'])(request as any);
  if (rbacCheck.status !== 200) {
    return rbacCheck;
  }

  try {
    const query = role ? { role } : {};
    const users = await UserModel.find(query).select('-password').lean();
    console.log('Route getUsers: Found:', users.length); // Debug log
    return NextResponse.json(users);
  } catch (error: any) {
    console.error('Route getUsers error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}