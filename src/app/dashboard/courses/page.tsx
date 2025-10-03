// src/app/dashboard/courses/page.tsx
"use client";

import React, { useState, useEffect, useRef } from "react";
import { CoursesGrid } from "@/components/dashboard/course-grid";
import { CourseDialog } from "@/components/dashboard/course-dialog";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { UserRole } from "@/lib/types";
import type { CourseDay, ICourse } from "@/server/api/courses/course.schema";
import type { IEnrollment } from "@/server/api/enrollments/enrollment.schema";
import type { IUser } from "@/server/api/auth/user.schema";
import { coursesApi, enrollmentApi, usersApi } from "@/lib/api/courses.api";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function CoursesPage() {
  const [courses, setCourses] = useState<ICourse[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<ICourse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userRole, setUserRole] = useState<UserRole>("student");
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [enrollmentRequests, setEnrollmentRequests] = useState<IEnrollment[]>([]);
  const [filterTitle, setFilterTitle] = useState("");
  const [filterLevel, setFilterLevel] = useState("");
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false); // NEW: State for delete confirmation
  const [courseToDelete, setCourseToDelete] = useState<ICourse | null>(null); // NEW: Track course to delete
  const filterTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const { toast } = useToast();
  const router = useRouter();
  const hasFetched = useRef(false);

  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;

    async function fetchData() {
      setIsLoading(true);
      try {
        const user: IUser | null = await usersApi.getCurrentUser();
        console.log('Fetched user:', user);
        if (!user) {
          toast({ title: "Error", description: "Failed to load user—please log in again.", variant: "destructive" });
          router.push('/login');
          return;
        }

        setCurrentUserId(String(user._id));
        setUserRole(user.role);

        const result = await coursesApi.getAll({
          title: filterTitle || undefined,
          levels: filterLevel && filterLevel !== "all" ? [filterLevel] : undefined,
        });
        console.log('Fetched courses:', result);
        setCourses(result.courses || []);

        if (user.role !== "admin") {
          try {
            const requests: IEnrollment[] = await enrollmentApi.getEnrollmentRequests(String(user._id));
            console.log('Fetched enrollment requests:', requests);
            setEnrollmentRequests(requests);
          } catch (error: any) {
            console.error('Enrollment fetch error:', error);
            if (error.message.includes('404')) {
              setEnrollmentRequests([]);
            } else {
              toast({ title: "Error", description: error.message || "Failed to load enrollment requests.", variant: "destructive" });
            }
          }
        }
      } catch (error: any) {
        console.error('Courses fetch error:', error);
        toast({ title: "Error", description: error.message || "Failed to load courses—try refreshing.", variant: "destructive" });
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, []);

  useEffect(() => {
    if (filterTimeoutRef.current) clearTimeout(filterTimeoutRef.current);
    filterTimeoutRef.current = setTimeout(async () => {
      try {
        const result = await coursesApi.getAll({
          title: filterTitle || undefined,
          levels: filterLevel && filterLevel !== "all" ? [filterLevel] : undefined,
        });
        console.log('Fetched courses (filter):', result);
        setCourses(result.courses || []);
      } catch (error: any) {
        console.error('Filter fetch error:', error);
        toast({ title: "Error", description: error.message || "Failed to apply filters.", variant: "destructive" });
      }
    }, 500);

    return () => {
      if (filterTimeoutRef.current) clearTimeout(filterTimeoutRef.current);
    };
  }, [filterTitle, filterLevel]);

  const handleEnroll = async (courseId: string) => {
    if (!currentUserId) {
      toast({ title: "Error", description: "Please log in to enroll.", variant: "destructive" });
      return;
    }
    try {
      await enrollmentApi.requestEnrollment(courseId, currentUserId);
      const requests = await enrollmentApi.getEnrollmentRequests(currentUserId);
      setEnrollmentRequests(requests);
      toast({ title: "Success", description: "Enrollment request submitted!" });
    } catch (error: any) {
      console.error('Enroll error:', error);
      toast({ title: "Error", description: error.message || "Failed to submit enrollment request.", variant: "destructive" });
    }
  };

  const handleOpenDialog = (course?: ICourse) => {
    console.log('handleOpenDialog called with course:', course);
    setEditingCourse(course ?? null);
    setIsDialogOpen(true);
  };

  const handleDelete = (course: ICourse) => { // MODIFIED: Accept full course object
    console.log('handleDelete called for course:', course._id, course.title);
    setCourseToDelete(course);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => { // NEW: Confirm deletion
    if (!courseToDelete) return;
    try {
      await coursesApi.delete(String(courseToDelete._id));
      const result = await coursesApi.getAll({
        title: filterTitle || undefined,
        levels: filterLevel && filterLevel !== "all" ? [filterLevel] : undefined,
      });
      setCourses(result.courses || []);
      toast({ title: "Success", description: `Course "${courseToDelete.title}" deleted!` });
    } catch (error: any) {
      console.error('Delete course error:', error);
      toast({ title: "Error", description: error.message || "Failed to delete course.", variant: "destructive" });
    } finally {
      setIsDeleteDialogOpen(false);
      setCourseToDelete(null);
    }
  };

  const handleSaveCourse = async (formData: {
    title: string;
    description: string;
    price: number;
    days: string[];
    startTime: string;
    endTime: string;
    imageUrl: string;
    imageHint?: string;
    teacherIds?: any[];
    levels: string[];
  }) => {
    const payload: Partial<ICourse> = {
      ...formData,
      teacherIds: formData.teacherIds?.map(t => {
        if (typeof t === 'string') return t; // Direct string ID
        if (typeof t === 'object' && t !== null) {
          return t.value || t.id || t._id || String(t); // Handle common select formats
        }
        throw new Error(`Invalid teacher ID format: ${JSON.stringify(t)}`);
      }) || [],
      days: formData.days.map(d => d as CourseDay),
      startTime: formData.startTime,
      endTime: formData.endTime,
      imageUrl: formData.imageUrl,
      imageHint: formData.imageHint,
      levels: formData.levels,
    };

    try {
      console.log('handleSaveCourse: FormData:', formData, 'Payload:', payload, 'Editing course ID:', editingCourse?._id);
      if (editingCourse?._id) {
        if (!editingCourse._id) {
          throw new Error('Course ID is missing for update');
        }
        const updatedCourse = await coursesApi.update(String(editingCourse._id), payload);
        console.log('handleSaveCourse: Updated course:', updatedCourse);
      } else {
        await coursesApi.create(payload);
      }

      const result = await coursesApi.getAll({
        title: filterTitle || undefined,
        levels: filterLevel && filterLevel !== "all" ? [filterLevel] : undefined,
      });
      setCourses(result.courses || []);
      setIsDialogOpen(false);
      toast({ title: "Success", description: "Course saved!" });
    } catch (error: any) {
      console.error('Save course error:', error);
      toast({ title: "Error", description: error.message || "Failed to save course.", variant: "destructive" });
    }
  };

  if (isLoading) {
    return <div className="flex items-center justify-center py-10"><Loader2 className="animate-spin h-8 w-8" /></div>;
  }

  console.log('Rendering CoursesGrid:', { courses, userRole, currentUserId, enrollmentRequests });

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Courses</h1>
        {userRole === "admin" && <Button onClick={() => handleOpenDialog()}>Create Course</Button>}
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <Input
          placeholder="Filter by title..."
          value={filterTitle}
          onChange={(e) => setFilterTitle(e.target.value)}
          className="max-w-sm"
        />
        <Select value={filterLevel} onValueChange={setFilterLevel}>
          <SelectTrigger className="max-w-sm">
            <SelectValue placeholder="Filter by level..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Levels</SelectItem>
            <SelectItem value="Beginner">Beginner</SelectItem>
            <SelectItem value="Intermediate">Intermediate</SelectItem>
            <SelectItem value="Advanced">Advanced</SelectItem>
            <SelectItem value="All levels">All levels</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {currentUserId && courses.length === 0 && (
        <div className="text-center text-muted-foreground py-10">No courses available yet.</div>
      )}

      {currentUserId && (
        <CoursesGrid
          courses={courses}
          userRole={userRole}
          currentUserId={currentUserId}
          enrollmentRequests={enrollmentRequests}
          onEnroll={handleEnroll}
          onEdit={handleOpenDialog}
          onDelete={handleDelete}
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

      {/* NEW: Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the course "{courseToDelete?.title || 'Unknown'}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsDeleteDialogOpen(false);
                setCourseToDelete(null);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDelete}
            >
              Proceed
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}