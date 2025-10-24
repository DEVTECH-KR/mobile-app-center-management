// src/app/api/assignments/route.ts
import { NextResponse } from 'next/server';
import { getAllAssignments, addClasses } from '@/server/api/assignments/assignment.controller';

export async function GET(req: Request) {
  return getAllAssignments(req);
}

export async function POST(req: Request) {
  return addClasses(req);
}