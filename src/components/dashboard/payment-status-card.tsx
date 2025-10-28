// src/components/dashboard/payment-status-card.tsx
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, Clock, AlertTriangle, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { InstallmentStatus, EnrollmentStatus } from '@/lib/types/payment.types';
import { statusColors } from '@/lib/constants/status-colors';

interface Installment {
  name: string;
  amount: number;
  status: InstallmentStatus;
  dueDate?: string;
  paymentDate?: string;
  isInitialFee?: boolean;
}

interface PaymentDetails {
  _id: string;
  totalPaid: number;
  totalDue: number;
  installments: Installment[];
  courseId: {
    _id: string;
    title: string;
    price: number;
  };
  enrollmentId?: {
    status: EnrollmentStatus;
    assignedClassId?: string;
  };
  paymentStatus: string;
}

interface PaymentStatusCardProps {
  paymentDetails: PaymentDetails;
}

export function PaymentStatusCard({ paymentDetails }: PaymentStatusCardProps) {
  const { totalPaid, totalDue, installments, courseId, enrollmentId } = paymentDetails;
  
  const progress = totalDue > 0 ? (totalPaid / totalDue) * 100 : 0;
  const isFullyPaid = progress >= 100;
  const hasOverdue = installments.some(inst => 
    inst.status === InstallmentStatus.UNPAID && 
    inst.dueDate && 
    new Date(inst.dueDate) < new Date()
  );

  const currencyFormatter = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "FBU",
    minimumFractionDigits: 0,
  });

  /**
   * Calculate total paid amount
   */
  const calculatePaidAmount = (): number => {
    return installments
      .filter(inst => inst.status === InstallmentStatus.PAID)
      .reduce((sum, inst) => sum + inst.amount, 0);
  };

  /**
   * Check for overdue installments
   */
  const getOverdueInstallments = (): Installment[] => {
    return installments.filter(inst => 
      inst.status === InstallmentStatus.UNPAID && 
      inst.dueDate && 
      new Date(inst.dueDate) < new Date()
    );
  };

  /**
   * Get next due installment
   */
  const getNextDueInstallment = (): Installment | null => {
    const unpaidInstallments = installments.filter(inst => 
      inst.status === InstallmentStatus.UNPAID
    );
    
    if (unpaidInstallments.length === 0) return null;

    return unpaidInstallments.reduce((next, inst) => {
      if (!next) return inst;
      const nextDue = inst.dueDate ? new Date(inst.dueDate) : new Date(0);
      const currentDue = next.dueDate ? new Date(next.dueDate) : new Date(0);
      return nextDue < currentDue ? inst : next;
    }, null as Installment | null);
  };

  const overdueInstallments = getOverdueInstallments();
  const nextDueInstallment = getNextDueInstallment();

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Payment Status</span>
          <Badge variant={isFullyPaid ? "default" : progress > 0 ? "secondary" : "outline"}>
            {isFullyPaid ? "Fully Paid" : progress > 0 ? "Partial" : "Unpaid"}
          </Badge>
        </CardTitle>
        <CardDescription>
          Your payment progress for {courseId.title}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Important Alerts */}
        {hasOverdue && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {overdueInstallments.length} installment(s) overdue. 
              Please regularize your situation.
            </AlertDescription>
          </Alert>
        )}

        {enrollmentId?.status !== EnrollmentStatus.APPROVED && (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              Your enrollment is pending approval. 
              Payments will be activated after validation.
            </AlertDescription>
          </Alert>
        )}

        {/* Progress Bar */}
        <div>
          <div className="flex justify-between text-sm font-medium mb-1">
            <span>{currencyFormatter.format(totalPaid)}</span>
            <span className="text-muted-foreground">
              / {currencyFormatter.format(totalDue)}
            </span>
          </div>
          <Progress value={progress} className="h-2" />
          <p className="text-xs text-muted-foreground mt-1 text-right">
            {progress.toFixed(0)}% paid
          </p>
        </div>

        {/* Next Due Installment */}
        {nextDueInstallment && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-blue-600" />
              <div className="flex-1">
                <p className="font-medium text-sm">Next Installment:</p>
                <p className="text-sm text-blue-700">
                  {nextDueInstallment.name} - {currencyFormatter.format(nextDueInstallment.amount)}
                </p>
                {nextDueInstallment.dueDate && (
                  <p className="text-xs text-blue-600 mt-1">
                    Due: {new Date(nextDueInstallment.dueDate).toLocaleDateString('en-US')}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Installments List */}
        <div className="space-y-3">
          <h4 className="font-medium text-sm">Installment Details:</h4>
          {installments.map((installment, index) => {
            const isOverdue = installment.status === InstallmentStatus.UNPAID && 
                            installment.dueDate && 
                            new Date(installment.dueDate) < new Date();
            
            return (
              <div
                key={installment.name}
                className={cn(
                  "flex items-center justify-between rounded-md border p-3 transition-colors",
                  installment.status === InstallmentStatus.PAID && 'bg-green-50 border-green-200',
                  isOverdue && 'bg-red-50 border-red-200'
                )}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className={cn(
                      "font-medium",
                      installment.status === InstallmentStatus.PAID && "text-green-700",
                      isOverdue && "text-red-700"
                    )}>
                      {installment.name}
                      {installment.isInitialFee && (
                        <Badge variant="outline" className="ml-2 text-xs">
                          Registration Fee
                        </Badge>
                      )}
                    </p>
                    {installment.status === InstallmentStatus.PAID && (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    )}
                  </div>
                  <div className="flex justify-between items-center mt-1">
                    <p className="text-sm text-muted-foreground">
                      {currencyFormatter.format(installment.amount)}
                    </p>
                    {installment.dueDate && (
                      <p className={cn(
                        "text-xs",
                        isOverdue ? "text-red-600 font-medium" : "text-muted-foreground"
                      )}>
                        {isOverdue ? "OVERDUE - " : ""}
                        {new Date(installment.dueDate).toLocaleDateString('en-US')}
                      </p>
                    )}
                    {installment.paymentDate && (
                      <p className="text-xs text-green-600">
                        Paid on {new Date(installment.paymentDate).toLocaleDateString('en-US')}
                      </p>
                    )}
                  </div>
                </div>
                <Badge 
                  className={cn(
                    statusColors[installment.status],
                    isOverdue && "bg-red-100 text-red-800 border-red-200"
                  )}
                  variant="outline"
                >
                  {isOverdue ? "OVERDUE" : installment.status}
                </Badge>
              </div>
            );
          })}
        </div>

        {/* Financial Summary */}
        <div className="border-t pt-3 space-y-2">
          <div className="flex justify-between items-center text-sm">
            <span>Total Paid:</span>
            <span className="font-medium text-green-600">
              {currencyFormatter.format(calculatePaidAmount())}
            </span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span>Remaining:</span>
            <span className={totalDue - totalPaid > 0 ? "font-medium text-orange-600" : "font-medium text-green-600"}>
              {currencyFormatter.format(totalDue - totalPaid)}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}