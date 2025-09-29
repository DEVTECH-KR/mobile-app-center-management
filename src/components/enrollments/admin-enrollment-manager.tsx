// src/components/enrollments/admin-enrollment-manager.tsx
'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { EnrollmentRequest } from "@/lib/types";

interface AdminEnrollmentManagerProps {
  enrollment: EnrollmentRequest;
  onStatusUpdate: () => void;
}

export function AdminEnrollmentManager({ enrollment, onStatusUpdate }: AdminEnrollmentManagerProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');
  const [selectedClass, setSelectedClass] = useState('');

  const handleStatusUpdate = async (status: 'approved' | 'rejected') => {
    setIsSubmitting(true);
    try {
      const endpoint = status === 'approved' ? 
        `/api/enrollments/${enrollment.id}/approve` :
        `/api/enrollments/${enrollment.id}/reject`;

      const body = status === 'approved' ?
        { classId: selectedClass, adminNotes } :
        { adminNotes };

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
            <div className="space-y-2">
              <label className="text-sm font-medium">Assign Class</label>
              <Select onValueChange={setSelectedClass} value={selectedClass}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a class..." />
                </SelectTrigger>
                <SelectContent>
                  {/* Replace with actual class data */}
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
                disabled={isSubmitting || !selectedClass || !adminNotes}
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