// src/server/api/enrollments/enrollment.controller.ts
import { NextResponse } from 'next/server';
import { EnrollmentService } from './enrollment.service';
import { rbacMiddleware } from '@/server/middleware/rbac.middleware';
import { type AllowedRoles } from '@/server/middleware/rbac.middleware';

// Student can create and view their own requests
export async function POST(request: Request) {
  const rbacCheck = await rbacMiddleware(['student'])(request as any);
  if (rbacCheck.status !== 200) {
    return rbacCheck;
  }

  try {
    const { studentId, courseId } = await request.json();
    const enrollmentRequest = await EnrollmentService.createRequest(studentId, courseId);
    return NextResponse.json(enrollmentRequest, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: error.message.includes('already') ? 400 : 500 }
    );
  }
}

// Students can view their own, admin can view all
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const studentId = searchParams.get('studentId');
  const status = searchParams.get('status') as 'pending' | 'approved' | 'rejected' | undefined;
  const courseId = searchParams.get('courseId') || undefined;

  // If studentId is provided, only allow that student or admin
  const allowedRoles: AllowedRoles[] = studentId ? ['admin', 'student'] : ['admin'];
  const rbacCheck = await rbacMiddleware(allowedRoles)(request as any);
  if (rbacCheck.status !== 200) {
    return rbacCheck;
  }

  try {
    if (studentId) {
      const requests = await EnrollmentService.getStudentRequests(studentId);
      return NextResponse.json(requests);
    }

    const requests = await EnrollmentService.getAllRequests({ 
      ...(status && { status }), 
      ...(courseId && { courseId }) 
    });
    return NextResponse.json(requests);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

// Only admin can approve requests
export async function approve(request: Request) {
  const rbacCheck = await rbacMiddleware(['admin'])(request as any);
  if (rbacCheck.status !== 200) {
    return rbacCheck;
  }

  try {
    const { requestId, classId, adminNotes } = await request.json();
    const updatedRequest = await EnrollmentService.approveRequest(requestId, {
      classId,
      adminNotes
    });
    return NextResponse.json(updatedRequest);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 400 }
    );
  }
}

// Only admin can reject requests
export async function reject(request: Request) {
  const rbacCheck = await rbacMiddleware(['admin'])(request as any);
  if (rbacCheck.status !== 200) {
    return rbacCheck;
  }

  try {
    const { requestId, adminNotes } = await request.json();
    const updatedRequest = await EnrollmentService.rejectRequest(requestId, adminNotes);
    return NextResponse.json(updatedRequest);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 400 }
    );
  }
}

// Only admin can record payments
export async function recordPayment(request: Request) {
  const rbacCheck = await rbacMiddleware(['admin'])(request as any);
  if (rbacCheck.status !== 200) {
    return rbacCheck;
  }

  try {
    const { requestId } = await request.json();
    const updatedRequest = await EnrollmentService.recordPayment(requestId);
    return NextResponse.json(updatedRequest);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 400 }
    );
  }
}

// Admin only statistics
export async function getStatistics(request: Request) {
  const rbacCheck = await rbacMiddleware(['admin'])(request as any);
  if (rbacCheck.status !== 200) {
    return rbacCheck;
  }

  try {
    const stats = await EnrollmentService.getStatistics();
    return NextResponse.json(stats);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

// Vérifier le statut d’un étudiant pour un cours
export async function getCourseStatus(request: Request) {
  const { searchParams } = new URL(request.url);
  const studentId = searchParams.get("studentId");
  const courseId = searchParams.get("courseId");

  if (!studentId || !courseId) {
    return NextResponse.json(
      { error: "studentId and courseId are required" },
      { status: 400 }
    );
  }

  // Seul l’étudiant concerné ou un admin peut voir ça
  const rbacCheck = await rbacMiddleware(["student", "admin"])(request as any);
  if (rbacCheck.status !== 200) {
    return rbacCheck;
  }

  try {
    const status = await EnrollmentService.getCourseStatus(studentId, courseId);
    return NextResponse.json(status);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
