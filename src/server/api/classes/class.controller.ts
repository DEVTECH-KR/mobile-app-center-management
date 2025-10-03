import { NextRequest, NextResponse } from 'next/server';
import { ClassService } from './class.service';
import mongoose from 'mongoose';

// GET /api/classes - Récupérer toutes les classes avec filtres et pagination
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const filters = {
      name: searchParams.get('name') || undefined,
      courseTitle: searchParams.get('courseTitle') || undefined,
      teacherName: searchParams.get('teacherName') || undefined,
    };
    const pagination = {
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '10'),
      sortBy: searchParams.get('sortBy') || 'name',
      sortOrder: (searchParams.get('sortOrder') as 'asc' | 'desc') || 'asc',
    };

    const result = await ClassService.getAll(filters, pagination);
    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/classes - Créer une nouvelle classe
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const classDoc = await ClassService.create(body);
    return NextResponse.json(classDoc, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

// GET /api/classes/[id] - Récupérer une classe par ID
export async function GET_BY_ID(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const classDoc = await ClassService.getById(params.id);
    return NextResponse.json(classDoc, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: error.message.includes('not found') ? 404 : 500 });
  }
}

// PUT /api/classes/[id] - Mettre à jour une classe
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json();
    const classDoc = await ClassService.update(params.id, body);
    return NextResponse.json(classDoc, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: error.message.includes('not found') ? 404 : 400 });
  }
}

// DELETE /api/classes/[id] - Supprimer une classe
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const classDoc = await ClassService.delete(params.id);
    return NextResponse.json(classDoc, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: error.message.includes('not found') ? 404 : 500 });
  }
}