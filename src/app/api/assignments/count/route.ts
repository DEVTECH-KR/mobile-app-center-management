// src/app/api/assignments/count/route.ts
import { NextResponse } from 'next/server';
import { AssignmentService } from '@/server/api/assignments/assignment.service';
import connectDB from '@/server/config/mongodb';

export async function GET(req: Request) {
  try {
    await connectDB();

    const url = new URL(req.url);
    const studentId = url.searchParams.get('studentId');
    
    if (!studentId) {
      return NextResponse.json({ error: 'Student ID is required' }, { status: 400 });
    }

    const count = await AssignmentService.getAssignedClassesCount(studentId);
    
    return NextResponse.json({ count });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}