// 
// src/app/dashboard/courses/[id]/page.tsx
import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import { coursesApi, usersApi } from "@/lib/api/courses.api";
import type { ICourse } from "@/server/api/courses/course.schema";
import type { IUser } from "@/server/api/auth/user.schema";
import ClientCourseDetails from "./client";

async function fetchCourseData(id: string, token?: string) {
  try {
    const course = await coursesApi.getById(id, token);
    console.log("Server: Fetched course:", course);
    return course;
  } catch (error: any) {
    console.error("Server: fetchCourseData error:", error);
    if (error.message === "Course not found") notFound();
    throw error;
  }
}

async function fetchUserData(token?: string) {
  try {
    const user = await usersApi.getCurrentUser(token);
    console.log("Server: Fetched user:", user);
    return user;
  } catch (error: any) {
    console.error("Server: fetchUserData error:", error);
    return null;
  }
}

async function fetchEnrollmentStatus(courseId: string, userId: string, token?: string) {
  try {
    const response = await fetch(`/api/enrollments/status?studentId=${userId}&courseId=${courseId}`, {
      headers: {
        Authorization: token ? `Bearer ${token}` : '',
      },
    });
    if (!response.ok) {
      if (response.status === 404) return { status: 'not_enrolled' };
      throw new Error('Failed to fetch enrollment status');
    }
    const data = await response.json();
    return data;
  } catch (error) {
    return { status: 'not_enrolled' };
  }
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function CourseDetailsPage({ params }: PageProps) {
  const resolvedParams = await params;
  const { id } = resolvedParams;

  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  const course: ICourse = await fetchCourseData(id, token);
  const currentUser: IUser | null = await fetchUserData(token);

  let enrollmentStatus = { hasPendingRequest: false, isEnrolled: false, isRejected: false };
  if (currentUser?.role === "student") {
    const status = await fetchEnrollmentStatus(id, currentUser.id, token);
    enrollmentStatus = {
      hasPendingRequest: status.status === "pending",
      isEnrolled: status.status === "approved",
      isRejected: status.status === "rejected",
    };
  }

  return (
    <ClientCourseDetails
      course={course}
      currentUser={currentUser}
      {...enrollmentStatus}
    />
  );
}