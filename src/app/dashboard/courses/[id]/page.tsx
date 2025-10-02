'use client';

import { Button } from "@/components/ui/button";
import { notFound, useRouter } from "next/navigation";
import Image from "next/image";
import { ArrowLeft, BookOpen, Clock, User, Star, Loader2 } from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect } from "react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { coursesApi, usersApi, enrollmentApi } from "@/lib/api/courses.api";
import type { ICourse } from "@/server/api/courses/course.schema";
import type { IUser } from "@/server/api/auth/user.schema";
import type { IEnrollment } from "@/server/api/enrollments/enrollment.schema";

export default async function CourseDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params; // Unwrap params Promise
  const [course, setCourse] = useState<ICourse | null>(null);
  const [currentUser, setCurrentUser] = useState<IUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasPendingRequest, setHasPendingRequest] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);

        // Fetch course details
        const courseData = await coursesApi.getById(id);
        setCourse(courseData);

        // Fetch current user
        const userData = await usersApi.getCurrentUser();
        setCurrentUser(userData);

        // Check enrollment status if user is a student
        if (userData?.role === 'student' && id) {
          const enrollments = await enrollmentApi.getEnrollmentRequests(String(userData._id));
          const hasPending = enrollments.some(
            (req: IEnrollment) => String(req.courseId._id) === id && req.status === 'pending'
          );
          setHasPendingRequest(hasPending);
        }
      } catch (error: any) {
        console.error('CourseDetailsPage error:', error);
        if (error.message === 'Course not found') {
          notFound();
        } else if (error.message.includes('Failed to fetch user')) {
          router.push('/login');
        } else {
          toast({
            title: "Error",
            description: error.message || "Failed to load course details",
            variant: "destructive",
          });
        }
      } finally {
        setIsLoading(false);
      }
    };

    if (id) {
      loadData();
    }
  }, [id, toast, router]);

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

  const isEnrolled = currentUser?.enrolledCourseIds?.some(id => String(id) === String(course._id));
  const canEnroll = currentUser?.role === 'student' && !isEnrolled && !hasPendingRequest;

  const handleEnrollmentRequest = async () => {
    if (!currentUser) {
      toast({
        title: "Error",
        description: "Please log in to enroll",
        variant: "destructive",
      });
      router.push('/login');
      return;
    }

    setIsSubmitting(true);
    try {
      await enrollmentApi.requestEnrollment(String(course._id), String(currentUser._id));
      setHasPendingRequest(true);
      setShowConfirmDialog(false);
      toast({
        title: "Success",
        description: `Enrollment request for "${course.title}" submitted! Please contact the center to complete registration.`,
      });
    } catch (error: any) {
      console.error('Enrollment request error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to submit enrollment request",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle optional fields with fallbacks
  const schedule = [
    course.days?.length ? course.days.join(', ') : 'Not specified',
    course.startTime && course.endTime ? `${course.startTime} - ${course.endTime}` : 'Time not specified'
  ].filter(Boolean).join(' | ');

  const currencyFormatter = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "FBU",
    minimumFractionDigits: 0,
  });

  // Get teacher names from populated data
  const teachers = course.teacherIds
    .map(teacher => (typeof teacher === 'object' && teacher !== null && 'name' in teacher ? teacher.name : null))
    .filter((name): name is string => !!name);

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
              src={course.imageUrl || "/default-course.png"}
              alt={course.title}
              fill
              className="rounded-lg object-cover"
              data-ai-hint={course.imageHint}
            />
          </div>
          <div>
            <h2 className="font-headline text-2xl font-semibold mb-2">Description</h2>
            <p className="text-muted-foreground">{course.description || 'No description available'}</p>
          </div>
        </div>
        
        <div className="md:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="font-headline text-2xl text-primary">
                {currencyFormatter.format(course.price || 0)}
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
                    {course.levels?.length ? (
                      course.levels.map(level => (
                        <Badge key={level} variant="secondary">{level}</Badge>
                      ))
                    ) : (
                      <Badge variant="secondary">Not specified</Badge>
                    )}
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
              {isEnrolled ? "Enrolled" : hasPendingRequest ? "Request Pending" : "Request Enrollment"}
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
    </div>
  );
}