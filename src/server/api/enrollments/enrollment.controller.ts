// src/server/api/enrollments/enrollment.controller.ts
import { NextResponse } from 'next/server';
import { EnrollmentService } from './enrollment.service';
import { rbacMiddleware } from '@/server/middleware/rbac.middleware';
import { type AllowedRoles } from '@/server/middleware/rbac.middleware';
import { z } from 'zod';

const EnrollmentSchema = z.object({
  courseId: z.string(),
  preferredLevel: z.string().optional(),
  userId: z.string().optional(),
  status: z.enum(['pending', 'approved', 'rejected']).optional(),
});

// Student can create and view their own requests
export async function POST(request: Request) {
  const rbacCheck = await rbacMiddleware(['student'])(request as any);
  if (rbacCheck.status !== 200) {
    return rbacCheck;
  }

  try {
    const { studentId, courseId, preferredLevel } = await request.json();
    console.log('Controller POST enrollment: Request body:', { studentId, courseId, preferredLevel });
    const enrollmentRequest = await EnrollmentService.createRequest(studentId, courseId, preferredLevel);
    return NextResponse.json(enrollmentRequest, { status: 201 });
  } catch (error: any) {
    console.error('Controller POST enrollment error:', error);
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
  const month = searchParams.get('month');
  const year = searchParams.get('year');

  console.log('Controller GET enrollments: Query:', { studentId, status, courseId, month, year });

  // If studentId is provided, only allow that student or admin
  const allowedRoles: AllowedRoles[] = studentId ? ['admin', 'student'] : ['admin'];
  const rbacCheck = await rbacMiddleware(allowedRoles)(request as any);
  if (rbacCheck.status !== 200) {
    return rbacCheck;
  }

  try {
    let requests;
    if (studentId) {
      requests = await EnrollmentService.getStudentRequests(studentId);
    } else {
      // ✅ Gestion des filtres par date
      let dateFrom: Date | undefined;
      let dateTo: Date | undefined;
      
      if (month && year && month !== 'all' && year !== 'all') {
        // Premier jour du mois
        dateFrom = new Date(parseInt(year), parseInt(month) - 1, 1);
        // Dernier jour du mois
        dateTo = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59);
      } else if (year && year !== 'all') {
        // Toute l'année
        dateFrom = new Date(parseInt(year), 0, 1);
        dateTo = new Date(parseInt(year), 11, 31, 23, 59, 59);
      }

      requests = await EnrollmentService.getAllRequests({ 
        ...(status && { status }), 
        ...(courseId && { courseId }),
        ...(dateFrom && { dateFrom }),
        ...(dateTo && { dateTo })
      });
    }
    console.log('Controller GET enrollments: Found:', requests.length);
    return NextResponse.json(requests);
  } catch (error: any) {
    console.error('Controller GET enrollments error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Only admin can approve requests
export async function approve(request: Request) {
  const rbacCheck = await rbacMiddleware(['admin'])(request as any);
  if (rbacCheck.status !== 200) {
    return rbacCheck;
  }

  try {
    const body = await request.json();
    console.log('Controller approve enrollment: Request body:', body);
    
    const { requestId, classId, adminNotes, assignedBy } = body;
    
    if (!requestId || !classId || !assignedBy) {
      throw new Error('Missing required fields: requestId, classId, assignedBy');
    }

    const updatedRequest = await EnrollmentService.approveRequest(requestId, {
      classId,
      adminNotes,
      assignedBy
    });
    
    return NextResponse.json(updatedRequest);
  } catch (error: any) {
    console.error('Controller approve enrollment error:', error);
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
    const body = await request.json();
    console.log('Controller reject enrollment: Request body:', body);
    
    const { requestId, adminNotes, assignedBy } = body;
    
    if (!requestId || !assignedBy) {
      throw new Error('Missing required fields: requestId, assignedBy');
    }

    const updatedRequest = await EnrollmentService.rejectRequest(requestId, { 
      adminNotes, 
      assignedBy 
    });
    
    return NextResponse.json(updatedRequest);
  } catch (error: any) {
    console.error('Controller reject enrollment error:', error);
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
    console.log('Controller recordPayment: Request ID:', requestId);
    
    const updatedRequest = await EnrollmentService.recordPayment(requestId);
    
    return NextResponse.json(updatedRequest);
  } catch (error: any) {
    console.error('Controller recordPayment error:', error);
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
    console.error('Controller getStatistics error:', error);
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

  console.log('Controller getCourseStatus: Query:', { studentId, courseId });

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
    console.error('Controller getCourseStatus error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Only admin can delete requests
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const rbacCheck = await rbacMiddleware(['admin'])(request as any);
  if (rbacCheck.status !== 200) {
    return rbacCheck;
  }

  try {
    const { id } = params;
    const { deletedBy } = await request.json();
    
    if (!deletedBy) {
      throw new Error('Missing required field: deletedBy');
    }

    const result = await EnrollmentService.deleteRequest(id, deletedBy);
    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    console.error('Controller DELETE enrollment error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: error.message.includes('not found') ? 404 : 400 }
    );
  }
}