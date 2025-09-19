
import { AdminPaymentManager } from "@/components/dashboard/admin-payment-manager";
import { PaymentStatusCard } from "@/components/dashboard/payment-status";
import { MOCK_USERS, MOCK_COURSES, MOCK_PAYMENTS } from "@/lib/mock-data";

// In a real app, this would come from an auth context
const user = MOCK_USERS.student;
// const user = MOCK_USERS.admin;

const studentEnrolledCourses = MOCK_COURSES.filter(c => user.enrolledCourseIds?.includes(c.id));

export default function PaymentsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold font-headline tracking-tight">
          {user.role === "admin" ? "Manage Payments" : "My Payments"}
        </h2>
        <p className="text-muted-foreground">
          {user.role === "admin"
            ? "View and manage all student payment records."
            : "Track your tuition fees and payment history for your enrolled courses."}
        </p>
      </div>

      {user.role === 'admin' ? (
        <AdminPaymentManager />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {studentEnrolledCourses.map(course => {
                // In a real app, you'd fetch payment details for this user and course.
                // Here we'll generate some mock details or use the main one if it matches.
                let paymentDetails = null;
                if (user.id === MOCK_PAYMENTS.userId && course.id === MOCK_PAYMENTS.courseId) {
                    paymentDetails = MOCK_PAYMENTS;
                } else {
                    // Create mock payment details for other courses
                    const totalDue = course.price + 20000;
                    paymentDetails = {
                        userId: user.id,
                        courseId: course.id,
                        registrationFee: 20000,
                        totalDue: totalDue,
                        totalPaid: 0,
                        installments: [
                            { name: 'Registration Fee', amount: 20000, status: 'Unpaid', dueDate: '2024-08-01' },
                            { name: 'Installment 1', amount: course.price / 4, status: 'Unpaid', dueDate: '2024-09-01' },
                        ]
                    };
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

    