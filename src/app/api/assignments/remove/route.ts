// src/app/api/assignments/remove/route.ts
import { NextResponse } from 'next/server';
import { AssignmentService } from '@/server/api/assignments/assignment.service';
import connectDB from '@/server/config/mongodb';
import { rbacMiddleware } from '@/server/middleware/rbac.middleware';

export async function PUT(req: Request) {
  try {
    await connectDB();
    
    // Check admin permissions
    const rbacCheck = await rbacMiddleware(['admin'])(req as any);
    if (rbacCheck.status !== 200) return rbacCheck;

    const body = await req.json();
    const { userId, classIds } = body;

    if (!userId) {
      return NextResponse.json({ error: 'Student ID is required' }, { status: 400 });
    }

    const assignment = await AssignmentService.removeClasses(
      userId, 
      classIds || []
    );
    
    return NextResponse.json({
      message: classIds && classIds.length > 0 
        ? 'Classes removed successfully' 
        : 'All classes removed successfully',
      assignment: {
        studentId: assignment.studentId,
        classes: assignment.classIds,
        updatedAt: assignment.updatedAt
      }
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}