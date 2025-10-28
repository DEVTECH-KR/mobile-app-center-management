// src/server/api/installment-templates/installment-template.controller.ts
import { NextRequest, NextResponse } from 'next/server';
import { InstallmentTemplateService } from './installment-template.service';
import { rbacMiddleware } from '@/server/middleware/rbac.middleware';

// GET /api/installment-templates/[courseId] - Get templates for course
export async function GET(request: NextRequest, { params }: { params: { courseId: string } }) {
  const rbacCheck = await rbacMiddleware(['admin'])(request as any);
  if (rbacCheck.status !== 200) return rbacCheck;

  try {
    const templates = await InstallmentTemplateService.getByCourse(params.courseId);
    return NextResponse.json(templates || { installments: [] });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT /api/installment-templates/[courseId] - Update templates for course
export async function PUT(request: NextRequest, { params }: { params: { courseId: string } }) {
  const rbacCheck = await rbacMiddleware(['admin'])(request as any);
  if (rbacCheck.status !== 200) return rbacCheck;

  try {
    const body = await request.json();
    const updated = await InstallmentTemplateService.updateForCourse(params.courseId, body.installments);
    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}