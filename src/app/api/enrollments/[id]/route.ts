// Dans src/app/api/enrollments/[id]/route.ts
import { EnrollmentService } from "@/server/api/enrollments/enrollment.service";
import { rbacMiddleware } from "@/server/middleware/rbac.middleware";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest, 
  { params }: { params: Promise<{ id: string }> }
) {
  const rbacCheck = await rbacMiddleware(['admin'])(request as any);
  if (rbacCheck.status !== 200) return rbacCheck;

  try {
    const resolvedParams = await params; 
    const enrollment = await EnrollmentService.getRequestById(resolvedParams.id);
    return NextResponse.json(enrollment);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 404 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const rbacCheck = await rbacMiddleware(['admin'])(request as any);
  if (rbacCheck.status !== 200) return rbacCheck;

  try {
    const resolvedParams = await params;
    const body = await request.json();
    const result = await EnrollmentService.deleteRequest(resolvedParams.id, body.deletedBy);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: error.message.includes('not found') ? 404 : 400 }
    );
  }
}