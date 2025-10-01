// src/components/dashboard/course-card.tsx

import Image from "next/image";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { Course, UserRole } from "@/lib/types";
import { BookOpen, CheckCircle, Clock, Eye, Hourglass } from "lucide-react";
import Link from "next/link";

interface CourseCardProps {
  course: Course;
  userRole?: UserRole;
  isEnrolled?: boolean;
  hasPendingRequest?: boolean;
}

export function CourseCard({ course, userRole, isEnrolled, hasPendingRequest }: CourseCardProps) {
  const currencyFormatter = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "FBU",
    minimumFractionDigits: 0,
  });

  const schedule = `${course.days.join(', ')} | ${course.startTime} - ${course.endTime}`;

  const getButtonState = () => {
    if (userRole === 'admin') {
      return {
        text: "View Details",
        icon: Eye,
        disabled: false,
        variant: "outline" as const,
        href: `/dashboard/courses/${course.id}`,
      };
    }
    if (isEnrolled) {
      return {
        text: "Enrolled",
        icon: CheckCircle,
        disabled: true,
        variant: "secondary" as const,
        href: `/dashboard/courses/${course.id}`,
      };
    }
    if (hasPendingRequest) {
      return {
        text: "Request Pending",
        icon: Hourglass,
        disabled: true,
        variant: "secondary" as const,
        href: `/dashboard/courses/${course.id}`,
      };
    }
    return {
      text: "Enroll Now",
      icon: BookOpen,
      disabled: false,
      variant: "default" as const,
      href: `/dashboard/courses/${course.id}`,
    };
  };

  const buttonState = getButtonState();

  return (
    <Card className="flex flex-col overflow-hidden">
      <CardHeader className="p-0">
        <div className="relative h-48 w-full">
          <Image
            src={course.imageUrl || "/default-course.png"} 
            alt={course.title}
            fill
            className="object-cover"
            data-ai-hint={course.imageHint}
          />
        </div>
        <div className="p-6">
          <CardTitle className="font-headline text-xl">{course.title}</CardTitle>
          <CardDescription className="mt-2 h-10 overflow-hidden text-ellipsis">
            {course.description}
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="flex-grow space-y-2">
          <div className="flex items-center text-sm text-muted-foreground">
            <Clock className="mr-2 h-4 w-4" />
            <span>{schedule}</span>
          </div>
          <div className="font-headline text-2xl font-bold text-primary">
            {currencyFormatter.format(course.price)}
          </div>
      </CardContent>
      <CardFooter>
        <Button className="w-full" variant={buttonState.variant} disabled={buttonState.disabled} asChild>
            <Link href={buttonState.href}>
                <buttonState.icon className="mr-2"/>
                {buttonState.text}
            </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
