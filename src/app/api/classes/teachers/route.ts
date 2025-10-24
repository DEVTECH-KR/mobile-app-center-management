// src/app/api/classes/teachers/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { ClassService } from '@/server/api/classes/class.service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const courseId = searchParams.get('courseId');
    if (!courseId) {
      return NextResponse.json({ error: 'courseId is required' }, { status: 400 });
    }
    const teachers = await ClassService.getTeachersByCourse(courseId);
    return NextResponse.json({ teachers }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}