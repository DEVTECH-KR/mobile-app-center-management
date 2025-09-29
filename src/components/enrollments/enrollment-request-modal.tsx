// src/components/enrollments/enrollment-request-modal.tsx
'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, CheckCircle } from "lucide-react";
import { Course } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";

interface EnrollmentRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  course: Course;
}

export function EnrollmentRequestModal({
  isOpen,
  onClose,
  course,
}: EnrollmentRequestModalProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/enrollments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          courseId: course.id,
          // In a real app, studentId would come from auth context
          studentId: 'current-user-id',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit enrollment request');
      }

      setIsSuccess(true);
      toast({
        title: "Success!",
        description: "Your enrollment request has been submitted.",
      });

      // Close modal after 2 seconds on success
      setTimeout(() => {
        onClose();
        setIsSuccess(false);
      }, 2000);

    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to submit enrollment request. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Confirm Enrollment Request</DialogTitle>
          <DialogDescription>
            Please review the course details before submitting your enrollment request.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {isSuccess ? (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                Your enrollment request has been submitted successfully!
              </AlertDescription>
            </Alert>
          ) : (
            <>
              <div className="space-y-2">
                <h4 className="font-medium">Course Details</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="text-muted-foreground">Course:</div>
                  <div>{course.title}</div>
                  <div className="text-muted-foreground">Schedule:</div>
                  <div>{course.days.join(', ')} ({course.startTime} - {course.endTime})</div>
                  <div className="text-muted-foreground">Levels:</div>
                  <div>{course.levels.join(', ')}</div>
                  <div className="text-muted-foreground">Price:</div>
                  <div>{course.price.toLocaleString()} FBU</div>
                </div>
              </div>

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  You will need to visit the center within 48 hours to complete registration and secure your spot.
                </AlertDescription>
              </Alert>

              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={onClose}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleSubmit} 
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Submitting..." : "Submit Request"}
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}