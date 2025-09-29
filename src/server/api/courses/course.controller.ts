import { NextResponse } from 'next/server';
import { CourseService } from './course.service';
import { z } from 'zod';
import { rbacMiddleware } from '@/server/middleware/rbac.middleware';

// Validation schemas
const courseSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  price: z.number().min(0, "Price must be a positive number"),
  teacherIds: z.array(z.string()),
  days: z.array(z.enum(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'])),
  startTime: z.string(),
  endTime: z.string(),
  imageUrl: z.string().optional(),
  imageHint: z.string().optional(),
  levels: z.array(z.string()),
});

export async function POST(request: Request) {
  // Check if user is admin
  const rbacCheck = await rbacMiddleware(['admin'])(request as any);
  if (rbacCheck.status !== 200) {
    return rbacCheck;
  }

  try {
    const body = await request.json();
    const validatedData = courseSchema.parse(body);
    
    const course = await CourseService.create(validatedData);
    return NextResponse.json(course, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to create course' },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (id) {
      const course = await CourseService.getById(id);
      return NextResponse.json(course);
    }

    // Parse pagination and filter parameters
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    
    // Parse filters
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

export async function PUT(request: Request) {
  // Check if user is admin
  const rbacCheck = await rbacMiddleware(['admin'])(request as any);
  if (rbacCheck.status !== 200) {
    return rbacCheck;
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Course ID is required' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const validatedData = courseSchema.partial().parse(body);
    
    const course = await CourseService.update(id, validatedData);
    return NextResponse.json(course);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update course' },
      { status: error instanceof Error && error.message === 'Course not found' ? 404 : 500 }
    );
  }
}

export async function DELETE(request: Request) {
  // Check if user is admin
  const rbacCheck = await rbacMiddleware(['admin'])(request as any);
  if (rbacCheck.status !== 200) {
    return rbacCheck;
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Course ID is required' },
        { status: 400 }
      );
    }

    await CourseService.delete(id);
    return NextResponse.json(
      { message: 'Course deleted successfully' },
      { status: 200 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: error.message === 'Course not found' ? 404 : 500 }
    );
  }
}