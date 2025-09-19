import { AdminPaymentManager } from "@/components/dashboard/admin-payment-manager";
import { PaymentStatusCard } from "@/components/dashboard/payment-status";
import { MOCK_USERS } from "@/lib/mock-data";

// In a real app, this would come from an auth context
// const userRole = MOCK_USERS.student.role;
const userRole = MOCK_USERS.admin.role;

export default function PaymentsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold font-headline tracking-tight">
          {userRole === "admin" ? "Manage Payments" : "My Payments"}
        </h2>
        <p className="text-muted-foreground">
          {userRole === "admin"
            ? "View and manage all student payment records."
            : "Track your tuition fees and payment history."}
        </p>
      </div>

      {userRole === 'admin' ? (
        <AdminPaymentManager />
      ) : (
        <div className="max-w-2xl mx-auto">
          <PaymentStatusCard />
        </div>
      )}
    </div>
  );
}
