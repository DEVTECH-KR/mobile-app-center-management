// src/app/dashboard/enrollments/page.tsx
'use client';
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
import { FilePen, MoreVertical, Search, CheckCircle, XCircle, Hourglass } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { IEnrollment } from '@/server/api/enrollments/enrollment.schema';
import type { IUser } from '@/server/api/auth/user.schema';
import { useState, useEffect, useMemo } from "react";
import { format } from "date-fns";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/lib/auth";
import { Loader2 } from "lucide-react";
import { AdminEnrollmentManager } from "@/components/enrollments/admin-enrollment-manager";
import { Dialog, DialogContent } from "@/components/ui/dialog";

type EnrollmentStatus = IEnrollment['status'];

// ✅ Type pour les enrollments peuplés
type PopulatedEnrollment = Omit<IEnrollment, 'studentId' | 'courseId'> & {
  studentId: {
    _id: string;
    name: string;
    email: string;
    avatarUrl?: string;
  };
  courseId: {
    _id: string;
    title: string;
    price: number;
  };
};

const statusVariant: Record<EnrollmentStatus, { variant: "default" | "secondary" | "outline" | "destructive", icon: React.ElementType }> = {
    approved: { variant: "default", icon: CheckCircle },
    pending: { variant: "secondary", icon: Hourglass },
    rejected: { variant: "destructive", icon: XCircle },
}

export default function EnrollmentRequestsPage() {
    const { user } = useAuth(); 
    const [requests, setRequests] = useState<PopulatedEnrollment[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedRequest, setSelectedRequest] = useState<PopulatedEnrollment | null>(null);
    
    useEffect(() => {
        if (user) {
            fetchRequests();
        }
    }, [user]);

    const fetchRequests = async () => {
        setIsLoading(true);
        try {
            const response = await fetch('/api/enrollments');
            if (!response.ok) throw new Error();
            const data = await response.json();
            setRequests(data);
        } catch {
            // Handle error
        } finally {
            setIsLoading(false);
        }
    };

    const filteredRequests = useMemo(() => {
        return requests.filter(request => {
            return request.studentId.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                   request.studentId.email.toLowerCase().includes(searchTerm.toLowerCase())
        });
    }, [requests, searchTerm]);

    if (isLoading) {
        return <Loader2 className="animate-spin" />;
    }

    if (user?.role !== 'admin') {
        return (
            <div className="flex items-center justify-center h-full">
                <p className="text-muted-foreground">You do not have permission to access this page.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-3xl font-bold font-headline tracking-tight">
                    Enrollment Requests
                </h2>
                <p className="text-muted-foreground">
                    Manage student enrollment requests for courses.
                </p>
            </div>

            <div className="flex items-center gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        type="search"
                        placeholder="Search by name or email..."
                        className="w-full rounded-lg bg-background pl-8"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Student</TableHead>
                            <TableHead>Course</TableHead>
                            <TableHead>Request Date</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredRequests.map((request) => {
                            const StatusIcon = statusVariant[request.status].icon;
                            const statusBadgeVariant = statusVariant[request.status].variant;

                            return (
                                <TableRow key={String(request._id)}>
                                    <TableCell>
                                        <div className="flex items-center space-x-3">
                                            <Avatar className="h-8 w-8">
                                                <AvatarImage src={request.studentId.avatarUrl} />
                                                <AvatarFallback>{request.studentId.name.charAt(0)}</AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <div className="font-medium">{request.studentId.name}</div>
                                                <div className="text-sm text-muted-foreground">{request.studentId.email}</div>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>{request.courseId.title}</TableCell>
                                    <TableCell>{format(request.requestDate, "MMM d, yyyy 'at' h:mm a")}</TableCell>
                                    <TableCell>
                                        <Badge variant={statusBadgeVariant} className="capitalize flex items-center gap-1.5">
                                            <StatusIcon className="h-3.5 w-3.5" />
                                            {request.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="outline" onClick={() => setSelectedRequest(request)}>
                                            <FilePen className="mr-2 h-4 w-4" />
                                            Manage
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            )
                        })}
                    </TableBody>
                </Table>
            </div>

            <Dialog open={!!selectedRequest} onOpenChange={() => setSelectedRequest(null)}>
                <DialogContent>
                    {selectedRequest && (
                        <AdminEnrollmentManager 
                            enrollment={selectedRequest}
                            onStatusUpdate={() => {
                                fetchRequests();
                                setSelectedRequest(null);
                            }}
                        />
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}