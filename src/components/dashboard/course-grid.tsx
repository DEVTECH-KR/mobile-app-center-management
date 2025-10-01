// src/components/dashboard/course-grid.tsx
import React from "react";
import type { Course, UserRole, EnrollmentRequest } from "@/lib/types";
import { CourseCardAdmin } from "./course-card-admin";
import { CourseCardUser } from "./course-card-user";

interface CoursesGridProps {
  courses: Course[];
  userRole?: UserRole;
  currentUserId?: string;
  enrollmentRequests?: EnrollmentRequest[]; // 🔥 correction ici
}

export const CoursesGrid: React.FC<CoursesGridProps> = ({
  courses,
  userRole,
  currentUserId,
  enrollmentRequests = [],
}) => {
  return (
    <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
      {courses.map((course) => {
        if (userRole === "admin") {
          return <CourseCardAdmin key={course._id} course={course} />; // 🔥 clé sur _id
        }

        const isEnrolled = enrollmentRequests.some(
          (req) => req.courseId._id === course._id && req.status === "approved" // 🔥 correction
        );

        const hasPendingRequest = enrollmentRequests.some(
          (req) => req.courseId._id === course._id && req.status === "pending" // 🔥 correction
        );

        const isRejected = enrollmentRequests.some(
          (req) => req.courseId._id === course._id && req.status === "rejected" // 🔥 ajout rejeté
        );

        return (
          <CourseCardUser
            key={course._id}
            course={course}
            userRole={userRole}
            isEnrolled={isEnrolled}
            hasPendingRequest={hasPendingRequest}
            isRejected={isRejected} // 🔥 ajout rejeté
          />
        );
      })}
    </div>
  );
};
