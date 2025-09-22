
'use client';
import { Button } from "@/components/ui/button";
import { MOCK_COURSES, MOCK_USERS, MOCK_CENTER_INFO, MOCK_ENROLLMENT_REQUESTS } from "@/lib/mock-data";
import { notFound } from "next/navigation";
import Image from "next/image";
import { ArrowLeft, BookOpen, Clock, Tag, User, Star, Loader2 } from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import type { EnrollmentRequest } from "@/lib/types";

// In a real app, these would come from an auth context.
const currentUser = MOCK_USERS.student; 
const allUsers = Object.values(MOCK_USERS);

export default function CourseDetailsPage({ params }: { params: { id: string } }) {
  const course = MOCK_COURSES.find((c) => c.id === params.id);
  const { toast } = useToast();
  
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRequestSubmitted, setIsRequestSubmitted] = useState(false);

  if (!course) {
    notFound();
  }
  
  const teachers = course.teacherIds.map(id => allUsers.find(u => u.id === id)).filter(Boolean);
  const isEnrolled = currentUser?.enrolledCourseIds?.includes(course.id);
  // This is a mock check. In a real app, you'd have a better way to track this.
  const hasPendingRequest = MOCK_ENROLLMENT_REQUESTS.some(req => req.userId === currentUser.id && req.courseId === course.id && req.status === 'pending');
  const canEnroll = currentUser?.role === 'student' && !isEnrolled && !hasPendingRequest && !isRequestSubmitted;


  const handleEnrollmentRequest = () => {
    setIsSubmitting(true);
    // Simulate API call to submit request
    setTimeout(() => {
        // You could add the request to a mock list or just show the success state
      const newRequest: EnrollmentRequest = {
        id: `req-${Date.now()}`,
        userId: currentUser.id,
        courseId: course.id,
        requestDate: new Date().toISOString(),
        status: 'pending',
        userName: currentUser.name,
        userEmail: currentUser.email,
        courseTitle: course.title,
      };
      // In a real app, you'd add this to your state management or refetch
      console.log("New enrollment request:", newRequest);

      setIsSubmitting(false);
      setShowConfirmDialog(false);
      setIsRequestSubmitted(true);
       toast({
          title: "Enrollment Request Submitted!",
          description: `Your request for ${course.title} has been received.`,
        });
    }, 1000);
  }

  const schedule = `${course.days.join(', ')} | ${course.startTime} - ${course.endTime}`;

  const currencyFormatter = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "FBU",
    minimumFractionDigits: 0,
  });

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
                        <CardTitle className="font-headline text-2xl text-primary">{currencyFormatter.format(course.price)}</CardTitle>
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
                                    {course.levels?.map(level => <Badge key={level} variant="secondary">{level}</Badge>)}
                                </div>
                            </div>
                        </div>
                         <div className="flex items-start gap-3">
                            <User className="h-5 w-5 text-muted-foreground mt-1" />
                            <div>
                                <p className="font-medium">Instructors</p>
                                <div className="text-sm text-muted-foreground">
                                    {teachers.length > 0 ? teachers.map(t => t!.name).join(', ') : 'Not yet assigned'}
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                 <Button size="lg" className="w-full" onClick={() => setShowConfirmDialog(true)} disabled={!canEnroll}>
                    <BookOpen className="mr-2 h-5 w-5" />
                    {isEnrolled ? "Already Enrolled" : (hasPendingRequest || isRequestSubmitted) ? "Request Pending" : "Request Enrollment"}
                </Button>
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
                            <p>Please visit the center within 48 hours to pay the registration fee of <span className="font-semibold">{new Intl.NumberFormat("en-US", { style: "currency", currency: "FBU", minimumFractionDigits: 0 }).format(MOCK_CENTER_INFO.registrationFee)}</span> so that your spot can be definitively reserved.</p>
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
