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
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FileUp, Search } from "lucide-react";
import { useState } from "react";
import type { Installment } from "@/lib/types";

// In a real app, this would be a list of all students
const allStudents = [MOCK_USERS.student, { ...MOCK_USERS.student, id: 'user-2', name: 'Jane Smith', email: 'jane@example.com' }];

const studentPayments = allStudents.map(student => ({
    ...student,
    paymentDetails: {
        ...MOCK_PAYMENTS,
        totalPaid: student.id === 'user-2' ? 20000 + 12500 : MOCK_PAYMENTS.totalPaid,
        installments: student.id === 'user-2' ? MOCK_PAYMENTS.installments.map((p, i) => i < 2 ? {...p, status: 'Paid'} : {...p, status: 'Unpaid'}) : MOCK_PAYMENTS.installments
    }
}))


export function AdminPaymentManager() {
    const [selectedInstallments, setSelectedInstallments] = useState<Installment[]>([]);
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    const handleOpenDialog = (installments: Installment[]) => {
        setSelectedInstallments(installments);
        setIsDialogOpen(true);
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
              const { totalPaid, totalDue } = student.paymentDetails;
              const progress = (totalPaid / totalDue) * 100;
              const isFullyPaid = progress >= 100;
              const course = MOCK_COURSES.find(c => c.id === student.paymentDetails.courseId);

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
                    <Badge variant={isFullyPaid ? "default" : "secondary"}>
                      {isFullyPaid ? "Fully Paid" : "Partial"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" size="sm" onClick={() => handleOpenDialog(student.paymentDetails.installments)}>
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
            <DialogTitle>Update Payment Record</DialogTitle>
            <DialogDescription>
              Record an in-person payment and upload proof. The student will be
              notified.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {/* A real implementation would have a form here */}
            <p className="font-medium">Installments:</p>
            {selectedInstallments.map(inst => (
                <div key={inst.name} className="flex justify-between items-center">
                    <span>{inst.name} ({currencyFormatter.format(inst.amount)})</span>
                    <Badge variant={inst.status === 'Paid' ? 'default' : 'outline'}>{inst.status}</Badge>
                </div>
            ))}
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
            <Button onClick={() => setIsDialogOpen(false)}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
