
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
import { MOCK_ENROLLMENT_REQUESTS, MOCK_USERS } from "@/lib/mock-data";
import type { EnrollmentRequest, EnrollmentStatus, User } from "@/lib/types";
import { useState, useMemo } from "react";
import { format } from "date-fns";
import { Input } from "@/components/ui/input";


const allUsers = Object.values(MOCK_USERS);

const statusVariant: Record<EnrollmentStatus, { variant: "default" | "secondary" | "outline" | "destructive", icon: React.ElementType }> = {
    approved: { variant: "default", icon: CheckCircle },
    pending: { variant: "secondary", icon: Hourglass },
    rejected: { variant: "destructive", icon: XCircle },
}

// In a real app, this would come from an auth context
const userRole = MOCK_USERS.admin.role;

export default function EnrollmentRequestsPage() {
    const [requests, setRequests] = useState<EnrollmentRequest[]>(MOCK_ENROLLMENT_REQUESTS);
    const [searchTerm, setSearchTerm] = useState('');
    
    const updateRequestStatus = (requestId: string, status: EnrollmentStatus) => {
        setRequests(prev => prev.map(r => r.id === requestId ? {...r, status } : r));
    }
    
    const filteredRequests = useMemo(() => {
        return requests.filter(request => {
            const user = allUsers.find(u => u.id === request.userId);
            if (!user) return false;
            return user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                   user.email.toLowerCase().includes(searchTerm.toLowerCase())
        });
    }, [requests, searchTerm]);


    if (userRole !== 'admin') {
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
            {filteredRequests.map((request) => {
              const user = allUsers.find((u) => u.id === request.userId);
              const { icon: StatusIcon, variant: statusBadgeVariant } = statusVariant[request.status];

              if (!user) return null;

              return(
                <TableRow key={request.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={user.avatarUrl} alt={user.name} />
                        <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{user.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {user.email}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{request.courseTitle}</TableCell>
                  <TableCell>{format(new Date(request.requestDate as string), "MMM d, yyyy 'at' h:mm a")}</TableCell>
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
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
