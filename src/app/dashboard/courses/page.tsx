"use client";

import React, { useState, useEffect } from "react";
import { CoursesGrid } from "@/components/dashboard/course-grid";
import { CourseDialog } from "@/components/dashboard/course-dialog";
import { Button } from "@/components/ui/button";
import { Course, UserRole, EnrollmentRequest } from "@/lib/types";
import { coursesApi, enrollmentApi, usersApi } from "@/lib/api/courses.api";

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);

  const [userRole, setUserRole] = useState<UserRole>("student");
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // 🔹 On garde le type complet
  const [enrollmentRequests, setEnrollmentRequests] = useState<EnrollmentRequest[]>([]);

  useEffect(() => {
    async function fetchData() {
      const user = await usersApi.getCurrentUser();
      if (!user) return;
      setCurrentUserId(user.id);
      setUserRole(user.role);

      const allCourses = await coursesApi.getAll();
      setCourses(allCourses);

      if (user.role !== "admin") {
        const requests: EnrollmentRequest[] = await enrollmentApi.getEnrollmentRequests(user.id);
        if (requests) setEnrollmentRequests(requests);
      }
    }

    fetchData();
  }, []);

  const handleOpenDialog = (course?: Course) => {
    setEditingCourse(course || null);
    setIsDialogOpen(true);
  };

  const handleSaveCourse = async (courseData: any) => {
    if (editingCourse?._id) {
      await coursesApi.update(editingCourse._id, courseData);
    } else {
      await coursesApi.create(courseData);
    }
    const updatedCourses = await coursesApi.getAll();
    setCourses(updatedCourses);
    setIsDialogOpen(false);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Courses</h1>
        {userRole === "admin" && (
          <Button onClick={() => handleOpenDialog()}>Create Course</Button>
        )}
      </div>

      {currentUserId && (
        <CoursesGrid
          courses={courses}
          userRole={userRole}
          currentUserId={currentUserId}
          enrollmentRequests={enrollmentRequests} 
        />
      )}

      {userRole === "admin" && (
        <CourseDialog
          isOpen={isDialogOpen}
          onOpenChange={setIsDialogOpen}
          editingCourse={editingCourse}
          onSave={handleSaveCourse}
        />
      )}
    </div>
  );
}
