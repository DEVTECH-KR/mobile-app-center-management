// src/app/api/auth/users/[id]/route.ts
import { NextResponse } from 'next/server';
import { AuthService } from '@/server/api/auth/auth.service';
import { rbacMiddleware } from '@/server/middleware/rbac.middleware';
import connectDB from '@/server/config/mongodb';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  await connectDB();
  const rbacCheck = await rbacMiddleware(['admin'])(request as any);
  if (rbacCheck.status !== 200) {
    return rbacCheck;
  }

  try {
    const { id } = await params;
    const user = await AuthService.getProfile(id);
    return NextResponse.json(user);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: error.message.includes('not found') ? 404 : 500 });
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  await connectDB();
  const rbacCheck = await rbacMiddleware(['admin'])(request as any);
  if (rbacCheck.status !== 200) {
    return rbacCheck;
  }

  try {
    const { id } = await params;
    const body = await request.json();
    const { role, status, name, email, ...otherData } = body;
    
    console.log('PUT request data:', { id, body });
    
    // Handle role/status updates
    if (role !== undefined || status !== undefined) {
      console.log('Updating role/status:', { role, status });
      await AuthService.updateRoleAndStatus(id, { role, status });
    }
    
    // Handle profile updates (name, email, etc.) - use the new admin method
    if (name !== undefined || email !== undefined || Object.keys(otherData).length > 0) {
      console.log('Updating profile:', { name, email, otherData });
      await AuthService.updateUserByAdmin(id, { name, email, ...otherData });
    }
    
    // Return the updated user
    const updatedUser = await AuthService.getProfile(id);
    console.log('Updated user:', updatedUser);
    return NextResponse.json(updatedUser);
  } catch (error: any) {
    console.error('PUT /api/auth/users/[id] error:', error);
    return NextResponse.json({ error: error.message }, { status: error.message.includes('not found') ? 404 : 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  await connectDB();
  const rbacCheck = await rbacMiddleware(['admin'])(request as any);
  if (rbacCheck.status !== 200) {
    return rbacCheck;
  }

  try {
    const { id } = await params;
    const user = await AuthService.delete(id);
    return NextResponse.json({ message: 'User deleted successfully', user });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: error.message.includes('not found') ? 404 : 500 });
  }
}