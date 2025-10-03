import { NextResponse } from 'next/server';
import { EventService } from './events.service';
import { z } from 'zod';
import { rbacMiddleware } from '@/server/middleware/rbac.middleware';
import { IEvent } from './events.schema';

// Validation schema for event creation and update
const EventSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  details: z.string().optional(),
  date: z.string().refine((val) => !isNaN(Date.parse(val)), { message: "Invalid date" }),
  imageUrls: z.array(z.string()).min(1, "At least one image is required"),
  imageHint: z.string().optional(),
  isPast: z.boolean().optional(),
});

// POST /api/events - create an event
export async function POST(request: Request) {
  const rbacCheck = await rbacMiddleware(['admin'])(request as any);
  if (rbacCheck.status !== 200) return rbacCheck;

  try {
    const body = await request.json();
    const validatedData = EventSchema.parse(body);

    const eventData: Partial<IEvent> = {
      ...validatedData,
      date: new Date(validatedData.date),
    };

    const event = await EventService.create(eventData);
    return NextResponse.json(event, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to create event' }, { status: 500 });
  }
}

// GET /api/events or /api/events/[id] - list or get an event by ID
export async function GET(request: Request, { params }: { params?: Promise<{ id: string }> } = {}) {
  try {
    const resolvedParams = params ? await params : undefined;
    const id = resolvedParams?.id;

    if (id) {
      const event = await EventService.getById(id);
      return NextResponse.json(event);
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const sortBy = searchParams.get('sortBy') || 'date';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    const title = searchParams.get('title') || undefined;
    const isPastParam = searchParams.get('isPast');
    const isPast = isPastParam ? isPastParam === 'true' : undefined;

    const result = await EventService.getAll(
      { title, isPast },
      { page, limit, sortBy, sortOrder: sortOrder as 'asc' | 'desc' }
    );

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: error.message === 'Event not found' ? 404 : 500 }
    );
  }
}

// PUT /api/events/[id] - update an event
export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const rbacCheck = await rbacMiddleware(['admin'])(request as any);
  if (rbacCheck.status !== 200) return rbacCheck;

  try {
    const { id: eventId } = await params;
    if (!eventId) {
      return NextResponse.json({ error: 'Event ID is required' }, { status: 400 });
    }

    const body = await request.json();
    const validatedData = EventSchema.partial().parse(body);

    const updateData: Partial<IEvent> = {
      ...validatedData,
      date: validatedData.date ? new Date(validatedData.date) : undefined,
    };

    const event = await EventService.update(eventId, updateData);
    return NextResponse.json(event);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update event' },
      { status: error instanceof Error && error.message === 'Event not found' ? 404 : 500 }
    );
  }
}

// DELETE /api/events/[id] - delete an event
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const rbacCheck = await rbacMiddleware(['admin'])(request as any);
  if (rbacCheck.status !== 200) return rbacCheck;

  try {
    const { id: eventId } = await params;
    if (!eventId) {
      return NextResponse.json({ error: 'Event ID is required' }, { status: 400 });
    }

    await EventService.delete(eventId);
    return NextResponse.json({ message: 'Event deleted successfully' }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: error.message === 'Event not found' ? 404 : 500 }
    );
  }
}