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
import { Course, UserRole } from "@/lib/types";
import { BookOpen, CheckCircle, Hourglass, Eye, XCircle } from "lucide-react";
import Link from "next/link";

interface CourseCardUserProps {
  course: Course;
  userRole?: UserRole;
  isEnrolled?: boolean;
  hasPendingRequest?: boolean;
  isRejected?: boolean;
  onEnroll?: (courseId: string) => void; // callback pour inscription
}

export const CourseCardUser: React.FC<CourseCardUserProps> = ({
  course,
  userRole,
  isEnrolled,
  hasPendingRequest,
  isRejected,
  onEnroll,
}) => {
  const schedule = `${course.days.join(", ")} | ${course.startTime} - ${course.endTime}`;

  const getButtonState = () => {
    if (userRole === "admin") {
      return {
        text: "View Details",
        icon: Eye,
        disabled: false,
        action: () => {},
        href: `/dashboard/courses/${course.id}`,
      };
    }
    if (isEnrolled) {
      return {
        text: "Enrolled",
        icon: CheckCircle,
        disabled: true,
        action: () => {},
        href: `/dashboard/courses/${course.id}`,
      };
    }
    if (hasPendingRequest) {
      return {
        text: "Request Pending",
        icon: Hourglass,
        disabled: true,
        action: () => {},
        href: `/dashboard/courses/${course.id}`,
      };
    }
    if (isRejected) {
      return {
        text: "Request Rejected",
        icon: XCircle,
        disabled: true,
        action: () => {},
        href: `/dashboard/courses/${course.id}`,
      };
    }
    return {
      text: "Enroll Now",
      icon: BookOpen,
      disabled: false,
      action: () => onEnroll && onEnroll(course._id), // 🔥 correction ici
      href: undefined,
    };
  };

  const buttonState = getButtonState();

  return (
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
          <CardDescription className="mt-2 h-10 overflow-hidden text-ellipsis">
            {course.description}
          </CardDescription>
        </div>
      </CardHeader>
  
      <CardContent className="flex flex-col space-y-2">
        <div className="text-sm text-muted-foreground">
          {`${course.days?.join(", ") || ""} | ${course.startTime} - ${course.endTime}`}
        </div>
        <div className="font-headline text-2xl font-bold text-primary">
          {course.price} FBU
        </div>
      </CardContent>
  
      <CardFooter>
        {buttonState.href ? (
          <Button variant="default" disabled={buttonState.disabled} asChild className="w-full">
            <Link href={buttonState.href}>
              <buttonState.icon className="mr-2" />
              {buttonState.text}
            </Link>
          </Button>
        ) : (
          <Button
            variant="default"
            disabled={buttonState.disabled}
            onClick={buttonState.action}
            className="w-full"
          >
            <buttonState.icon className="mr-2" />
            {buttonState.text}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
  
};
