"use client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { MOCK_PAYMENTS } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import type { PaymentStatus } from "@/lib/types";

const statusColors: Record<PaymentStatus, string> = {
  Paid: "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300",
  Unpaid: "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300",
  Pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300",
};

export function PaymentStatusCard() {
  const { totalPaid, totalDue, installments } = MOCK_PAYMENTS;
  const progress = (totalPaid / totalDue) * 100;
  const currencyFormatter = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "FBU",
    minimumFractionDigits: 0,
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Payment Status</CardTitle>
        <CardDescription>
          Your tuition payment progress for Office (Bureautics).
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <div className="flex justify-between text-sm font-medium mb-1">
              <span>{currencyFormatter.format(totalPaid)}</span>
              <span className="text-muted-foreground">
                / {currencyFormatter.format(totalDue)}
              </span>
            </div>
            <Progress value={progress} />
            <p className="text-xs text-muted-foreground mt-1 text-right">
              {progress.toFixed(0)}% paid
            </p>
          </div>
          <div className="space-y-2">
            {installments.map((installment) => (
              <div
                key={installment.name}
                className="flex items-center justify-between rounded-md border p-3"
              >
                <div>
                  <p className="font-medium">{installment.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {currencyFormatter.format(installment.amount)}
                  </p>
                </div>
                <Badge className={cn(statusColors[installment.status])}>
                  {installment.status}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
