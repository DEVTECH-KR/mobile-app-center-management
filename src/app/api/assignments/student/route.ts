// src/app/api/assignments/student/route.ts
import { getAssignment } from '@/server/api/assignments/assignment.controller';

export async function GET(req: Request) {
  return getAssignment(req);
}