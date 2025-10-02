// src/components/enrollments/admin-enrollment-manager.tsx
'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import type { IEnrollment } from '@/server/api/enrollments/enrollment.schema';
import { Loader2 } from "lucide-react";

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

interface AdminEnrollmentManagerProps {
  enrollment: PopulatedEnrollment;
  onStatusUpdate: () => void;
}

export function AdminEnrollmentManager({ enrollment, onStatusUpdate }: AdminEnrollmentManagerProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');
  const [selectedClass, setSelectedClass] = useState('');

  const handleRecordPayment = async () => {
    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/enrollments/${enrollment._id}/payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      if (!response.ok) {
        throw new Error('Failed to record payment');
      }

      toast({
        title: "Success",
        description: "Payment recorded successfully.",
      });

      onStatusUpdate();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to record payment.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStatusUpdate = async (status: 'approved' | 'rejected') => {
    setIsSubmitting(true);
    try {
      const endpoint = status === 'approved' 
        ? `/api/enrollments/${enrollment._id}/approve`
        : `/api/enrollments/${enrollment._id}/reject`;

      const body = status === 'approved'
        ? { classId: selectedClass, adminNotes }
        : { adminNotes };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        throw new Error('Failed to update enrollment status');
      }

      toast({
        title: "Success",
        description: `Enrollment request ${status} successfully.`,
      });

      onStatusUpdate();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update enrollment status.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Manage Enrollment Request</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Admin Notes</label>
          <Textarea
            placeholder="Add notes about this enrollment request..."
            value={adminNotes}
            onChange={(e) => setAdminNotes(e.target.value)}
          />
        </div>

        {enrollment.status === 'pending' && (
          <>
            {!enrollment.registrationFeePaid && (
              <Button 
                onClick={handleRecordPayment}
                disabled={isSubmitting}
                variant="secondary"
                className="w-full"
              >
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Record Registration Fee Payment
              </Button>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium">Assign Class</label>
              <Select onValueChange={setSelectedClass} value={selectedClass}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a class..." />
                </SelectTrigger>
                <SelectContent>
                  {/* Replace with actual class data from API */}
                  <SelectItem value="class-1">Morning Class A</SelectItem>
                  <SelectItem value="class-2">Afternoon Class B</SelectItem>
                  <SelectItem value="class-3">Evening Class C</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => handleStatusUpdate('rejected')}
                disabled={isSubmitting || !adminNotes}
              >
                Reject
              </Button>
              <Button
                onClick={() => handleStatusUpdate('approved')}
                disabled={isSubmitting || !selectedClass || !adminNotes || !enrollment.registrationFeePaid}
              >
                Approve
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}