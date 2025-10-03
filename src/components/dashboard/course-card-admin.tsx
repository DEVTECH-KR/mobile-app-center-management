import React from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Edit, Trash2, Eye, MoreVertical } from "lucide-react";
import type { ICourse } from "@/server/api/courses/course.schema";
import Link from "next/link";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

interface CourseCardAdminProps {
  course: ICourse;
  onEdit?: (course: ICourse) => void;
  onDelete?: (course: ICourse) => void;
}

export const CourseCardAdmin: React.FC<CourseCardAdminProps> = ({ course, onEdit, onDelete }) => {
  const schedule = `${course.days?.join(', ') || "Not specified"} | ${course.startTime && course.endTime ? `${course.startTime} - ${course.endTime}` : "Time not specified"}`;

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
            <CardDescription className="mt-2 h-10 overflow-hidden text-ellipsis">
              {course.description || "No description available"}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="flex-grow space-y-2">
          <div className="text-sm text-muted-foreground">{schedule}</div>
          <div className="font-headline text-2xl font-bold text-primary">
            {course.price ? `${course.price} FBU` : "Free"}
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          {/* Empty CardFooter to maintain layout consistency */}
        </CardFooter>
      </Card>
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="secondary" size="icon" className="h-8 w-8 rounded-full bg-background/70 hover:bg-background">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link href={`/dashboard/courses/${course._id}`}>
                <Eye className="mr-2 h-4 w-4" />
                View Details
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => {
              console.log('Edit button clicked for course:', course._id);
              onEdit?.(course);
            }}>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={() => {
                console.log('Delete button clicked for course:', course._id);
                onDelete?.(course);
              }}
              className="text-destructive"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};