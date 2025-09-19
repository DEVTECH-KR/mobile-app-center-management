
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
import { MOCK_USERS, MOCK_PAYMENTS, MOCK_COURSES, MOCK_CLASSES } from "@/lib/mock-data";
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
import type { Installment, PaymentDetails, User, Class, Course } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { statusColors } from "./payment-status";
import { Checkbox } from "../ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";


type StudentEnrollment = {
    user: User;
    class: Class;
    course: Course;
    paymentDetails: PaymentDetails | null;
}

const createInitialEnrollments = (): StudentEnrollment[] => {
    const enrollments: StudentEnrollment[] = [];
    const allUsers = Object.values(MOCK_USERS);

    allUsers.forEach(user => {
        if (user.role === 'student' && user.classIds) {
            user.classIds.forEach(classId => {
                const cls = MOCK_CLASSES.find(c => c.id === classId);
                if (cls) {
                    const course = MOCK_COURSES.find(c => c.id === cls.courseId);
                    if (course) {
                         // Find or create payment details for this specific enrollment
                         let paymentDetails: PaymentDetails | null = null;
                         if (user.id === 'user-1' && course.id === 'course-1') {
                            paymentDetails = JSON.parse(JSON.stringify(MOCK_PAYMENTS));
                         } else { // Create some default/mock payment details for others
                             const totalDue = course.price + 20000; // price + registration
                             paymentDetails = {
                                userId: user.id,
                                courseId: course.id,
                                registrationFee: 20000,
                                totalDue: totalDue,
                                totalPaid: 0,
                                installments: [
                                    { name: 'Registration Fee', amount: 20000, status: 'Unpaid', dueDate: '2024-08-01' },
                                    { name: 'Installment 1', amount: course.price / 4, status: 'Unpaid', dueDate: '2024-09-01' },
                                    { name: 'Installment 2', amount: course.price / 4, status: 'Unpaid', dueDate: '2024-10-01' },
                                    { name: 'Installment 3', amount: course.price / 4, status: 'Unpaid', dueDate: '2024-11-01' },
                                    { name: 'Installment 4', amount: course.price / 4, status: 'Unpaid', dueDate: '2024-12-01' },
                                ]
                             };
                             if (user.id === 'user-2') { // Give student2 a partially paid status
                                 paymentDetails.totalPaid = 20000 + (course.price / 4);
                                 paymentDetails.installments[0].status = 'Paid';
                                 paymentDetails.installments[1].status = 'Paid';
                             }
                         }

                        enrollments.push({
                            user,
                            class: cls,
                            course,
                            paymentDetails,
                        });
                    }
                }
            });
        }
    });

    return enrollments;
}


