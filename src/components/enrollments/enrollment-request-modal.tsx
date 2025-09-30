// src/components/enrollments/enrollment-request-modal.tsx
'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, CheckCircle, Loader2 } from "lucide-react";
import { Course, CenterInfo } from "@/lib/types";
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
  const [centerInfo, setCenterInfo] = useState<CenterInfo | null>(null);

  useEffect(() => {
    if (isOpen) {
      // Fetch center info
      fetch('/api/settings')
        .then(res => res.json())
        .then(data => setCenterInfo(data))
        .catch(() => {
          toast({
            variant: "destructive",
            title: "Error",
            description: "Failed to load center information",
          });
        });
    }
  }, [isOpen, toast]);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await fetch('/api/enrollments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          courseId: course.id,
        }),
      }).then(res => {
        if (!res.ok) throw new Error('Failed');
        return res.json();
      });

      setIsSuccess(true);
      toast({
        title: "Enrollment Request Submitted",
        description: "Your request has been received successfully.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to submit enrollment request. Please try again.",
      });
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    onClose();
    setIsSuccess(false);
    setIsSubmitting(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Confirm Enrollment Request</DialogTitle>
          <DialogDescription>
            Please review the course details before submitting your enrollment request.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {isSuccess ? (
            <div className="space-y-4">
              <Alert variant="default">
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  Your enrollment request has been submitted successfully. You have now reserved a spot for the training in {course.title}.
                </AlertDescription>
              </Alert>
              <p>Please visit the center within 48 hours to pay the registration fee so that your spot can be definitively reserved.</p>
              {centerInfo && (
                <>
                  <p><strong>Center address:</strong> {centerInfo.address}</p>
                  <p><strong>Contact:</strong> {centerInfo.contact}</p>
                </>
              )}
              <p>Once the payment has been made, you will have full access to our app: track your payments, download syllabi, access events, and more.</p>
            </div>
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
                <Button variant="outline" onClick={handleClose}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleSubmit} 
                  disabled={isSubmitting}
                >
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Submit Request
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}