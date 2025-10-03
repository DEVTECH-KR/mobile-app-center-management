// src/server/api/courses/course.controller.ts
import { NextResponse } from 'next/server';
import { CourseService } from './course.service';
import { z } from 'zod';
import { rbacMiddleware } from '@/server/middleware/rbac.middleware';
import { ICourse } from './course.schema';
import { Types } from 'mongoose';

// Validation schema for course creation and update
const CourseSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  price: z.number().min(0, "Price must be a positive number"),
  teacherIds: z.array(z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid ObjectId")).optional(),
  days: z.array(z.enum(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'])),
  startTime: z.string(),
  endTime: z.string(),
  imageUrl: z.string().optional(),
  imageHint: z.string().optional(),
  levels: z.array(z.string()),
});

// POST /api/courses - create a course
export async function POST(request: Request) {
  const rbacCheck = await rbacMiddleware(['admin'])(request as any);
  if (rbacCheck.status !== 200) return rbacCheck;

  try {
    const body = await request.json();
    const validatedData = CourseSchema.parse(body);

    // Convert string[] to ObjectId[]
    const courseData: Partial<ICourse> = {
      ...validatedData,
      teacherIds: validatedData.teacherIds?.map(id => new Types.ObjectId(id)),
    };

    const course = await CourseService.create(courseData);
    return NextResponse.json(course, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to create course' }, { status: 500 });
  }
}

// GET /api/courses - list or get a course by ID
export async function GET(request: Request, { params }: { params?: Promise<{ id: string }> } = {}) {
  try {
    const resolvedParams = params ? await params : undefined;
    const id = resolvedParams?.id;

    if (id) {
      const course = await CourseService.getById(id);
      return NextResponse.json(course);
    }

    const { searchParams } = new URL(request.url);

    // Pagination, sorting, and filters
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    const title = searchParams.get('title') || undefined;
    const minPrice = searchParams.get('minPrice') ? parseFloat(searchParams.get('minPrice')!) : undefined;
    const maxPrice = searchParams.get('maxPrice') ? parseFloat(searchParams.get('maxPrice')!) : undefined;
    const days = searchParams.getAll('days');
    const levels = searchParams.getAll('levels');

    const result = await CourseService.getAll(
      { title, minPrice, maxPrice, days: days.length ? days : undefined, levels: levels.length ? levels : undefined },
      { page, limit, sortBy, sortOrder: sortOrder as 'asc' | 'desc' }
    );

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: error.message === 'Course not found' ? 404 : 500 }
    );
  }
}

// PUT /api/courses/[id] - update a course
export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const rbacCheck = await rbacMiddleware(['admin'])(request as any);
  if (rbacCheck.status !== 200) return rbacCheck;

  try {
    const { id: courseId } = await params;
    console.log('Route updateCourse: Course ID:', courseId); // Debug log
    if (!courseId) {
      return NextResponse.json({ error: 'Course ID is required' }, { status: 400 });
    }
    if (!Types.ObjectId.isValid(courseId)) {
      return NextResponse.json({ error: 'Invalid course ID format' }, { status: 400 });
    }

    const body = await request.json();
    console.log('Route updateCourse: Payload:', body); // Debug log
    const validatedData = CourseSchema.partial().parse(body);

    // Convert string[] to ObjectId[] if present
    const updateData: Partial<ICourse> = {
      ...validatedData,
      teacherIds: validatedData.teacherIds?.map(id => {
        if (!Types.ObjectId.isValid(id)) {
          throw new Error(`Invalid teacher ID: ${id}`);
        }
        return new Types.ObjectId(id);
      }),
    };
    const course = await CourseService.update(courseId, updateData);
    console.log('Route updateCourse: Updated course:', course._id); // Debug log
    return NextResponse.json(course);
  } catch (error) {
    console.error('Route updateCourse error:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update course' },
      { status: error instanceof Error && error.message === 'Course not found' ? 404 : 500 }
    );
  }
}

// DELETE /api/courses/[id] - delete a course
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const rbacCheck = await rbacMiddleware(['admin'])(request as any);
  if (rbacCheck.status !== 200) return rbacCheck;

  try {
    const { id: courseId } = await params;
    console.log('Route deleteCourse: Course ID:', courseId); // Debug log
    if (!courseId) {
      return NextResponse.json({ error: 'Course ID is required' }, { status: 400 });
    }
    if (!Types.ObjectId.isValid(courseId)) {
      return NextResponse.json({ error: 'Invalid course ID format' }, { status: 400 });
    }

    await CourseService.delete(courseId);
    console.log('Route deleteCourse: Deleted course:', courseId); // Debug log
    return NextResponse.json({ message: 'Course deleted successfully' }, { status: 200 });
  } catch (error: any) {
    console.error('Route deleteCourse error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: error.message === 'Course not found' ? 404 : 500 }
    );
  }
}