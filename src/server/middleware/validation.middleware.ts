// src/server/middleware/validation.middleware.ts
import { NextResponse } from 'next/server';
import { z } from 'zod';

export const withValidation = (schema: z.ZodSchema) => {
  return async (request: Request) => {
    try {
      const body = await request.json();
      const validatedData = schema.parse(body);
      
      // Create a new request with validated data
      const newRequest = new Request(request.url, {
        method: request.method,
        headers: request.headers,
        body: JSON.stringify(validatedData),
      });

      return { request: newRequest, validatedData };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { error: error.errors },
          { status: 400 }
        );
      }
      return NextResponse.json(
        { error: 'Invalid request data' },
        { status: 400 }
      );
    }
  };
};