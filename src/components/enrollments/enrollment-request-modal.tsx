// src/components/enrollments/enrollment-request-modal.tsx
'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, CheckCircle, Loader2 } from "lucide-react";
import { CenterInfo } from "@/lib/types";
import type { ICourse } from '@/server/api/courses/course.schema';
import { useToast } from "@/hooks/use-toast";
import { useAuth } from '@/lib/auth';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

const formSchema = z.object({
  preferredLevel: z.string().optional(),
});

interface EnrollmentRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  course: ICourse;
}

export function EnrollmentRequestModal({
  isOpen,
  onClose,
  course,
}: EnrollmentRequestModalProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [centerInfo, setCenterInfo] = useState<CenterInfo | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      preferredLevel: '',
    },
  });

  useEffect(() => {
    if (isOpen) {
      // Fetch center info
      fetch('/api/settings/center')
        .then(res => res.json())
        .then(data => setCenterInfo({
          name: data.centerName,
          address: data.address,
          contact: data.contactPhone || data.contactEmail,
          registrationFee: data.registrationFee,
          validityHours: data.enrollmentValidityHours,
        }))
        .catch(() => {
          toast({
            variant: "destructive",
            title: "Error",
            description: "Failed to load center information",
          });
        });
    }
  }, [isOpen, toast]);

  const handleSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/enrollments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          studentId: user?.id,
          courseId: course._id,
          preferredLevel: values.preferredLevel || undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit enrollment request');
      }

      await response.json();
      setIsSuccess(true);
      
      toast({
        title: "Enrollment Request Submitted",
        description: "Your request has been received successfully.",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to submit enrollment request. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    onClose();
    setIsSuccess(false);
    setIsSubmitting(false);
    form.reset();
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
                  Your enrollment request has been submitted successfully. An email has been sent to your address with more details.
                </AlertDescription>
              </Alert>
              <p>Please visit the center within {centerInfo?.validityHours || 48} hours to pay the registration fee of {centerInfo?.registrationFee || 0} FBU and secure your spot.</p>
              {centerInfo && (
                <>
                  <p><strong>Center:</strong> {centerInfo.name}</p>
                  <p><strong>Address:</strong> {centerInfo.address}</p>
                  <p><strong>Contact:</strong> {centerInfo.contact}</p>
                </>
              )}
            </div>
          ) : (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
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

                {course.levels.length > 1 && (
                  <FormField
                    control={form.control}
                    name="preferredLevel"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Preferred Level</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select preferred level (optional)" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {course.levels.map((level) => (
                              <SelectItem key={level} value={level}>
                                {level}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    You will need to visit the center within 48 hours to pay the registration fee and complete registration.
                  </AlertDescription>
                </Alert>

                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={handleClose}>
                    Cancel
                  </Button>
                  <Button 
                    type="submit"
                    disabled={isSubmitting}
                  >
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Submit Request
                  </Button>
                </div>
              </form>
            </Form>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}