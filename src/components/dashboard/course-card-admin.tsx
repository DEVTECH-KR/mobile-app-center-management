// src/components/dashboard/CourseCardAdmin.tsx
import React from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Course } from "@/lib/types";
import { Edit, Trash2 } from "lucide-react";

interface CourseCardAdminProps {
  course: Course;
}

export const CourseCardAdmin: React.FC<CourseCardAdminProps> = ({ course }) => {
  return (
    <Card className="flex flex-col overflow-hidden group relative">
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
      <CardContent className="flex-grow space-y-2">
        <div className="font-headline text-2xl font-bold text-primary">
          {course.price} FBU
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" size="sm">
          <Edit className="mr-2 h-4 w-4" />
          Edit
        </Button>
        <Button variant="destructive" size="sm">
          <Trash2 className="mr-2 h-4 w-4" />
          Delete
        </Button>
      </CardFooter>
    </Card>
  );
};
