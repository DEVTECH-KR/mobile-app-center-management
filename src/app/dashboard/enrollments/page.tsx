
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
import { FilePen, MoreVertical, Search, CheckCircle, XCircle, Hourglass, Loader2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { EnrollmentRequest, EnrollmentStatus, User } from "@/lib/types";
import { useState, useMemo, useEffect } from "react";
import { format } from "date-fns";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/auth-context";
import { db } from "@/lib/firebase";
import { collection, getDocs, doc, updateDoc, Timestamp } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";


const statusVariant: Record<EnrollmentStatus, { variant: "default" | "secondary" | "outline" | "destructive", icon: React.ElementType }> = {
    approved: { variant: "default", icon: CheckCircle },
    pending: { variant: "secondary", icon: Hourglass },
    rejected: { variant: "destructive", icon: XCircle },
}

export default function EnrollmentRequestsPage() {
    const { userProfile } = useAuth();
    const [requests, setRequests] = useState<EnrollmentRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const { toast } = useToast();

    useEffect(() => {
        const fetchRequests = async () => {
            setLoading(true);
            try {
                const requestsCollection = collection(db, "enrollmentRequests");
                const requestsSnapshot = await getDocs(requestsCollection);
                const requestsList = requestsSnapshot.docs.map(doc => {
                    const data = doc.data();
                    return { 
                        id: doc.id, 
                        ...data,
                        requestDate: (data.requestDate as Timestamp).toDate(),
                    } as EnrollmentRequest;
                });
                setRequests(requestsList);
            } catch (error) {
                console.error("Error fetching enrollment requests:", error);
                toast({ title: "Error", description: "Could not fetch requests.", variant: "destructive"});
            } finally {
                setLoading(false);
            }
        };

        fetchRequests();
    }, [toast]);


    const updateRequestStatus = async (requestId: string, status: EnrollmentStatus) => {
        try {
            const requestRef = doc(db, "enrollmentRequests", requestId);
            await updateDoc(requestRef, { status });

            // Also update the student's enrolled courses if approved
            if (status === 'approved') {
                const request = requests.find(r => r.id === requestId);
                if (request) {
                    const userRef = doc(db, "users", request.userId);
                    // This is a simplified update. A real app would use arrayUnion.
                    // For now, we fetch, update, and set.
                    const userSnap = await getDocs(collection(db, "users"));
                    const userToUpdate = userSnap.docs.find(d => d.id === request.userId)?.data() as User;
                    const currentCourses = userToUpdate.enrolledCourseIds || [];
                    if (!currentCourses.includes(request.courseId)) {
                         await updateDoc(userRef, {
                            enrolledCourseIds: [...currentCourses, request.courseId]
                         });
                    }
                }
            }

            setRequests(prev => prev.map(r => r.id === requestId ? {...r, status } : r));
            toast({
                title: `Request ${status.charAt(0).toUpperCase() + status.slice(1)}`,
                description: `The enrollment request has been ${status}.`,
            })
        } catch (error) {
            console.error(`Error updating request to ${status}:`, error);
            toast({ title: "Error", description: "Could not update request status.", variant: "destructive"});
        }
    }
    
    const filteredRequests = useMemo(() => {
        const lowercasedTerm = searchTerm.toLowerCase();
        return requests.filter(request => {
            return request.userName.toLowerCase().includes(lowercasedTerm) ||
                   request.userEmail.toLowerCase().includes(lowercasedTerm)
        });
    }, [requests, searchTerm]);


    if (userProfile?.role !== 'admin') {
        return (
            <div className="flex items-center justify-center h-full">
                <p className="text-muted-foreground">You do not have permission to access this page.</p>
            </div>
        )
    }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
            <h2 className="text-3xl font-bold font-headline tracking-tight">
            Enrollment Requests
            </h2>
            <p className="text-muted-foreground">
                View and process new student enrollment requests.
            </p>
        </div>
      </div>

      <div className="mb-4 flex items-center justify-between">
          <div className="relative w-full max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"/>
              <Input
                placeholder="Filter by student name or email..."
                className="pl-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
          </div>
      </div>
      
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Requester</TableHead>
              <TableHead>Course</TableHead>
              <TableHead>Request Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
             {loading ? (
                 <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                        <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground"/>
                    </TableCell>
                </TableRow>
            ) : filteredRequests.length === 0 ? (
                <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                        No enrollment requests found.
                    </TableCell>
                </TableRow>
            ) : (
                filteredRequests.map((request) => {
                const { icon: StatusIcon, variant: statusBadgeVariant } = statusVariant[request.status];

                return(
                    <TableRow key={request.id}>
                    <TableCell>
                        <div className="flex items-center gap-3">
                        {/* Avatar could be added if user profile pics are available */}
                        <Avatar className="h-9 w-9">
                            <AvatarFallback>{request.userName.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                            <div className="font-medium">{request.userName}</div>
                            <div className="text-sm text-muted-foreground">
                            {request.userEmail}
                            </div>
                        </div>
                        </div>
                    </TableCell>
                    <TableCell>{request.courseTitle}</TableCell>
                    <TableCell>{format(new Date(request.requestDate), "MMM d, yyyy 'at' h:mm a")}</TableCell>
                    <TableCell>
                        <Badge variant={statusBadgeVariant} className="capitalize flex items-center gap-1.5">
                            <StatusIcon className="h-3.5 w-3.5" />
                            {request.status}
                        </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                        {request.status === 'pending' ? (
                            <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                <MoreVertical className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuItem onClick={() => updateRequestStatus(request.id!, 'approved')}>
                                    <CheckCircle className="mr-2 h-4 w-4" />
                                    Approve
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => updateRequestStatus(request.id!, 'rejected')} className="text-destructive">
                                    <XCircle className="mr-2 h-4 w-4" />
                                    Reject
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                            </DropdownMenu>
                        ) : (
                            <Button variant="outline" size="sm" disabled>Processed</Button>
                        )}
                    </TableCell>
                    </TableRow>
                )
                })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

    