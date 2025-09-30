import { NextResponse } from 'next/server';
import { ClassService } from './class.service';
import { z } from 'zod';
import { rbacMiddleware } from '@/server/middleware/rbac.middleware';

const classSchema = z.object({
  name: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  teacherId: z.string(),
  courseId: z.string(),
  imageUrl: z.string().optional(),
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
        const validatedData = classSchema.parse(body);
        
        const newclass = await ClassService.create(validatedData);
        return NextResponse.json(newclass, { status: 201 });
    } catch (error) {
        if (error instanceof z.ZodError) {
        return NextResponse.json(
            { error: error.errors },
            { status: 400 }
        );
        }
        return NextResponse.json(
        { error: 'Failed to create class' },
        { status: 500 }
        );
    }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (id) {
      const gotClass = await ClassService.getById(id);
      return NextResponse.json(gotClass);
    }

    // Parse pagination and filter parameters
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    
    // Parse filters
    const name = searchParams.get('name') || undefined;
    const description = searchParams.get('description') || undefined;
    const levels = searchParams.getAll('levels');

    const result = await ClassService.getAll(
      { name, description, levels: levels.length ? levels : undefined },
      { page, limit, sortBy, sortOrder: sortOrder as 'asc' | 'desc' }
    );

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: error.message === 'Class not found' ? 404 : 500 }
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
        { error: 'Class ID is required' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const validatedData = classSchema.partial().parse(body);
    
    const newClass = await ClassService.update(id, validatedData);
    return NextResponse.json(newClass);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update class' },
      { status: error instanceof Error && error.message === 'Class not found' ? 404 : 500 }
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
        { error: 'Class ID is required' },
        { status: 400 }
      );
    }

    await ClassService.delete(id);
    return NextResponse.json(
      { message: 'Class deleted successfully' },
      { status: 200 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: error.message === 'Class not found' ? 404 : 500 }
    );
  }
}