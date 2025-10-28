// src/server/api/payments/payment.controller.ts
import { NextRequest, NextResponse } from 'next/server';
import { PaymentService } from './payment.service';
import { rbacMiddleware } from '@/server/middleware/rbac.middleware';

// GET /api/payments - Get all payments (admin) or student payments
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const studentId = searchParams.get('studentId');
  const courseId = searchParams.get('courseId');

  const rbacCheck = await rbacMiddleware(studentId ? ['admin', 'student'] : ['admin'])(request as any);
  if (rbacCheck.status !== 200) return rbacCheck;

  try {
    let payments;
    if (studentId) {
      payments = await PaymentService.getStudentPayments(studentId);
    } else {
      payments = await PaymentService.getAllPayments({ courseId: courseId || undefined });
    }
    return NextResponse.json(payments);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/payments/record - Record installment payment (admin)
export async function POST(request: NextRequest) {
  const rbacCheck = await rbacMiddleware(['admin'])(request as any);
  if (rbacCheck.status !== 200) return rbacCheck;

  try {
    const body = await request.json();

    if (body.paymentId && body.installmentName) {
      const { paymentId, installmentName, status, paymentDate } = body;
      const updated = await PaymentService.updateInstallment(paymentId, installmentName, { 
        status, 
        paymentDate: paymentDate ? new Date(paymentDate) : new Date() 
      });
      return NextResponse.json(updated);
    }else {
      return NextResponse.json(
        { error: "Invalid request. Provide paymentId and installmentName for recording payments." },
        { status: 400 }
      );
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

// GET /api/payments/stats - Get payment statistics (admin)
export async function getStats(request: NextRequest) {
  const rbacCheck = await rbacMiddleware(['admin'])(request as any);
  if (rbacCheck.status !== 200) return rbacCheck;

  try {
    const stats = await PaymentService.getStatistics();
    return NextResponse.json(stats);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}