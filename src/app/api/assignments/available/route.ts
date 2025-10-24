// src/app/api/assignments/available/route.ts
import { NextResponse } from 'next/server';
import { AssignmentService } from '@/server/api/assignments/assignment.service';
import connectDB from '@/server/config/mongodb';
import { rbacMiddleware } from '@/server/middleware/rbac.middleware';

export async function GET(req: Request) {
  try {
    await connectDB();
    
    // Check admin permissions
    const rbacCheck = await rbacMiddleware(['admin'])(req as any);
    if (rbacCheck.status !== 200) return rbacCheck;

    const url = new URL(req.url);
    const studentId = url.searchParams.get('studentId');
    
    if (!studentId) {
      return NextResponse.json({ error: 'Student ID is required' }, { status: 400 });
    }

    const availableClasses = await AssignmentService.getAvailableClasses(studentId);
    
    return NextResponse.json({ availableClasses });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}