export function AdminPaymentManager() {
    const [enrollments, setEnrollments] = useState<StudentEnrollment[]>(createInitialEnrollments());
    const [selectedEnrollment, setSelectedEnrollment] = useState<StudentEnrollment | null>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [pendingInstallments, setPendingInstallments] = useState<Installment[]>([]);
    const [filter, setFilter] = useState({classId: 'all', searchTerm: ''});
    const { toast } = useToast();

    const handleOpenDialog = (enrollment: StudentEnrollment) => {
        if (!enrollment.paymentDetails) return;
        setSelectedEnrollment(enrollment);
        setPendingInstallments(JSON.parse(JSON.stringify(enrollment.paymentDetails.installments)));
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
        if (!selectedEnrollment || !selectedEnrollment.paymentDetails) return;
        
        setIsSubmitting(true);
        setTimeout(() => {
            const newTotalPaid = pendingInstallments
                .filter(i => i.status === 'Paid')
                .reduce((sum, i) => sum + i.amount, 0);

            const updatedPaymentDetails: PaymentDetails = {
                ...selectedEnrollment.paymentDetails!,
                installments: pendingInstallments,
                totalPaid: newTotalPaid,
            };

            setEnrollments(prev => prev.map(e =>
                (e.user.id === selectedEnrollment.user.id && e.class.id === selectedEnrollment.class.id)
                    ? { ...e, paymentDetails: updatedPaymentDetails }
                    : e
            ));

            setIsSubmitting(false);
            setIsDialogOpen(false);
            setSelectedEnrollment(null);
            toast({
                title: "Payment Updated",
                description: `Payment record for ${selectedEnrollment.user.name} has been successfully updated.`,
            });
        }, 500);
    };

    const currencyFormatter = new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "FBU",
        minimumFractionDigits: 0,
    });

    const filteredEnrollments = enrollments.filter(e => {
        const matchesClass = filter.classId === 'all' || e.class.id === filter.classId;
        const matchesSearch = filter.searchTerm === '' ||
            e.user.name.toLowerCase().includes(filter.searchTerm.toLowerCase()) ||
            e.user.email.toLowerCase().includes(filter.searchTerm.toLowerCase());
        return matchesClass && matchesSearch;
    });
    
  return (
    <>
      <div className="mb-4 flex flex-col md:flex-row items-center gap-4">
          <div className="relative w-full md:max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"/>
              <Input
                placeholder="Filter by student name or email..."
                className="pl-9"
                value={filter.searchTerm}
                onChange={(e) => setFilter(prev => ({...prev, searchTerm: e.target.value}))}
              />
          </div>
          <Select value={filter.classId} onValueChange={(value) => setFilter(prev => ({...prev, classId: value}))}>
              <SelectTrigger className="w-full md:w-[280px]">
                  <SelectValue placeholder="Filter by class" />
              </SelectTrigger>
              <SelectContent>
                  <SelectItem value="all">All Classes</SelectItem>
                  {MOCK_CLASSES.map(c => {
                      const course = MOCK_COURSES.find(co => co.id === c.courseId);
                      return <SelectItem key={c.id} value={c.id}>{c.name} ({course?.title})</SelectItem>
                  })}
              </SelectContent>
          </Select>
      </div>
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Student</TableHead>
              <TableHead>Class</TableHead>
              <TableHead>Payment Progress</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredEnrollments.length === 0 && (
                <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">No results found.</TableCell>
                </TableRow>
            )}
            {filteredEnrollments.map((enrollment) => {
              const { user, course, class: cls, paymentDetails } = enrollment;

              if (!paymentDetails) {
                 return (
                    <TableRow key={`${user.id}-${cls.id}`}>
                        <TableCell>
                            <div className="flex items-center gap-3">
                                <Avatar>
                                    <AvatarImage src={user.avatarUrl} alt={user.name} />
                                    <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div>
                                    <div className="font-medium">{user.name}</div>
                                    <div className="text-sm text-muted-foreground">{user.email}</div>
                                </div>
                            </div>
                        </TableCell>
                         <TableCell>{cls.name} ({course.title})</TableCell>
                        <TableCell colSpan={3} className="text-muted-foreground text-center">No payment records found.</TableCell>
                    </TableRow>
                 )
              }
              const { totalPaid, totalDue } = paymentDetails;
              const progress = totalDue > 0 ? (totalPaid / totalDue) * 100 : 0;
              const isFullyPaid = progress >= 100;
              
              return (
                <TableRow key={`${user.id}-${cls.id}`}>
                  <TableCell>
                     <div className="flex items-center gap-3">
                        <Avatar>
                            <AvatarImage src={user.avatarUrl} alt={user.name} />
                            <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                            <div className="font-medium">{user.name}</div>
                            <div className="text-sm text-muted-foreground">{user.email}</div>
                        </div>
                    </div>
                  </TableCell>
                  <TableCell>
                      <div className="font-medium">{cls.name}</div>
                      <div className="text-sm text-muted-foreground">{course.title} - {cls.level}</div>
                  </TableCell>
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
                    <Button variant="outline" size="sm" onClick={() => handleOpenDialog(enrollment)}>
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
            <DialogTitle>Update Payment for {selectedEnrollment?.user.name}</DialogTitle>
            <DialogDescription>
              Course: {selectedEnrollment?.course.title} - {selectedEnrollment?.class.level}
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

    