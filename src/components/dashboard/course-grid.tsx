// src/components/dashboard/course-grid.tsx
import React from "react";
import { CourseCardAdmin } from "./course-card-admin";
import { CourseCardUser } from "./course-card-user";
import type { ICourse } from "@/server/api/courses/course.schema";
import type { IEnrollment } from '@/server/api/enrollments/enrollment.schema';

interface CoursesGridProps {
  courses: ICourse[];
  userRole?: "admin" | "student" | "teacher";
  currentUserId?: string;
  enrollmentRequests?: IEnrollment[];
  onEnroll?: (courseId: string) => void;
  onEdit?: (course: ICourse) => void;
  onDelete?: (courseId: string) => void;
}

export const CoursesGrid: React.FC<CoursesGridProps> = ({
  courses,
  userRole,
  currentUserId,
  enrollmentRequests = [],
  onEnroll,
  onEdit,
  onDelete,
}) => {
  if (!courses || courses.length === 0) {
    return <div className="text-center text-muted-foreground py-10">No courses available yet.</div>;
  }

  return (
    <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
      {courses.map((course) => {
        if (userRole === "admin") {
          return (
            <CourseCardAdmin
              key={String(course._id)}
              course={course}
              onEdit={onEdit} // FIXED: Pass onEdit
              onDelete={onDelete} // FIXED: Pass onDelete
            />
          );
        }

        const isEnrolled = enrollmentRequests.some((req) => String(req.courseId._id) === String(course._id) && req.status === "approved");
        const isRejected = enrollmentRequests.some((req) => String(req.courseId._id) === String(course._id) && req.status === "rejected");
        const hasPendingRequest = enrollmentRequests.some((req) => String(req.courseId._id) === String(course._id) && req.status === "pending");

        return (
          <CourseCardUser
            key={String(course._id)}
            course={course}
            userRole={userRole}
            isEnrolled={isEnrolled}
            hasPendingRequest={hasPendingRequest}
            isRejected={isRejected}
            onEnroll={onEnroll}
          />
        );
      })}
    </div>
  );
};