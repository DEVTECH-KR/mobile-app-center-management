import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import { coursesApi, usersApi, enrollmentApi } from "@/lib/api/courses.api";
import type { ICourse } from "@/server/api/courses/course.schema";
import type { IUser } from "@/server/api/auth/user.schema";
import type { IEnrollment } from "@/server/api/enrollments/enrollment.schema";
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
    const enrollments: IEnrollment[] = await enrollmentApi.getByCourse(courseId, token);
    const userEnrollment = enrollments.find(e => e.studentId === userId);
    return {
      hasPendingRequest: userEnrollment?.status === "pending",
      isEnrolled: userEnrollment?.status === "approved",
      isRejected: userEnrollment?.status === "rejected",
    };
  } catch (error) {
    return { hasPendingRequest: false, isEnrolled: false, isRejected: false };
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
    enrollmentStatus = await fetchEnrollmentStatus(id, currentUser.id, token);
  }

  return (
    <ClientCourseDetails
      course={course}
      currentUser={currentUser}
      {...enrollmentStatus}
    />
  );
}