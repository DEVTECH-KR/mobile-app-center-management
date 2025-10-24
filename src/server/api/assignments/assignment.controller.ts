import { NextResponse } from 'next/server';
import { AssignmentService } from './assignment.service';
import connectDB from '@/server/config/mongodb';
import { rbacMiddleware } from '@/server/middleware/rbac.middleware';

export async function getAssignment(req: Request) {
  try {
    await connectDB();
    
    const url = new URL(req.url);
    const studentId = url.searchParams.get('studentId');
    
    if (!studentId) {
      return NextResponse.json({ error: 'Student ID is required' }, { status: 400 });
    }

    const assignment = await AssignmentService.getAssignmentByStudentId(studentId);
    
    if (!assignment) {
      return NextResponse.json({ classes: [] });
    }

    return NextResponse.json({
      studentId: assignment.studentId,
      classes: assignment.classIds,
      assignedBy: assignment.assignedBy,
      assignedAt: assignment.assignedAt,
      updatedAt: assignment.updatedAt
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

export async function addClasses(req: Request) {
  try {
    await connectDB();
    
    // Check admin permissions
    const rbacCheck = await rbacMiddleware(['admin'])(req as any);
    if (rbacCheck.status !== 200) return rbacCheck;

    const body = await req.json();
    const { studentId, classIds, assignedBy } = body;

    if (!studentId) {
      return NextResponse.json({ error: 'Student ID is required' }, { status: 400 });
    }

    if (!classIds || !Array.isArray(classIds)) {
      return NextResponse.json({ error: 'classIds must be an array' }, { status: 400 });
    }

    if (!assignedBy) {
      return NextResponse.json({ error: 'assignedBy is required' }, { status: 400 });
    }

    const assignment = await AssignmentService.addClasses(studentId, classIds, assignedBy);
    
    return NextResponse.json({
      message: 'Classes assigned successfully',
      assignment: {
        studentId: assignment.studentId,
        classes: assignment.classIds,
        assignedBy: assignment.assignedBy,
        updatedAt: assignment.updatedAt
      }
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

export async function removeClasses(req: Request) {
  try {
    await connectDB();
    
    // Check admin permissions
    const rbacCheck = await rbacMiddleware(['admin'])(req as any);
    if (rbacCheck.status !== 200) return rbacCheck;

    const body = await req.json();
    const { studentId, classIds } = body;

    if (!studentId) {
      return NextResponse.json({ error: 'Student ID is required' }, { status: 400 });
    }

    const assignment = await AssignmentService.removeClasses(
      studentId, 
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

export async function getAllAssignments(req: Request) {
  try {
    await connectDB();
    
    // Check admin permissions
    const rbacCheck = await rbacMiddleware(['admin'])(req as any);
    if (rbacCheck.status !== 200) return rbacCheck;

    const url = new URL(req.url);
    const studentId = url.searchParams.get('studentId');
    const classId = url.searchParams.get('classId');

    const assignments = await AssignmentService.getAllAssignments({
      studentId: studentId || undefined,
      classId: classId || undefined
    });

    return NextResponse.json({ assignments });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}