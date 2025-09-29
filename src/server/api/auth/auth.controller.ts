import { NextResponse } from 'next/server';
import { AuthService } from './auth.service';

export async function POST(req: Request) {
  try {
    const { email, password, ...userData } = await req.json();
    const result = await AuthService.register({ email, password, ...userData });
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 400 }
    );
  }
}

export async function login(req: Request) {
  try {
    const { email, password } = await req.json();
    const result = await AuthService.login(email, password);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 401 }
    );
  }
}

export async function getProfile(req: Request) {
  try {
    const userId = req.headers.get('userId'); // You'll need to set this in middleware
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const user = await AuthService.getProfile(userId);
    return NextResponse.json(user);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 404 }
    );
  }
}