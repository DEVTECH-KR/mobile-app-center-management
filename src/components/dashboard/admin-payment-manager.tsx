
"use client";

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
import { MOCK_USERS, MOCK_PAYMENTS, MOCK_COURSES } from "@/lib/mock-data";
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
import { FileUp, Loader2, Search } from "lucide-react";
import { useState } from "react";
import type { Installment, PaymentDetails, User } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { statusColors } from "./payment-status";
import { Checkbox } from "../ui/checkbox";

type StudentPayment = User & { paymentDetails: PaymentDetails | null };

const allStudents = Object.values(MOCK_USERS).filter(u => u.role === 'student');

const initialStudentPayments: StudentPayment[] = allStudents.map(student => {
    // In a real app, you'd fetch this from a DB
    const paymentDetails = student.id === 'user-1' ? MOCK_PAYMENTS : null;
    if (student.id === 'user-2' && paymentDetails) { // Create some variation for demo
         paymentDetails.totalPaid = 20000 + 12500;
         paymentDetails.installments = paymentDetails.installments.map((p, i) => i < 2 ? {...p, status: 'Paid'} : {...p, status: 'Unpaid'});
    }
    return {
        ...student,
        paymentDetails
    }
});


export function AdminPaymentManager() {
    const [studentPayments, setStudentPayments] = useState<StudentPayment[]>(initialStudentPayments);
    const [selectedStudent, setSelectedStudent] = useState<StudentPayment | null>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [pendingInstallments, setPendingInstallments] = useState<Installment[]>([]);
    const { toast } = useToast();

    const handleOpenDialog = (student: StudentPayment) => {
        if (!student.paymentDetails) return;
        setSelectedStudent(student);
        // Deep copy to avoid direct state mutation before saving
        setPendingInstallments(JSON.parse(JSON.stringify(student.paymentDetails.installments)));
        setIsDialogOpen(true);
    };

    const handleInstallmentToggle = (installmentName: string) => {
        setPendingInstallments(prev => prev.map(inst =>
            inst.name === installmentName
                ? { ...inst, status: inst.status === 'Paid' ? 'Unpaid' : 'Paid' }
                : inst
        ));
    };

    const handleSaveChanges = () => {
        if (!selectedStudent || !selectedStudent.paymentDetails) return;
        
        setIsSubmitting(true);
        // Simulate API call
        setTimeout(() => {
            const newTotalPaid = pendingInstallments
                .filter(i => i.status === 'Paid')
                .reduce((sum, i) => sum + i.amount, 0);

            const updatedPaymentDetails: PaymentDetails = {
                ...selectedStudent.paymentDetails!,
                installments: pendingInstallments,
                totalPaid: newTotalPaid,
            };

            setStudentPayments(prev => prev.map(sp =>
                sp.id === selectedStudent.id
                    ? { ...sp, paymentDetails: updatedPaymentDetails }
                    : sp
            ));

            setIsSubmitting(false);
            setIsDialogOpen(false);
            setSelectedStudent(null);
            toast({
                title: "Payment Updated",
                description: `Payment record for ${selectedStudent.name} has been successfully updated.`,
            });
        }, 500);
    };


    const currencyFormatter = new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "FBU",
        minimumFractionDigits: 0,
    });
    
  return (
    <>
      <div className="mb-4 flex items-center justify-between">
          <div className="relative w-full max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"/>
              <Input placeholder="Filter by name or email..." className="pl-9"/>
          </div>
      </div>
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Student</TableHead>
              <TableHead>Course</TableHead>
              <TableHead>Payment Progress</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {studentPayments.map((student) => {
              if (!student.paymentDetails) {
                 return (
                    <TableRow key={student.id}>
                        <TableCell>
                            <div className="font-medium">{student.name}</div>
                            <div className="text-sm text-muted-foreground">
                            {student.email}
                            </div>
                        </TableCell>
                        <TableCell colSpan={4} className="text-muted-foreground">No payment records found.</TableCell>
                    </TableRow>
                 )
              }
              const { totalPaid, totalDue } = student.paymentDetails;
              const progress = (totalPaid / totalDue) * 100;
              const isFullyPaid = progress >= 100;
              const course = MOCK_COURSES.find(c => c.id === student.paymentDetails!.courseId);

              return (
                <TableRow key={student.id}>
                  <TableCell>
                    <div className="font-medium">{student.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {student.email}
                    </div>
                  </TableCell>
                  <TableCell>{course?.title}</TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <Progress value={progress} />
                      <span className="text-xs text-muted-foreground">{currencyFormatter.format(totalPaid)} / {currencyFormatter.format(totalDue)}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={isFullyPaid ? "default" : progress > 0 ? "secondary" : "outline"}>
                      {isFullyPaid ? "Fully Paid" : progress > 0 ? "Partial" : "Unpaid"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" size="sm" onClick={() => handleOpenDialog(student)}>
                      Update Payment
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Payment Record for {selectedStudent?.name}</DialogTitle>
            <DialogDescription>
              Mark installments as paid and upload proof of payment. The student will be notified.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <p className="font-medium">Installments:</p>
            <div className="space-y-2">
            {pendingInstallments.map(inst => (
                <div key={inst.name} className={cn("flex items-center justify-between rounded-md border p-3 transition-colors", inst.status === 'Paid' && 'bg-primary/10')}>
                    <div className="flex items-center gap-3">
                         <Checkbox
                            id={`inst-${inst.name}`}
                            checked={inst.status === 'Paid'}
                            onCheckedChange={() => handleInstallmentToggle(inst.name)}
                         />
                         <div>
                            <Label htmlFor={`inst-${inst.name}`} className="font-medium">{inst.name}</Label>
                            <p className="text-sm text-muted-foreground">{currencyFormatter.format(inst.amount)}</p>
                        </div>
                    </div>
                    <Badge className={cn(statusColors[inst.status])}>
                        {inst.status}
                    </Badge>
                </div>
            ))}
            </div>
             <div className="grid w-full max-w-sm items-center gap-1.5 mt-4">
                <Label htmlFor="payment-proof">Payment Proof (Receipt)</Label>
                <div className="flex items-center gap-2">
                    <Input id="payment-proof" type="file" className="flex-1"/>
                    <Button size="icon" variant="outline"><FileUp className="h-4 w-4"/></Button>
                </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveChanges} disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

