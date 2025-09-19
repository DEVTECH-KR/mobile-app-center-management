
'use client';
import { Button } from "@/components/ui/button";
import { MOCK_CENTER_INFO, MOCK_ENROLLMENT_REQUESTS } from "@/lib/mock-data";
import { notFound } from "next/navigation";
import Image from "next/image";
import { ArrowLeft, BookOpen, Clock, Tag, User, Star, Loader2 } from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect } from "react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import type { EnrollmentRequest, Course, User as UserType } from "@/lib/types";
import { useAuth } from "@/context/auth-context";
import { db } from "@/lib/firebase";
import { doc, getDoc, collection, getDocs, where, query, addDoc } from "firebase/firestore";

export default function CourseDetailsPage({ params }: { params: { id: string } }) {
  const { userProfile, loading } = useAuth();
  const [course, setCourse] = useState<Course | null>(null);
  const [teachers, setTeachers] = useState<UserType[]>([]);
  const [pageLoading, setPageLoading] = useState(true);
  
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRequestSubmitted, setIsRequestSubmitted] = useState(false);
  const [hasPendingRequest, setHasPendingRequest] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (!params.id) return;
    const fetchCourseAndRequests = async () => {
        setPageLoading(true);
        try {
            // Fetch course
            const courseDoc = await getDoc(doc(db, "courses", params.id));
            if (courseDoc.exists()) {
                const courseData = { id: courseDoc.id, ...courseDoc.data() } as Course;
                setCourse(courseData);

                // Fetch teachers for the course
                if (courseData.teacherIds && courseData.teacherIds.length > 0) {
                     const usersQuery = query(collection(db, "users"), where("role", "==", "teacher"), where("id", "in", courseData.teacherIds));
                     const usersSnapshot = await getDocs(usersQuery);
                     const usersList = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as UserType));
                     setTeachers(usersList);
                }
            } else {
                setCourse(null);
            }

            // Check for existing enrollment requests for the current user and course
            if (userProfile) {
                const requestsQuery = query(
                    collection(db, "enrollmentRequests"), 
                    where("userId", "==", userProfile.id), 
                    where("courseId", "==", params.id),
                    where("status", "==", "pending")
                );
                const requestSnapshot = await getDocs(requestsQuery);
                setHasPendingRequest(!requestSnapshot.empty);
            }

        } catch (error) {
            console.error("Error fetching course data:", error);
            toast({ title: "Error", description: "Could not load course details.", variant: "destructive"});
        } finally {
            setPageLoading(false);
        }
    };
    
    if(!loading) {
      fetchCourseAndRequests();
    }
  }, [params.id, userProfile, loading, toast]);
  
  if (pageLoading || loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!course) {
    notFound();
  }

  const isEnrolled = userProfile?.enrolledCourseIds?.includes(course.id!);
  const canEnroll = userProfile?.role === 'student' && !isEnrolled && !hasPendingRequest && !isRequestSubmitted;


  const handleEnrollmentRequest = async () => {
    if (!userProfile || !course) return;
    setIsSubmitting(true);
    try {
      const newRequest: Omit<EnrollmentRequest, 'id'> = {
        userId: userProfile.id,
        courseId: course.id!,
        requestDate: new Date(),
        status: 'pending',
        userName: userProfile.name,
        userEmail: userProfile.email,
        courseTitle: course.title,
      };
      
      await addDoc(collection(db, "enrollmentRequests"), newRequest);

      setIsSubmitting(false);
      setShowConfirmDialog(false);
      setIsRequestSubmitted(true);
       toast({
          title: "Enrollment Request Submitted!",
          description: `Your request for ${course.title} has been received.`,
        });
    } catch (error) {
        console.error("Error submitting enrollment request: ", error);
        toast({ title: "Error", description: "Could not submit your request.", variant: "destructive" });
        setIsSubmitting(false);
        setShowConfirmDialog(false);
    }
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
                                    {teachers.length > 0 ? teachers.map(t => t.name).join(', ') : 'Not yet assigned'}
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

    