// src/components/dashboard/admin-payment-manager.tsx
'use client';

import { useState, useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FileUp, Loader2, Search, AlertTriangle, CheckCircle, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Checkbox } from "../ui/checkbox";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { paymentsApi } from '@/lib/api/payments.api';
import { useAuth } from '@/lib/auth';
import { 
  PaymentFilters, 
  InstallmentStatus, 
  EnrollmentStatus,
  PaymentValidation,
  PaymentFilterType 
} from '@/lib/types/payment.types';
import { statusColors } from '@/lib/constants/status-colors';
import { PaymentFiltersComponent } from '../payments/payment-filters';

interface AdminPaymentManagerProps {
  payments: any[];
  onUpdate: () => void;
}

export function AdminPaymentManager({ payments, onUpdate }: AdminPaymentManagerProps) {
  const { user, token } = useAuth();
  const { toast } = useToast();
  
  const [selectedPayment, setSelectedPayment] = useState<any | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pendingInstallments, setPendingInstallments] = useState<any[]>([]);
  const [validationResult, setValidationResult] = useState<PaymentValidation | null>(null);
  
  // ✅ Improved filters
  const [filters, setFilters] = useState<PaymentFilters>({
    status: [],
    courseId: [],
    classId: [],
    dateRange: { from: null, to: null },
    searchTerm: ''
  });

  /**
   * Validates if a payment can be modified
   */
  const validatePaymentAction = async (payment: any): Promise<PaymentValidation> => {
    // ✅ CORRECTION: Handle both string and object enrollmentId
    let enrollmentId: string | null = null;
    
    if (typeof payment.enrollmentId === 'string') {
      enrollmentId = payment.enrollmentId;
    } else if (payment.enrollmentId && payment.enrollmentId._id) {
      enrollmentId = payment.enrollmentId._id;
    }

    if (!enrollmentId) {
      return {
        isValid: false,
        allowed: false,
        message: 'No enrollment associated with this payment'
      };
    }

    try {
      const response = await fetch(`/api/enrollments/${enrollmentId}`);
      if (!response.ok) {
        return {
          isValid: false,
          allowed: false,
          message: 'Unable to verify enrollment status'
        };
      }

      const enrollment = await response.json();
      
      if (enrollment.status === EnrollmentStatus.REJECTED) {
        return {
          isValid: false,
          allowed: false,
          message: 'Cannot modify payment for a rejected enrollment',
          enrollmentStatus: EnrollmentStatus.REJECTED
        };
      }

      return {
        isValid: true,
        allowed: true,
        enrollmentStatus: enrollment.status
      };
    } catch (error) {
      return {
        isValid: false,
        allowed: false,
        message: 'Error validating payment'
      };
    }
  };

  /**
   * Opens the modification dialog with validation
   */
  const handleOpenDialog = async (payment: any) => {
    if (!token) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Authentication required",
      });
      return;
    }

    // ✅ Validation before opening
    const validation = await validatePaymentAction(payment);
    setValidationResult(validation);

    if (!validation.allowed) {
      toast({
        variant: "destructive",
        title: "Action not allowed",
        description: validation.message,
      });
      return;
    }

    setSelectedPayment(payment);
    setPendingInstallments(JSON.parse(JSON.stringify(payment.installments)));
    setIsDialogOpen(true);
  };

  /**
   * Toggles installment status with validation
   */
