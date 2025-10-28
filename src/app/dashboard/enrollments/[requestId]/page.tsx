// src/app/dashboard/enrollments/[requestId]/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Loader2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { classesApi } from '@/lib/api/classes.api';
import { useAuth } from '@/lib/auth';
import { format } from "date-fns";

type PopulatedEnrollment = {
  _id: string;
  studentId: {
    _id: string;
    name: string;
    email: string;
    avatarUrl?: string;
    gender?: string;
    nationality?: string;
    educationLevel?: string;
    university?: string;
    address?: string;
    phone?: string;
  };
  courseId: {
    _id: string;
    title: string;
    description: string;
    price: number;
    days: string[];
    levels: string[];
    teacherIds: Array<{
      _id: string;
      name: string;
      email: string;
      avatarUrl?: string;
    }>;
    imageUrl?: string;
  };
  preferredLevel?: string;
  status: 'pending' | 'approved' | 'rejected';
  requestDate: string;
  approvalDate?: string;
  assignedClassId?: {
    _id: string;
    name: string;
    level: string;
    schedule?: string;
  };
  adminNotes?: string;
  registrationFeePaid: boolean;
  paymentDate?: string;
};

export default function EnrollmentRequestDetails() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();
  const requestId = params.requestId as string;

  const [request, setRequest] = useState<PopulatedEnrollment | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessDialogOpen, setIsProcessDialogOpen] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [classes, setClasses] = useState<any[]>([]);
  const [isLoadingClasses, setIsLoadingClasses] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<'approve' | 'reject' | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  useEffect(() => {
    fetchRequestDetails();
  }, [requestId]);

  const fetchRequestDetails = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/enrollments/${requestId}`);
      if (!response.ok) throw new Error('Failed to fetch request details');
      const data = await response.json();
      setRequest(data);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load request details",
      });
      router.push('/dashboard/enrollments');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAvailableClasses = async () => {
    setIsLoadingClasses(true);
    try {
      let preferredLevel = request?.preferredLevel;

      if (!preferredLevel) {
        preferredLevel = undefined;
      }

      const availableClasses = await classesApi.getAvailableForEnrollment(
        request?.courseId._id, 
        preferredLevel
      );
      setClasses(availableClasses);

    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load available classes",
      });
    } finally {
      setIsLoadingClasses(false);
    }
  };

  const handleProcess = (newStatus: 'approve' | 'reject') => {
    setStatus(newStatus);
    setIsProcessDialogOpen(true);
    if (newStatus === 'approve') {
      fetchAvailableClasses();
    }
  };

  const handleSubmitProcess = async () => {
    if (!user?.id) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "User not authenticated or user ID not found",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const endpoint = status === 'approve' 
        ? `/api/enrollments/${requestId}/approve`
        : `/api/enrollments/${requestId}/reject`;

      const body = status === 'approve'
        ? { 
            requestId: requestId, 
            classId: selectedClass, 
            adminNotes, 
            assignedBy: user.id 
          }
        : { 
            requestId: requestId, 
            adminNotes, 
            assignedBy: user.id 
          };

      console.log('Sending request with body:', body); 

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to process request');
      }

      toast({
        title: "Success",
        description: `Request ${status}ed successfully.`,
      });

      router.push('/dashboard/enrollments');
    } catch (error: any) {
      console.error('Process request error:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to process request.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    try {
      if (!user?.id) {
        throw new Error('User not authenticated');
      }

      const response = await fetch(`/api/enrollments/${requestId}`, { 
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deletedBy: user.id })
      });
      
      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch {
          throw new Error(`Failed to delete request (status: ${response.status})`);
        }
        
        // Gestion spécifique des demandes approuvées
        if (errorData.error?.includes('Cannot delete an approved enrollment request')) {
          throw new Error('Cannot delete an approved enrollment request for accounting reasons.');
        }
        
        throw new Error(errorData.error || 'Failed to delete request');
      }

      let result;
      try {
        result = await response.json();
      } catch {
        result = { message: 'Request deleted successfully' };
      }

      // ✅ AMÉLIORATION : Message toast avec informations de remboursement
      const toastDescription = result.refundAmount 
        ? `${result.message} - A refund of ${result.refundAmount} FBU has been processed.`
        : result.message || "Request deleted successfully.";

      toast({
        title: "Success",
        description: toastDescription,
      });
      
      router.push('/dashboard/enrollments');
    } catch (error: any) {
      console.error('Delete error:', error);
      
      // ✅ AMÉLIORATION : Gestion spécifique des erreurs
      let errorMessage = error.message || "Failed to delete request.";
      
      if (error.message.includes('Cannot delete an approved enrollment request')) {
        errorMessage = "Approved enrollment requests cannot be deleted for accounting reasons. Please contact administration if this is necessary.";
      }

      toast({
        variant: "destructive",
        title: "Error",
        description: errorMessage,
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin h-8 w-8" />
      </div>
    );
  }

  if (!request) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Request not found</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <Button variant="outline" onClick={() => router.back()}>
        <ArrowLeft className="mr-2 h-4 w-4" /> Back
      </Button>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Student Details Card */}
        <Card>
          <CardHeader>
            <CardTitle>Student Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <Avatar className="h-12 w-12">
                <AvatarImage src={request.studentId.avatarUrl} />
                <AvatarFallback>{request.studentId.name[0]}</AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-semibold">{request.studentId.name}</h3>
                <p className="text-sm text-muted-foreground">{request.studentId.email}</p>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <span className="text-sm text-muted-foreground">Gender:</span>
                <span>{request.studentId.gender || 'Not specified'}</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <span className="text-sm text-muted-foreground">Nationality:</span>
                <span>{request.studentId.nationality || 'Not specified'}}</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <span className="text-sm text-muted-foreground">Education Level:</span>
                <span>{request.studentId.educationLevel || 'Not specified'}</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <span className="text-sm text-muted-foreground">University:</span>
                <span>{request.studentId.university || 'Not specified'}</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <span className="text-sm text-muted-foreground">Address:</span>
                <span>{request.studentId.address || 'Not specified'}</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <span className="text-sm text-muted-foreground">Phone:</span>
                <span>{request.studentId.phone || 'Not specified'}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Course Details Card */}
        <Card>
          <CardHeader>
            <CardTitle>Course Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold">{request.courseId.title}</h3>
              <p className="text-sm text-muted-foreground mt-1">{request.courseId.description}</p>
            </div>
            
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <span className="text-sm text-muted-foreground">Price:</span>
                <span>{request.courseId.price.toLocaleString()} FBU</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <span className="text-sm text-muted-foreground">Days:</span>
                <span>{request.courseId.days.join(', ')}</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <span className="text-sm text-muted-foreground">Levels:</span>
                <span>{request.courseId.levels.join(', ')}</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <span className="text-sm text-muted-foreground">Preferred Level:</span>
                <span>{request.preferredLevel || 'Not specified'}</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <span className="text-sm text-muted-foreground">Teachers:</span>
                <span>{request.courseId.teacherIds.map(t => t.name).join(', ')}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Request Details Card */}
      <Card>
        <CardHeader>
          <CardTitle>Request Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <span className="text-sm text-muted-foreground">Status:</span>
              <Badge variant={
                request.status === 'approved' ? 'default' : 
                request.status === 'pending' ? 'secondary' : 'destructive'
              }>
                {request.status}
              </Badge>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <span className="text-sm text-muted-foreground">Request Date:</span>
              <span>{format(new Date(request.requestDate), "PPP")}</span>
            </div>
            {request.approvalDate && (
              <div className="grid grid-cols-2 gap-2">
                <span className="text-sm text-muted-foreground">Approval Date:</span>
                <span>{format(new Date(request.approvalDate), "PPP")}</span>
              </div>
            )}
            <div className="grid grid-cols-2 gap-2">
              <span className="text-sm text-muted-foreground">Registration Fee Paid:</span>
              <Badge variant={request.registrationFeePaid ? 'default' : 'destructive'}>
                {request.registrationFeePaid ? 'Yes' : 'No'}
              </Badge>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <span className="text-sm text-muted-foreground">Admin Notes:</span>
              <span>{request.adminNotes || 'None'}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex justify-end gap-4">
        {request.status === 'pending' && (
          <>
            <Button 
              variant="outline" 
              onClick={() => handleProcess('reject')}
            >
              Reject Request
            </Button>
            <Button 
              onClick={() => handleProcess('approve')}
              disabled={!request.registrationFeePaid}
            >
              Approve Request
            </Button>
          </>
        )}
        {/* ✅ AMÉLIORATION : Désactiver le bouton delete pour les demandes approuvées */}
        <Button 
          variant="destructive" 
          onClick={() => setIsDeleteDialogOpen(true)}
          disabled={request.status === 'approved'}
        >
          Delete Request
        </Button>
      </div>

      {/* ✅ AMÉLIORATION : Message d'information pour les demandes approuvées */}
      {request.status === 'approved' && (
        <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
          <p className="text-sm text-blue-800">
            <strong>Note:</strong> Approved enrollment requests cannot be deleted for accounting compliance reasons.
            The associated payment records must be preserved for financial auditing.
          </p>
        </div>
      )}

      {/* Process Request Dialog */}
      <Dialog open={isProcessDialogOpen} onOpenChange={setIsProcessDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {status === 'approve' ? 'Approve' : 'Reject'} Enrollment Request
            </DialogTitle>
            <DialogDescription>
              {status === 'approve' 
                ? 'Assign the student to a class and add any notes.'
                : 'Provide a reason for rejecting this enrollment request.'
              }
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Admin Notes</label>
              <Textarea
                placeholder={
                  status === 'approve' 
                    ? 'Add notes about this approval...' 
                    : 'Explain why this request is being rejected...'
                }
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                required={status === 'reject'}
              />
            </div>

            {status === 'approve' && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Assign to Class</label>
                {isLoadingClasses ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading available classes...
                  </div>
                ) : (
                  <Select onValueChange={setSelectedClass} value={selectedClass}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a class..." />
                    </SelectTrigger>
                    <SelectContent>
                      {classes.map((cls) => (
                        <SelectItem key={cls._id} value={cls._id}>
                          {cls.name} ({cls.level})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsProcessDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSubmitProcess} 
              disabled={
                isSubmitting || 
                (status === 'approve' && !selectedClass) || 
                (status === 'reject' && !adminNotes.trim())
              }
              variant={status === 'reject' ? 'destructive' : 'default'}
            >
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {status === 'approve' ? 'Approve' : 'Reject'} Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Enrollment Request</DialogTitle>
            <DialogDescription>
              {request.registrationFeePaid ? (
                <div className="space-y-2">
                  <p>This action cannot be undone and will trigger an automatic refund process.</p>
                  <p className="text-amber-600 font-medium">
                    A refund of the registration fee will be processed to the student.
                  </p>
                </div>
              ) : (
                "This action cannot be undone. This will permanently delete the enrollment request and remove it from our servers."
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDelete}
            >
              {request.registrationFeePaid ? 'Delete & Refund' : 'Delete Request'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}