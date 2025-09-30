// src/app/dashboard/courses/[id]/page.tsx
'use client';

import { Button } from "@/components/ui/button";
import { MOCK_CENTER_INFO } from "@/lib/mock-data";
import { notFound } from "next/navigation";
import Image from "next/image";
import { ArrowLeft, BookOpen, Clock, User, Star, Loader2 } from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect } from "react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import type { Course, User as UserType, EnrollmentRequest } from "@/lib/types";

// Helper function to get auth token
const getAuthToken = () => {
  return localStorage.getItem('authToken');
};

// API call functions
const fetchCourse = async (id: string) => {
  const response = await fetch(`/api/courses/${id}`);
  if (!response.ok) throw new Error('Course not found');
  return response.json();
};

const fetchCurrentUser = async () => {
  const token = getAuthToken();
  if (!token) return null;
  
  const response = await fetch('/api/auth/me', {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  if (!response.ok) return null;
  return response.json();
};

const submitEnrollmentRequest = async (courseId: string) => {
  const token = getAuthToken();
  const response = await fetch('/api/enrollment-requests', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ courseId }),
  });
  if (!response.ok) throw new Error('Failed to submit enrollment request');
  return response.json();
};

const checkEnrollmentStatus = async (courseId: string) => {
  const token = getAuthToken();
  const response = await fetch(`/api/enrollment-requests?courseId=${courseId}`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  if (!response.ok) return null;
  return response.json();
};

export default function CourseDetailsPage({ params }: { params: { id: string } }) {
  const [course, setCourse] = useState<Course | null>(null);
  const [currentUser, setCurrentUser] = useState<UserType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRequestSubmitted, setIsRequestSubmitted] = useState(false);
  const [hasPendingRequest, setHasPendingRequest] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        
        // Fetch course details
        const courseData = await fetchCourse(params.id);
        setCourse(courseData);

        // Fetch current user
        const userData = await fetchCurrentUser();
        setCurrentUser(userData);

        // Check enrollment status if user is a student
        if (userData?.role === 'student' && params.id) {
          const enrollmentStatus = await checkEnrollmentStatus(params.id);
          if (enrollmentStatus?.status === 'pending') {
            setHasPendingRequest(true);
          }
        }
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to load course details",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (params.id) {
      loadData();
    }
  }, [params.id, toast]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!course) {
    notFound();
  }

  const isEnrolled = currentUser?.enrolledCourseIds?.includes(course.id);
  const canEnroll = currentUser?.role === 'student' && !isEnrolled && !hasPendingRequest && !isRequestSubmitted;

  const handleEnrollmentRequest = async () => {
    setIsSubmitting(true);
    
    try {
      await submitEnrollmentRequest(course.id);
      
      setIsSubmitting(false);
      setShowConfirmDialog(false);
      setIsRequestSubmitted(true);
      
      toast({
        title: "Enrollment Request Submitted!",
        description: `Your request for ${course.title} has been received.`,
      });
    } catch (error) {
      setIsSubmitting(false);
      toast({
        title: "Error",
        description: "Failed to submit enrollment request",
        variant: "destructive"
      });
    }
  };

  const schedule = `${course.days.join(', ')} | ${course.startTime} - ${course.endTime}`;

  const currencyFormatter = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "FBU",
    minimumFractionDigits: 0,
  });

  // Get teacher names from populated data
  const teachers = course.teacherIds.map(teacher => {
    // If teacherIds are populated objects
    if (typeof teacher === 'object' && teacher !== null) {
      return (teacher as any).name;
    }
    return null;
  }).filter(Boolean);

  return (
    <div className="space-y-6">
      <div className="mb-8">
        <Button variant="outline" asChild>
          <Link href="/dashboard/courses">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Courses
          </Link>
        </Button>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-6">
          <h1 className="font-headline text-4xl font-extrabold tracking-tight">
            {course.title}
          </h1>
          <div className="relative aspect-video w-full">
            <Image
              src={course.imageUrl}
              alt={course.title}
              fill
              className="rounded-lg object-cover"
              data-ai-hint={course.imageHint}
            />
          </div>
          <div>
            <h2 className="font-headline text-2xl font-semibold mb-2">Description</h2>
            <p className="text-muted-foreground">{course.description}</p>
          </div>
        </div>
        
        <div className="md:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="font-headline text-2xl text-primary">
                {currencyFormatter.format(course.price)}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">Schedule</p>
                  <p className="text-sm text-muted-foreground">{schedule}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Star className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">Levels</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {course.levels?.map(level => (
                      <Badge key={level} variant="secondary">{level}</Badge>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <User className="h-5 w-5 text-muted-foreground mt-1" />
                <div>
                  <p className="font-medium">Instructors</p>
                  <div className="text-sm text-muted-foreground">
                    {teachers.length > 0 ? teachers.join(', ') : 'Not yet assigned'}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {currentUser?.role === 'student' && (
            <Button 
              size="lg" 
              className="w-full" 
              onClick={() => setShowConfirmDialog(true)} 
              disabled={!canEnroll}
            >
              <BookOpen className="mr-2 h-5 w-5" />
              {isEnrolled ? "Already Enrolled" : (hasPendingRequest || isRequestSubmitted) ? "Request Pending" : "Request Enrollment"}
            </Button>
          )}
        </div>
      </div>

      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Enrollment Request</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to request enrollment for the course "{course.title}"?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleEnrollmentRequest} disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      <AlertDialog open={isRequestSubmitted && !showConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Request Submitted Successfully!</AlertDialogTitle>
            <div className="text-sm text-muted-foreground pt-4 space-y-4">
              <p>You have reserved a spot for the training in <span className="font-semibold">{course.title}</span>.</p>
              <p>Please visit the center within 48 hours to pay the registration fee of <span className="font-semibold">{currencyFormatter.format(MOCK_CENTER_INFO.registrationFee)}</span> so that your spot can be definitively reserved.</p>
              <div className="border-l-4 pl-4">
                <p><span className="font-semibold">Center Address:</span> {MOCK_CENTER_INFO.address}</p>
                <p><span className="font-semibold">Contact:</span> {MOCK_CENTER_INFO.contact}</p>
              </div>
              <p>Once the payment has been made, you will have full access to our app: track your payments, download syllabi, access events, and more.</p>
            </div>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button asChild className="w-full">
              <Link href="/dashboard/courses">Back to Courses</Link>
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}