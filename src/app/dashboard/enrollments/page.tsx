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
import { FilePen, MoreVertical, Search, CheckCircle, XCircle, Hourglass, FilterX } from "lucide-react";
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
import Link from 'next/link';
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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

// ✅ Interface pour les filtres
interface EnrollmentFilters {
  searchTerm: string;
  status: EnrollmentStatus | 'all';
  month: string;
  year: string;
}

export default function EnrollmentRequestsPage() {
    const { user, token } = useAuth(); 
    const [requests, setRequests] = useState<PopulatedEnrollment[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filters, setFilters] = useState<EnrollmentFilters>({
      searchTerm: '',
      status: 'all',
      month: 'all',
      year: 'all'
    });
    const [selectedRequest, setSelectedRequest] = useState<PopulatedEnrollment | null>(null);
    
    useEffect(() => {
        if (user) {
            fetchRequests();
        }
    }, [user, token]);

    const fetchRequests = async () => {
        setIsLoading(true);
        try {
            const response = await fetch('/api/enrollments', {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            });
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
            // Filtre par recherche
            const matchesSearch = filters.searchTerm === '' ||
              request.studentId.name.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
              request.studentId.email.toLowerCase().includes(filters.searchTerm.toLowerCase());

            // Filtre par statut
            const matchesStatus = filters.status === 'all' || request.status === filters.status;

            // Filtre par mois
            const requestMonth = format(request.requestDate, 'yyyy-MM');
            const matchesMonth = filters.month === 'all' || requestMonth === `${filters.year}-${filters.month}`;

            // Filtre par année
            const requestYear = format(request.requestDate, 'yyyy');
            const matchesYear = filters.year === 'all' || requestYear === filters.year;

            return matchesSearch && matchesStatus && matchesMonth && matchesYear;
        });
    }, [requests, filters]);

    // ✅ Obtenir les années et mois uniques disponibles
    const availableYears = useMemo(() => {
      const years = [...new Set(requests.map(request => format(request.requestDate, 'yyyy')))];
      return years.sort().reverse();
    }, [requests]);

    const availableMonths = useMemo(() => {
      if (filters.year === 'all') return [];
      const months = [...new Set(
        requests
          .filter(request => format(request.requestDate, 'yyyy') === filters.year)
          .map(request => format(request.requestDate, 'MM'))
      )];
      return months.sort().reverse();
    }, [requests, filters.year]);

    // ✅ Effacer tous les filtres
    const clearFilters = () => {
      setFilters({
        searchTerm: '',
        status: 'all',
        month: 'all',
        year: 'all'
      });
    };

    // ✅ Vérifier s'il y a des filtres actifs
    const hasActiveFilters = filters.searchTerm !== '' || 
                           filters.status !== 'all' || 
                           filters.month !== 'all' || 
                           filters.year !== 'all';

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

            {/* Statistiques rapides */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Total</p>
                      <p className="text-2xl font-bold">{requests.length}</p>
                    </div>
                    <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                      <span className="text-sm font-medium text-blue-600">All</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Pending</p>
                      <p className="text-2xl font-bold">
                        {requests.filter(r => r.status === 'pending').length}
                      </p>
                    </div>
                    <div className="h-8 w-8 rounded-full bg-yellow-100 flex items-center justify-center">
                      <Hourglass className="h-4 w-4 text-yellow-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Approved</p>
                      <p className="text-2xl font-bold">
                        {requests.filter(r => r.status === 'approved').length}
                      </p>
                    </div>
                    <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Rejected</p>
                      <p className="text-2xl font-bold">
                        {requests.filter(r => r.status === 'rejected').length}
                      </p>
                    </div>
                    <div className="h-8 w-8 rounded-full bg-red-100 flex items-center justify-center">
                      <XCircle className="h-4 w-4 text-red-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* ✅ Filtres améliorés */}
            <Card className="mb-6">
              <CardContent className="p-4">
                <div className="flex flex-col gap-4">
                  {/* Ligne 1: Barre de recherche */}
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="relative flex-1">
                      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="search"
                        placeholder="Search by name or email..."
                        className="w-full rounded-lg bg-background pl-8"
                        value={filters.searchTerm}
                        onChange={(e) => setFilters(prev => ({ ...prev, searchTerm: e.target.value }))}
                      />
                    </div>
                    
                    {hasActiveFilters && (
                      <Button variant="outline" onClick={clearFilters} className="shrink-0">
                        <FilterX className="h-4 w-4 mr-2" />
                        Clear
                      </Button>
                    )}
                  </div>

                  {/* Ligne 2: Filtres par statut, mois et année */}
                  <div className="flex flex-col sm:flex-row gap-3">
                    {/* Filtre par statut */}
                    <div className="flex-1">
                      <Select
                        value={filters.status}
                        onValueChange={(value: EnrollmentStatus | 'all') => 
                          setFilters(prev => ({ ...prev, status: value }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Filter by status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Status</SelectItem>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="approved">Approved</SelectItem>
                          <SelectItem value="rejected">Rejected</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Filtre par année */}
                    <div className="flex-1">
                      <Select
                        value={filters.year}
                        onValueChange={(value) => {
                          setFilters(prev => ({ 
                            ...prev, 
                            year: value,
                            month: value === 'all' ? 'all' : prev.month // Réinitialiser le mois si année = all
                          }));
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Filter by year" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Years</SelectItem>
                          {availableYears.map(year => (
                            <SelectItem key={year} value={year}>{year}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Filtre par mois */}
                    <div className="flex-1">
                      <Select
                        value={filters.month}
                        onValueChange={(value) => setFilters(prev => ({ ...prev, month: value }))}
                        disabled={filters.year === 'all'}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={filters.year === 'all' ? "Select year first" : "Filter by month"} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Months</SelectItem>
                          {availableMonths.map(month => {
                            const monthNames = [
                              'January', 'February', 'March', 'April', 'May', 'June',
                              'July', 'August', 'September', 'October', 'November', 'December'
                            ];
                            return (
                              <SelectItem key={month} value={month}>
                                {monthNames[parseInt(month) - 1]}
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tableau */}
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
                        {filteredRequests.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={5} className="h-24 text-center">
                              {requests.length === 0 ? "No enrollment requests found" : "No results with current filters"}
                            </TableCell>
                          </TableRow>
                        ) : (
                          filteredRequests.map((request) => {
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
                                        <Button variant="outline" asChild>
                                            <Link href={`/dashboard/enrollments/${request._id}`}>
                                                View Details
                                            </Link>
                                        </Button>
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