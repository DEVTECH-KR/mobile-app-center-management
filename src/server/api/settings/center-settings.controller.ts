// src/server/api/settings/center-settings.controller.ts
import { NextRequest, NextResponse } from 'next/server';
import { CenterSettingsService } from './center-settings.service';
import { rbacMiddleware } from '@/server/middleware/rbac.middleware';

// GET /api/settings/center - Get center settings
export async function GET(request: NextRequest) {
  const rbacCheck = await rbacMiddleware(['admin', 'teacher', 'student'])(request as any); // Allow all roles to read
  if (rbacCheck.status !== 200) {
    return rbacCheck;
  }

  try {
    const settings = await CenterSettingsService.getSettings();
    return NextResponse.json(settings);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT /api/settings/center - Update center settings (admin only)
export async function PUT(request: NextRequest) {
  const rbacCheck = await rbacMiddleware(['admin'])(request as any);
  if (rbacCheck.status !== 200) {
    return rbacCheck;
  }

  try {
    const body = await request.json();
    const updated = await CenterSettingsService.updateSettings(body);
    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}