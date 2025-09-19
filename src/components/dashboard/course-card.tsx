import Image from "next/image";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { Course } from "@/lib/types";
import { BookOpen, Clock } from "lucide-react";

export function CourseCard({ course }: { course: Course }) {
  const currencyFormatter = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "FBU",
    minimumFractionDigits: 0,
  });

  return (
    <Card className="flex flex-col overflow-hidden">
      <CardHeader className="p-0">
        <div className="relative h-48 w-full">
          <Image
            src={course.imageUrl}
            alt={course.title}
            fill
            className="object-cover"
            data-ai-hint={course.imageHint}
          />
        </div>
        <div className="p-6">
          <CardTitle className="font-headline text-xl">{course.title}</CardTitle>
          <CardDescription className="mt-2">{course.description}</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="flex-grow space-y-2">
          <div className="flex items-center text-sm text-muted-foreground">
            <Clock className="mr-2 h-4 w-4" />
            <span>{course.schedule}</span>
          </div>
          <div className="font-headline text-2xl font-bold text-primary">
            {currencyFormatter.format(course.price)}
          </div>
      </CardContent>
      <CardFooter>
        <Button className="w-full">
            <BookOpen className="mr-2"/>
            Enroll Now
        </Button>
      </CardFooter>
    </Card>
  );
}
