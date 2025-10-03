// src/app/dashboard/courses/[id]/client.tsx
"use client";

import Image from "next/image";
import { ArrowLeft, Clock, User, Star, CheckCircle, Hourglass, XCircle } from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { ICourse } from "@/server/api/courses/course.schema";
import type { IUser } from "@/server/api/auth/user.schema";
import { EnrollmentRequestModal } from "@/components/enrollments/enrollment-request-modal";
import { useState } from "react";

interface ClientCourseDetailsProps {
  course: ICourse;
  currentUser: IUser | null;
  hasPendingRequest: boolean;
  isEnrolled: boolean;
  isRejected: boolean;
}

export default function ClientCourseDetails({
  course,
  currentUser,
  hasPendingRequest,
  isEnrolled,
  isRejected,
}: ClientCourseDetailsProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  console.log("ClientCourseDetails: course data", course);

  const schedule = [
    course.days?.length ? course.days.join(", ") : "Not specified",
    course.startTime && course.endTime ? `${course.startTime} - ${course.endTime}` : "Time not specified",
  ].filter(Boolean).join(" | ");

  const currencyFormatter = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "FBU",
    minimumFractionDigits: 0,
  });

  // Assurer que teacherIds contient des objets { name, avatarUrl }
  const teachers = (course.teacherIds || []).map((teacher: any) => {
    if (typeof teacher === "string") return { name: "Unknown", avatarUrl: "" };
    return { name: teacher.name || "Unknown", avatarUrl: teacher.avatarUrl || "" };
  });

  // Enrollment status for students
  const statusVariant: Record<string, { variant: "default" | "secondary" | "destructive"; icon: React.ElementType }> = {
    approved: { variant: "default", icon: CheckCircle },
    pending: { variant: "secondary", icon: Hourglass },
    rejected: { variant: "destructive", icon: XCircle },
  };

  let enrollmentStatus: string | null = null;
  let StatusIcon: React.ElementType | null = null;
  let statusBadgeVariant: "default" | "secondary" | "destructive" | null = null;

  if (currentUser?.role === "student") {
    if (isEnrolled) {
      enrollmentStatus = "approved";
      StatusIcon = statusVariant.approved.icon;
      statusBadgeVariant = statusVariant.approved.variant;
    } else if (hasPendingRequest) {
      enrollmentStatus = "pending";
      StatusIcon = statusVariant.pending.icon;
      statusBadgeVariant = statusVariant.pending.variant;
    } else if (isRejected) {
      enrollmentStatus = "rejected";
      StatusIcon = statusVariant.rejected.icon;
      statusBadgeVariant = statusVariant.rejected.variant;
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button variant="outline" asChild>
          <Link href="/dashboard/courses">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Courses
          </Link>
        </Button>
        {currentUser?.role === "student" && enrollmentStatus && StatusIcon && statusBadgeVariant && (
          <Badge variant={statusBadgeVariant} className="capitalize flex items-center gap-1.5">
            <StatusIcon className="h-4 w-4" />
            {enrollmentStatus}
          </Badge>
        )}
      </div>

      {/* Main Content */}
      <div className="grid md:grid-cols-5 gap-8">
        {/* Course Image */}
        <div className="md:col-span-3">
          <div className="relative aspect-[3/2] w-full rounded-lg overflow-hidden">
            <Image
              src={course.imageUrl || "/images/default-course.png"}
              alt={course.title || "Course Image"}
              fill
              className="object-cover"
            />
          </div>
        </div>

        {/* Course Details */}
        <div className="md:col-span-2 space-y-6">
          <div>
            <h1 className="font-headline text-4xl font-extrabold tracking-tight">
              {course.title || "Untitled Course"}
            </h1>
            <p className="text-lg text-muted-foreground mt-2">
              {course.description || "No description available"}
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="font-headline text-2xl text-primary">
                {currencyFormatter.format(course.price || 0)}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-muted-foreground" />
                <span className="font-medium text-lg">{schedule}</span>
              </div>
              <div className="flex items-center gap-3">
                <Star className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">Levels</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {course.levels?.length ? (
                      course.levels.map((level: string) => <Badge key={level} variant="secondary">{level}</Badge>)
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
                  <div className="flex flex-wrap gap-2 mt-1">
                    {teachers.length > 0 ? (
                      teachers.map((teacher, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <Avatar className="h-6 w-6">
                            {teacher.avatarUrl ? (
                              <AvatarImage src={teacher.avatarUrl} alt={teacher.name} />
                            ) : (
                              <AvatarFallback>{teacher.name.charAt(0)}</AvatarFallback>
                            )}
                          </Avatar>
                          <span className="text-sm">{teacher.name}</span>
                        </div>
                      ))
                    ) : (
                      <span className="text-sm text-muted-foreground">Not yet assigned</span>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {currentUser?.role === "student" && !isEnrolled && !hasPendingRequest && (
            <Button onClick={() => setIsModalOpen(true)}>Enroll in Course</Button>
          )}

          {currentUser?.role === "student" && (
            <EnrollmentRequestModal
              isOpen={isModalOpen}
              onClose={() => setIsModalOpen(false)}
              course={course}
            />
          )}
        </div>
      </div>
    </div>
  );
}
