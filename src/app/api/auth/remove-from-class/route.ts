// src/app/api/auth/remove-from-class/route.ts
import { NextResponse } from 'next/server';
import { AuthService } from '@/server/api/auth/auth.service';
import connectDB from '@/server/config/mongodb';

export async function PUT(req: Request) {
  try {
    await connectDB();
    const { userId, classId } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    if (!classId) {
      return NextResponse.json({ error: 'Class ID is required' }, { status: 400 });
    }

    const updated = await AuthService.removeFromClass(userId, classId);
    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}