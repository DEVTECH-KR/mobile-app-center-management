// src/server/api/enrollments/enrollment.validation.ts
import { z } from 'zod';

export const enrollmentSchemas = {
  create: z.object({
    studentId: z.string().min(1, "Student ID is required"),
    courseId: z.string().min(1, "Course ID is required"),
  }),

  approve: z.object({
    requestId: z.string().min(1, "Request ID is required"),
    classId: z.string().min(1, "Class ID is required"),
    adminNotes: z.string().optional(),
  }),

  reject: z.object({
    requestId: z.string().min(1, "Request ID is required"),
    adminNotes: z.string().optional(),
  }),

  recordPayment: z.object({
    requestId: z.string().min(1, "Request ID is required"),
  })
};