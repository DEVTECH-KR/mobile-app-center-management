// src/components/dashboard/course-card-user.tsx
import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, CheckCircle, Hourglass, Eye, XCircle } from "lucide-react";
import Link from "next/link";
import type { ICourse } from "@/server/api/courses/course.schema";

interface CourseCardUserProps {
  course: ICourse;
  userRole?: "admin" | "student" | "teacher";
  isEnrolled?: boolean;
  hasPendingRequest?: boolean;
  isRejected?: boolean;
  // onEnroll?: (courseId: string) => void;
}

export const CourseCardUser: React.FC<CourseCardUserProps> = ({
  course,
  userRole,
  isEnrolled,
  hasPendingRequest,
  isRejected,
  // onEnroll,
}) => {
  const schedule = `${course.days?.join(', ') || ""} | ${course.startTime ?? ""} - ${course.endTime ?? ""}`;

  const getButtonState = () => {
    if (userRole === "admin") {
      return { text: "View Details", icon: Eye, disabled: false, href: `/dashboard/courses/${course._id}` };
    }
    if (isEnrolled) {
      return { text: "Enrolled", icon: CheckCircle, disabled: true, href: `/dashboard/courses/${course._id}` };
    }
    if (hasPendingRequest) {
      return { text: "Request Pending", icon: Hourglass, disabled: true };
    }
    if (isRejected) {
      return { text: "Request Rejected", icon: XCircle, disabled: true, href: `/dashboard/courses/${course._id}` };
    }
    return { text: "View Details", icon: Eye, disabled: false, href: `/dashboard/courses/${course._id}` };
  };

  const buttonState = getButtonState();

  return (
    <div className="relative group">
      <Card className="flex flex-col overflow-hidden">
        <CardHeader className="p-0">
          <div className="relative h-48 w-full">
            <img 
              src={course.imageUrl || "/default-course.png"} 
              alt={course.title} 
              className="object-cover w-full h-full" 
            />
          </div>
          <div className="p-6">
            <CardTitle className="font-headline text-xl">{course.title}</CardTitle>
            <CardDescription className="mt-2 h-10 overflow-hidden text-ellipsis">{course.description}</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col space-y-2">
          <div className="text-sm text-muted-foreground">{schedule}</div>
          <div className="font-headline text-2xl font-bold text-primary">{course.price} FBU</div>
        </CardContent>
        <CardFooter className="flex gap-2">
          {buttonState.href ? (
            <Button variant="default" disabled={buttonState.disabled} asChild className="w-full">
              <Link href={buttonState.href}>
                <buttonState.icon className="mr-2 h-4 w-4" />
                {buttonState.text}
              </Link>
            </Button>
          ) : (
            <Button variant="default" disabled={buttonState.disabled} onClick={buttonState.action} className="w-full">
              <buttonState.icon className="mr-2 h-4 w-4" />
              {buttonState.text}
            </Button>
          )}
        </CardFooter>
      </Card>
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button variant="secondary" size="icon" className="h-8 w-8 rounded-full bg-background/70 hover:bg-background" asChild>
          <Link href={`/dashboard/courses/${course._id}`}>
            <Eye className="h-4 w-4" />
          </Link>
        </Button>
      </div>
    </div>
  );
};