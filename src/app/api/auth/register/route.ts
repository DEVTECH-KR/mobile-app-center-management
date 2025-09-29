import { NextResponse } from 'next/server';
import { AuthService } from '@/server/api/auth/auth.service';
import connectDB from '@/server/config/mongodb';

export async function POST(req: Request) {
  try {
    // Ensure database connection
    await connectDB();

    // Get registration data
    const userData = await req.json();

    // Register user
    const result = await AuthService.register(userData);
    
    return NextResponse.json(result, { status: 201 });
  } catch (error: any) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: error.message || 'Registration failed' },
      { status: error.message === 'Email already registered' ? 400 : 500 }
    );
  }
}