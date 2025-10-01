// src/server/api/auth/auth.controller.ts
import { NextResponse } from 'next/server';
import { AuthService } from './auth.service';
import connectDB from '@/server/config/mongodb';

export async function POST(req: Request) {
  try {
    await connectDB();
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
    await connectDB();
    const body = await req.json();
    console.log('Login body preview:', { email: body.email ? body.email.substring(0, 3) + '...' : 'missing' });
    const { email, password } = body;
    const result = await AuthService.login(email, password);
    console.log('Login success, token length:', result.token ? result.token.length : 'missing');
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Controller login error:', error); 
    return NextResponse.json(
      { error: error.message },
      { status: 401 }
    );
  }
}

export async function getProfile(req: Request) {
  try {
    await connectDB();
    const userId = req.headers.get('userId');
    console.log('Controller getProfile: Using userId from header:', userId); 

    if (!userId) {
      console.log('Controller: No userId header—middleware failed?');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const user = await AuthService.getProfile(userId);
    return NextResponse.json(user);
  } catch (error: any) {
    console.error('Controller getProfile error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 404 }
    );
  }
}

export async function updateProfile(req: Request) {
  try {
    await connectDB();
    const userId = req.headers.get('userId');
    console.log('Controller updateProfile: Using userId from header:', userId);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const body = await req.json();
    console.log('Update body:', body);
    const updated = await AuthService.updateProfile(userId, body);
    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('Controller updateProfile error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 400 }
    );
  }
}

export async function changePassword(req: Request) {
  try {
    await connectDB();
    const userId = req.headers.get('userId');
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { currentPassword, newPassword } = await req.json();
    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    
    await AuthService.changePassword(userId, currentPassword, newPassword);
    return NextResponse.json({ message: 'Password changed successfully' });
  } catch (error: any) {
    console.error('Controller changePassword error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 400 }
    );
  }
}

export async function updatePreferences(req: Request) {
  try {
    await connectDB();
    const userId = req.headers.get('userId');
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const updatedPreferences = await AuthService.updatePreferences(userId, body);

    return NextResponse.json({ message: 'Preferences updated', preferences: updatedPreferences });
  } catch (error: any) {
    console.error('Controller updatePreferences error:', error);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
