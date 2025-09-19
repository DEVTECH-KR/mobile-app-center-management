
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

const getInitialStudentPayments = (): StudentPayment[] => allStudents.map(student => {
    let paymentDetails: PaymentDetails | null = null;
    
    // In a real app, you'd fetch this from a DB.
    // Here we assign payment details to student 'user-1' and a modified version to 'user-2'
    if (student.id === 'user-1') {
        paymentDetails = JSON.parse(JSON.stringify(MOCK_PAYMENTS));
    } else if (student.id === 'user-2') {
         const courseForUser2 = MOCK_COURSES.find(c => student.enrolledCourseIds?.includes(c.id));
         if(courseForUser2) {
             const installmentAmount = courseForUser2.price / 4;
             paymentDetails = {
                 userId: 'user-2',
                 courseId: courseForUser2.id,
                 registrationFee: 20000,
                 totalDue: 20000 + courseForUser2.price,
                 totalPaid: 20000 + installmentAmount,
                 installments: [
                    { name: 'Registration Fee', amount: 20000, status: 'Paid', dueDate: '2024-02-01' },
                    { name: 'Installment 1', amount: installmentAmount, status: 'Paid', dueDate: '2024-02-01' },
                    { name: 'Installment 2', amount: installmentAmount, status: 'Unpaid', dueDate: '2024-03-01' },
                    { name: 'Installment 3', amount: installmentAmount, status: 'Unpaid', dueDate: '2024-04-01' },
                    { name: 'Installment 4', amount: installmentAmount, status: 'Unpaid', dueDate: '2024-05-01' },
                 ]
             };
         }
    }
    
    return {
        ...student,
        paymentDetails
    }
});


export function AdminPaymentManager() {
    const [studentPayments, setStudentPayments] = useState<StudentPayment[]>(getInitialStudentPayments());
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

            // This is where you would persist the changes to your backend
            // For now, we update the local state
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
              const course = MOCK_COURSES.find(c => student.paymentDetails?.courseId === c.id);

              if (!student.paymentDetails) {
                 return (
                    <TableRow key={student.id}>
                        <TableCell>
                            <div className="font-medium">{student.name}</div>
                            <div className="text-sm text-muted-foreground">
                            {student.email}
                            </div>
                        </TableCell>
                         <TableCell>{MOCK_COURSES.find(c => student.enrolledCourseIds?.includes(c.id))?.title || 'N/A'}</TableCell>
                        <TableCell colSpan={3} className="text-muted-foreground text-center">No payment records found.</TableCell>
                    </TableRow>
                 )
              }
              const { totalPaid, totalDue } = student.paymentDetails;
              const progress = totalDue > 0 ? (totalPaid / totalDue) * 100 : 0;
              const isFullyPaid = progress >= 100;
              
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
              Mark installments as paid. The student's payment status will be updated accordingly.
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
                <Label htmlFor="payment-proof">Payment Proof (Optional)</Label>
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
