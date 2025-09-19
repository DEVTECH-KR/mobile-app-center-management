
'use client';

import { AdminPaymentManager } from "@/components/dashboard/admin-payment-manager";
import { PaymentStatusCard } from "@/components/dashboard/payment-status";
import { MOCK_COURSES, MOCK_PAYMENTS } from "@/lib/mock-data";
import { useAuth } from "@/context/auth-context";
import { Loader2 } from "lucide-react";

export default function PaymentsPage() {
    const { userProfile, loading } = useAuth();

    if (loading || !userProfile) {
        return (
            <div className="flex items-center justify-center h-full">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }
  
  const studentEnrolledCourses = MOCK_COURSES.filter(c => userProfile.enrolledCourseIds?.includes(c.id));

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold font-headline tracking-tight">
          {userProfile.role === "admin" ? "Manage Payments" : "My Payments"}
        </h2>
        <p className="text-muted-foreground">
          {userProfile.role === "admin"
            ? "View and manage all student payment records."
            : "Track your tuition fees and payment history for your enrolled courses."}
        </p>
      </div>

      {userProfile.role === 'admin' ? (
        <AdminPaymentManager />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {studentEnrolledCourses.map(course => {
                let paymentDetails = null;
                if (userProfile.id === 'user-1' && course.id === 'course-1') {
                    paymentDetails = MOCK_PAYMENTS;
                } else if (userProfile.id === 'user-1' && course.id === 'course-2') {
                    const totalDue = course.price + 20000;
                    paymentDetails = {
                        userId: userProfile.id,
                        courseId: course.id,
                        registrationFee: 20000,
                        totalDue: totalDue,
                        totalPaid: 20000,
                        installments: [
                            { name: 'Registration Fee', amount: 20000, status: 'Paid', dueDate: '2024-08-01' },
                            { name: 'Installment 1', amount: course.price / 2, status: 'Unpaid', dueDate: '2024-09-01' },
                            { name: 'Installment 2', amount: course.price / 2, status: 'Unpaid', dueDate: '2024-10-01' },
                        ]
                    };
                }
                
                if (!paymentDetails) {
                    return null;
                }

                return (
                    <PaymentStatusCard key={course.id} paymentDetails={paymentDetails}/>
                )
            })}
             {studentEnrolledCourses.length === 0 && (
                <div className="col-span-full text-center text-muted-foreground py-10">
                    You are not enrolled in any courses yet.
                </div>
             )}
        </div>
      )}
    </div>
  );
}
