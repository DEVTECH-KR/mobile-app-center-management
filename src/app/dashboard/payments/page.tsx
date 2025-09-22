
'use client';

import { AdminPaymentManager } from "@/components/dashboard/admin-payment-manager";
import { PaymentStatusCard } from "@/components/dashboard/payment-status";
import { MOCK_COURSES, MOCK_PAYMENTS, MOCK_USERS } from "@/lib/mock-data";

// In a real app, this would come from an auth context.
const currentUser = MOCK_USERS.admin;

export default function PaymentsPage() {
  const studentEnrolledCourses = MOCK_COURSES.filter(c => currentUser.enrolledCourseIds?.includes(c.id));

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold font-headline tracking-tight">
          {currentUser.role === "admin" ? "Manage Payments" : "My Payments"}
        </h2>
        <p className="text-muted-foreground">
          {currentUser.role === "admin"
            ? "View and manage all student payment records."
            : "Track your tuition fees and payment history for your enrolled courses."}
        </p>
      </div>

      {currentUser.role === 'admin' ? (
        <AdminPaymentManager />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {studentEnrolledCourses.map(course => {
                let paymentDetails = null;
                // This logic is highly specific to mock data and would be a database query in a real app
                if (currentUser.id === 'user-1' && course.id === 'course-1') {
                    paymentDetails = MOCK_PAYMENTS;
                } else if (currentUser.id === 'user-1' && course.id === 'course-2') {
                    // Create some dynamic mock data for a second course
                    const totalDue = course.price + 20000;
                    paymentDetails = {
                        userId: currentUser.id,
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
