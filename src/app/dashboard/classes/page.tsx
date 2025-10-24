'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, MoreVertical, PlusCircle, Trash2, Users, Edit } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger, // Ajout de l'importation manquante
} from '@/components/ui/alert-dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { classesApi } from '@/lib/api/classes.api';
import { coursesApi, usersApi } from '@/lib/api/courses.api';
import { useAuth } from '@/lib/auth';
import type { IClass } from '@/server/api/classes/class.schema';
import type { ICourse } from '@/server/api/courses/course.schema';
import type { IUser } from '@/server/api/auth/user.schema';
import { UserRole } from '@/lib/types';

const formSchema = z.object({
  courseId: z.string({ required_error: 'Please select a course.' }),
  level: z.string().optional(),
  name: z.string().min(1, { message: 'Class name is required.' }),
  teacherId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid teacher ID').optional(),
});

export default function ClassesPage() {
  const { token } = useAuth();
  const [classes, setClasses] = useState<IClass[]>([]);
  const [courses, setCourses] = useState<ICourse[]>([]);
  const [availableTeachers, setAvailableTeachers] = useState<IUser[]>([]);
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<IClass | null>(null);
  const [viewingClass, setViewingClass] = useState<IClass | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userRole, setUserRole] = useState<UserRole>('student');
  const [filterName, setFilterName] = useState('');
  const [filterCourseTitle, setFilterCourseTitle] = useState('');
  const filterTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { name: '', courseId: '', level: '', teacherId: '' },
  });

  const selectedCourseId = form.watch('courseId');
  const selectedCourse = courses.find((c) => c._id === selectedCourseId);

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      try {
        const user = await usersApi.getCurrentUser(token);
        if (!user) {
          toast({ title: 'Error', description: 'Please log in again.', variant: 'destructive' });
          return;
        }
        setUserRole(user.role);

        if (user.role !== 'admin') {
          toast({ title: 'Access Denied', description: 'Only admins can access this page.', variant: 'destructive' });
          return;
        }

        const [courseResult, classResult] = await Promise.all([
          coursesApi.getAll({}, token),
          classesApi.getAll({ name: filterName, courseTitle: filterCourseTitle }, token),
        ]);

        setCourses(courseResult.courses || []);
        setClasses(classResult.classes || []);
      } catch (error: any) {
        console.error('Fetch error:', error);
        toast({ title: 'Error', description: error.message || 'Failed to load data.', variant: 'destructive' });
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [token]);

  useEffect(() => {
    if (filterTimeoutRef.current) clearTimeout(filterTimeoutRef.current);
    filterTimeoutRef.current = setTimeout(async () => {
      try {
        const result = await classesApi.getAll({
          name: filterName || undefined,
          courseTitle: filterCourseTitle || undefined,
        }, token);
        setClasses(result.classes || []);
      } catch (error: any) {
        console.error('Filter fetch error:', error);
        toast({ title: 'Error', description: error.message || 'Failed to apply filters.', variant: 'destructive' });
      }
    }, 500);

    return () => {
      if (filterTimeoutRef.current) clearTimeout(filterTimeoutRef.current);
    };
  }, [filterName, filterCourseTitle, token]);

  useEffect(() => {
    const fetchAvailableTeachers = async () => {
      if (selectedCourseId) {
        try {
          const teachers = await classesApi.getTeachersForCourse(selectedCourseId, token);
          setAvailableTeachers(teachers);
        } catch (error: any) {
          console.error('Fetch teachers error:', error);
          setAvailableTeachers([]);
          toast({ title: 'Error', description: 'Failed to load teachers for course.', variant: 'destructive' });
        }
      } else {
        setAvailableTeachers([]);
      }
    };

    fetchAvailableTeachers();
  }, [selectedCourseId, token]);

  const handleOpenCreateDialog = () => {
    setEditingClass(null);
    form.reset({ name: '', courseId: '', level: '', teacherId: '' });
    setIsFormDialogOpen(true);
  };

  const handleOpenEditDialog = (cls: IClass) => {
    setEditingClass(cls);
    form.reset({
      name: cls.name,
      courseId: cls.courseId?._id?.toString() || cls.courseId,
      level: cls.level || '',
      teacherId: cls.teacherId?._id?.toString() || cls.teacherId || '',
    });
    setIsFormDialogOpen(true);
  };

  const handleOpenViewStudentsDialog = (cls: IClass) => {
    setViewingClass(cls);
  };

  const handleDeleteClass = async (classId: string) => {
    try {
      await classesApi.delete(classId, token);
      const result = await classesApi.getAll({
        name: filterName || undefined,
        courseTitle: filterCourseTitle || undefined,
      }, token);
      setClasses(result.classes || []);
      toast({ title: 'Class Deleted', description: 'The class has been successfully deleted.', variant: 'destructive' });
    } catch (error: any) {
      console.error('Delete class error:', error);
      toast({ title: 'Error', description: error.message || 'Failed to delete class.', variant: 'destructive' });
    }
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      if (editingClass?._id) {
        await classesApi.update(String(editingClass._id), values, token);
        toast({ title: 'Class Updated', description: `The class "${values.name}" has been updated.` });
      } else {
        await classesApi.create(values, token);
        toast({ title: 'Class Created', description: `The class "${values.name}" has been successfully created.` });
      }
      const result = await classesApi.getAll({
        name: filterName || undefined,
        courseTitle: filterCourseTitle || undefined,
      }, token);
      setClasses(result.classes || []);
      setIsFormDialogOpen(false);
      setEditingClass(null);
      form.reset();
    } catch (error: any) {
      console.error('Save class error:', error);
      toast({ title: 'Error', description: error.message || 'Failed to save class.', variant: 'destructive' });
    }
  };

  if (isLoading) {
    return <div className="flex items-center justify-center py-10"><Loader2 className="animate-spin h-8 w-8" /></div>;
  }

  if (userRole !== 'admin') {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">You do not have permission to access this page.</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-3xl font-bold font-headline tracking-tight">Manage Classes</h2>
          <p className="text-muted-foreground">
            Create new classes, assign teachers, and view student enrollments.
          </p>
        </div>
        <Button onClick={handleOpenCreateDialog}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Create Class
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <Input
          placeholder="Filter by class name..."
          value={filterName}
          onChange={(e) => setFilterName(e.target.value)}
          className="max-w-sm"
        />
        <Input
          placeholder="Filter by course title..."
          value={filterCourseTitle}
          onChange={(e) => setFilterCourseTitle(e.target.value)}
          className="max-w-sm"
        />
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Class</TableHead>
              <TableHead>Course</TableHead>
              <TableHead>Teacher</TableHead>
              <TableHead>Students</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {classes.map((cls) => (
              <TableRow key={String(cls._id)}>
                <TableCell>
                  <div className="font-medium">{cls.name}</div>
                  <div className="text-sm text-muted-foreground">{cls.level || 'N/A'}</div>
                </TableCell>
                <TableCell>{cls.courseId?.title || 'Unknown'}</TableCell>
                <TableCell>
                  {cls.teacherId ? (
                    <Badge variant="secondary">{cls.teacherId.name}</Badge>
                  ) : (
                    <Badge variant="outline">Unassigned</Badge>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    {cls.studentIds.length}
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuItem onClick={() => handleOpenEditDialog(cls)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit Class
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleOpenViewStudentsDialog(cls)}
                        disabled={cls.studentIds.length === 0}
                      >
                        <Users className="mr-2 h-4 w-4" />
                        View Students
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <DropdownMenuItem
                            onSelect={(e) => e.preventDefault()}
                            className="text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete Class
                          </DropdownMenuItem>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This action cannot be undone. This will permanently delete the class{' '}
                              <span className="font-semibold">"{cls.name}"</span>.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDeleteClass(String(cls._id))}>
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!viewingClass} onOpenChange={(open) => !open && setViewingClass(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Students in {viewingClass?.name}</DialogTitle>
            <DialogDescription>
              {viewingClass?.courseId?.title} - {viewingClass?.level || 'N/A'}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            {viewingClass && viewingClass.studentIds.length > 0 ? (
              viewingClass.studentIds.map((student: any) => (
                <div key={student._id} className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage src={student.avatarUrl} alt={student.name} />
                    <AvatarFallback>{student.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{student.name}</p>
                    <p className="text-sm text-muted-foreground">{student.email}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No students are enrolled in this class yet.</p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewingClass(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isFormDialogOpen} onOpenChange={setIsFormDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <DialogHeader>
                <DialogTitle>{editingClass ? 'Edit Class' : 'Create a new class'}</DialogTitle>
                <DialogDescription>
                  {editingClass ? 'Update the details for this class.' : 'Fill in the details below to create a new class.'}
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <FormField
                  control={form.control}
                  name="courseId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Course</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a course" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {courses.map((course) => (
                            <SelectItem key={course._id} value={course._id}>
                              {course.title}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {selectedCourse && selectedCourse.levels && (
                  <FormField
                    control={form.control}
                    name="level"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Level</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a level" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {selectedCourse.levels.map((level) => (
                              <SelectItem key={level} value={level}>
                                {level}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Class Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Room A" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="teacherId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Teacher</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value} disabled={!selectedCourseId}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={selectedCourseId ? "Select a teacher" : "Select course first"} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {availableTeachers.map((teacher) => (
                            <SelectItem key={teacher._id} value={teacher._id}>
                              {teacher.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsFormDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {editingClass ? 'Save Changes' : 'Create Class'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}