// src/server/api/audit/audit.controller.ts
import { NextRequest, NextResponse } from 'next/server';
import { AuditService } from './audit.service';
import { rbacMiddleware } from '@/server/middleware/rbac.middleware';

// GET /api/audit - Get audit logs (admin only)
export async function GET(request: NextRequest) {
  const rbacCheck = await rbacMiddleware(['admin'])(request as any);
  if (rbacCheck.status !== 200) return rbacCheck;

  try {
    const { searchParams } = new URL(request.url);
    const filter = {
      targetType: searchParams.get('targetType') || undefined,
      action: searchParams.get('action') || undefined,
      performedBy: searchParams.get('performedBy') || undefined,
    };
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const result = await AuditService.getLogs(filter, page, limit);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}