const handleInstallmentToggle = (installmentName: string, currentStatus: InstallmentStatus) => {
  if (!selectedPayment) return;

  // ✅ ONLY PREVENT UNCHECKING IF IT'S ALREADY PAID IN THE DATABASE
  const originalInstallment = selectedPayment.installments.find((inst: any) => inst.name === installmentName);
  
  // If it's already paid in the database, don't allow any changes
  if (originalInstallment && originalInstallment.status === InstallmentStatus.PAID) {
    toast({
      variant: "destructive",
      title: "Cannot modify",
      description: "This installment is already paid and cannot be modified",
    });
    return;
  }

  // ✅ ALLOW TOGGLE FOR PENDING CHANGES
  setPendingInstallments(prev => prev.map(inst =>
    inst.name === installmentName
      ? { 
          ...inst, 
          status: inst.status === InstallmentStatus.PAID ? InstallmentStatus.UNPAID : InstallmentStatus.PAID 
        }
      : inst
  ));
};

  /**
   * Saves changes with enhanced validation
   */
  const handleSaveChanges = async () => {
    if (!selectedPayment || !token) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Missing data",
      });
      return;
    }

    // ✅ Re-validate before saving
    const finalValidation = await validatePaymentAction(selectedPayment);
    if (!finalValidation.allowed) {
      toast({
        variant: "destructive",
        title: "Action not allowed",
        description: finalValidation.message,
      });
      setIsDialogOpen(false);
      return;
    }

    setIsSubmitting(true);
    
    try {
      const originalInstallments = selectedPayment.installments;
      let hasChanges = false;
      const processedInstallments: string[] = [];
      
      // ✅ Process only valid changes
      for (const inst of pendingInstallments) {
        const originalInst = originalInstallments.find((i: any) => i.name === inst.name);
        
        // Check if status changed and if it's valid
        if (originalInst && inst.status !== originalInst.status) {
          
          // ✅ Prevent double payment
          if (originalInst.status === InstallmentStatus.PAID && inst.status === InstallmentStatus.PAID) {
            console.warn(`Installment ${inst.name} already paid, skipped`);
            continue;
          }

          // ✅ Record payment
          if (inst.status === InstallmentStatus.PAID) {
            console.log(`Recording payment for: ${inst.name}`);
            await paymentsApi.recordPayment(selectedPayment._id, inst.name, token);
            processedInstallments.push(inst.name);
            hasChanges = true;
          }
        }
      }

      if (!hasChanges) {
        toast({
          title: "No changes",
          description: "No payment status changes were made",
        });
        return;
      }

      toast({
        title: "Payment updated",
        description: `Updated installment(s): ${processedInstallments.join(', ')}`,
      });
      
      onUpdate();
      setIsDialogOpen(false);
      setValidationResult(null);
    } catch (error: any) {
      console.error('Payment update error:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to update payment",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Applies filters to payments
   */
  const filteredPayments = payments.filter(payment => {
    const matchesSearch = filters.searchTerm === '' ||
      payment.studentId.name.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
      payment.studentId.email.toLowerCase().includes(filters.searchTerm.toLowerCase());

    return matchesSearch;
  });

  const currencyFormatter = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "FBU",
    minimumFractionDigits: 0,
  });

  /**
   * Resets all filters
   */
  const handleClearFilters = () => {
    setFilters({
      status: [],
      courseId: [],
      classId: [],
      dateRange: { from: null, to: null },
      searchTerm: ''
    });
  };

  /**
   * Gets enrollment status from payment
   */
  const getEnrollmentStatus = (payment: any): EnrollmentStatus | 'unknown' => {
    if (typeof payment.enrollmentId === 'string') {
      return 'unknown'; // Need to fetch separately
    } else if (payment.enrollmentId && payment.enrollmentId.status) {
      return payment.enrollmentId.status;
    }
    return 'unknown';
  };

  return (
    <>
      {/* ✅ Enhanced filters component */}
      <PaymentFiltersComponent
        filters={filters}
        onFiltersChange={setFilters}
        onClearFilters={handleClearFilters}
      />

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Student</TableHead>
              <TableHead>Course</TableHead>
              <TableHead>Payment Progress</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Enrollment</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredPayments.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  {payments.length === 0 ? "No payments found" : "No results with current filters"}
                </TableCell>
              </TableRow>
            )}
            
            {filteredPayments.map((payment) => {
              const { totalPaid, totalDue } = payment;
              const progress = totalDue > 0 ? (totalPaid / totalDue) * 100 : 0;
              const isFullyPaid = progress >= 100;
              
              // ✅ Enrollment status for indication
              const enrollmentStatus = getEnrollmentStatus(payment);
              
              return (
                <TableRow key={payment._id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={payment.studentId.avatarUrl} alt={payment.studentId.name} />
                        <AvatarFallback>{payment.studentId.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{payment.studentId.name}</div>
                        <div className="text-sm text-muted-foreground">{payment.studentId.email}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{payment.courseId.title}</div>
                    <div className="text-sm text-muted-foreground">
                      {currencyFormatter.format(payment.courseId.price)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <Progress value={progress} />
                      <span className="text-xs text-muted-foreground">
                        {currencyFormatter.format(totalPaid)} / {currencyFormatter.format(totalDue)}
                        ({progress.toFixed(0)}%)
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={isFullyPaid ? "default" : progress > 0 ? "secondary" : "outline"}>
                      {isFullyPaid ? "Fully Paid" : progress > 0 ? "Partial" : "Unpaid"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant={
                        enrollmentStatus === EnrollmentStatus.APPROVED ? "default" :
                        enrollmentStatus === EnrollmentStatus.PENDING ? "secondary" : "destructive"
                      }
                    >
                      {enrollmentStatus === EnrollmentStatus.APPROVED && <CheckCircle className="h-3 w-3 mr-1" />}
                      {enrollmentStatus === EnrollmentStatus.REJECTED && <XCircle className="h-3 w-3 mr-1" />}
                      {enrollmentStatus}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleOpenDialog(payment)}
                      disabled={enrollmentStatus === EnrollmentStatus.REJECTED}
                    >
                      {enrollmentStatus === EnrollmentStatus.REJECTED ? (
                        <>
                          <AlertTriangle className="h-4 w-4 mr-1" />
                          Blocked
                        </>
                      ) : (
                        "Update Payment"
                      )}
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* ✅ Modification dialog with validation */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Update Payment - {selectedPayment?.studentId.name}
            </DialogTitle>
            
            {/* ✅ Structure corrigée : séparation du DialogDescription et du contenu div */}
            <div className="space-y-2">
              <DialogDescription>
                Course: {selectedPayment?.courseId.title}
              </DialogDescription>
              
              {validationResult && (
                <div className={cn(
                  "p-2 rounded text-sm",
                  validationResult.allowed 
                    ? "bg-green-50 text-green-700 border border-green-200"
                    : "bg-red-50 text-red-700 border border-red-200"
                )}>
                  {validationResult.allowed ? (
                    <CheckCircle className="h-4 w-4 inline mr-1" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 inline mr-1" />
                  )}
                  {validationResult.message}
                </div>
              )}
            </div>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <p className="font-medium">Installments:</p>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {pendingInstallments.map(inst => {
                const originalInst = selectedPayment?.installments.find((i: any) => i.name === inst.name);
                const isAlreadyPaid = originalInst?.status === InstallmentStatus.PAID;
                
                return (
                  <div 
                    key={inst.name} 
                    className={cn(
                      "flex items-center justify-between rounded-md border p-3 transition-colors",
                      inst.status === InstallmentStatus.PAID && 'bg-primary/10',
                      isAlreadyPaid && 'bg-green-50 border-green-200'
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <Checkbox
                        id={`inst-${inst.name}`}
                        checked={inst.status === InstallmentStatus.PAID}
                        onCheckedChange={() => handleInstallmentToggle(inst.name, inst.status)}
                        disabled={isAlreadyPaid || !validationResult?.allowed}
                      />
                      <div>
                        <Label 
                          htmlFor={`inst-${inst.name}`} 
                          className={cn(
                            "font-medium",
                            isAlreadyPaid && "text-green-700"
                          )}
                        >
                          {inst.name}
                          {isAlreadyPaid && (
                            <Badge variant="outline" className="ml-2 text-xs text-bold">
                              Already Paid
                            </Badge>
                          )}
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          {currencyFormatter.format(inst.amount)}
                          {inst.dueDate && (
                            <span className="ml-2">
                              Due: {new Date(inst.dueDate).toLocaleDateString('en-US')}
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                    <Badge className={cn(statusColors[inst.status])}>
                      {inst.status}
                    </Badge>
                  </div>
                );
              })}
            </div>
            
            {/* Payment Summary */}
            {selectedPayment && (
              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between items-center font-medium">
                  <span>Total Paid:</span>
                  <span>{currencyFormatter.format(selectedPayment.totalPaid)}</span>
                </div>
                <div className="flex justify-between items-center text-sm text-muted-foreground">
                  <span>Total Due:</span>
                  <span>{currencyFormatter.format(selectedPayment.totalDue)}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span>Remaining:</span>
                  <span className={selectedPayment.totalDue - selectedPayment.totalPaid > 0 ? "text-orange-600 font-medium" : "text-green-600 font-medium"}>
                    {currencyFormatter.format(selectedPayment.totalDue - selectedPayment.totalPaid)}
                  </span>
                </div>
              </div>
            )}

            {/* Payment Proof (Optional) */}
            <div className="grid w-full items-center gap-1.5 mt-4">
              <Label htmlFor="payment-proof">Payment Proof (Optional)</Label>
              <div className="flex items-center gap-2">
                <Input id="payment-proof" type="file" className="flex-1" accept=".pdf,.jpg,.jpeg,.png" />
                <Button size="icon" variant="outline">
                  <FileUp className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Accepted formats: PDF, JPG, PNG (max. 5MB)
              </p>
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setIsDialogOpen(false);
                setValidationResult(null);
              }}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSaveChanges} 
              disabled={isSubmitting || !validationResult?.allowed}
            >
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}