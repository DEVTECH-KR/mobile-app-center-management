
'use client';

import { useState } from "react";
import { CourseCard } from "@/components/dashboard/course-card";
import { MOCK_COURSES, MOCK_USERS } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";
import { Edit, Loader2, MoreVertical, PlusCircle, Trash2 } from "lucide-react";
import type { Course } from "@/lib/types";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

// In a real app, this would come from an auth context
const currentUser = MOCK_USERS.admin;

const formSchema = z.object({
  title: z.string().min(3, { message: "Title must be at least 3 characters." }),
  description: z.string().min(10, { message: "Description is required." }),
  price: z.coerce.number().min(0, { message: "Price must be a positive number." }),
  schedule: z.string().min(1, { message: "Schedule is required." }),
  imageUrl: z.string().url({ message: "Please enter a valid URL." }),
  imageHint: z.string().optional(),
});


export default function CoursesPage() {
    const [courses, setCourses] = useState<Course[]>(MOCK_COURSES);
    const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
    const [editingCourse, setEditingCourse] = useState<Course | null>(null);
    const { toast } = useToast();

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
    });

    const handleOpenCreateDialog = () => {
        setEditingCourse(null);
        form.reset({ title: "", description: "", price: 0, schedule: "", imageUrl: "", imageHint: "" });
        setIsFormDialogOpen(true);
    };

    const handleOpenEditDialog = (course: Course) => {
        setEditingCourse(course);
        form.reset(course);
        setIsFormDialogOpen(true);
    };

    const handleDeleteCourse = (courseId: string) => {
        setCourses(prev => prev.filter(c => c.id !== courseId));
        toast({
            title: "Course Deleted",
            description: "The course has been successfully deleted.",
            variant: "destructive"
        });
    }

    function onSubmit(values: z.infer<typeof formSchema>) {
         form.handleSubmit(() => {
            // Simulate API call
            setTimeout(() => {
                if (editingCourse) {
                    const updatedCourse = { ...editingCourse, ...values };
                    setCourses(prev => prev.map(c => c.id === editingCourse.id ? updatedCourse : c));
                    toast({
                        title: "Course Updated",
                        description: `The course "${updatedCourse.title}" has been updated.`,
                    });
                } else {
                    const newCourse: Course = {
                        id: `course-${Date.now()}`,
                        ...values,
                        teacherIds: [], // Default value for new course
                    }
                    setCourses(prev => [newCourse, ...prev]);
                    toast({
                        title: "Course Created",
                        description: `The course "${newCourse.title}" has been successfully created.`,
                    });
                }
                setIsFormDialogOpen(false);
                setEditingCourse(null);
                form.reset();
            }, 500);
        })()
    }
  
  if (currentUser.role !== 'admin') {
      return (
        <div className="space-y-6">
            <div>
                <h2 className="text-3xl font-bold font-headline tracking-tight">
                Our Courses
                </h2>
                <p className="text-muted-foreground">
                Browse our available courses and start your learning journey today.
                </p>
            </div>
            <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                {courses.map((course) => (
                    <CourseCard key={course.id} course={course} />
                ))}
            </div>
        </div>
      );
  }

  return (
    <div className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
                <h2 className="text-3xl font-bold font-headline tracking-tight">
                    Manage Courses
                </h2>
                <p className="text-muted-foreground">
                    Add, edit, and delete courses offered by the center.
                </p>
            </div>
            <Button onClick={handleOpenCreateDialog}>
                <PlusCircle className="mr-2 h-4 w-4"/>
                Create Course
            </Button>
        </div>

        <Dialog open={isFormDialogOpen} onOpenChange={setIsFormDialogOpen}>
            <DialogContent className="sm:max-w-2xl">
                 <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                        <DialogHeader>
                            <DialogTitle>{editingCourse ? 'Edit Course' : 'Create a new course'}</DialogTitle>
                            <DialogDescription>
                                {editingCourse ? 'Update the details for this course.' : 'Fill in the details below to create a new course.'}
                            </DialogDescription>
                        </DialogHeader>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4 max-h-[70vh] overflow-y-auto pr-4">
                            <FormField control={form.control} name="title" render={({ field }) => (
                                <FormItem className="md:col-span-2">
                                    <FormLabel>Title</FormLabel>
                                    <FormControl><Input placeholder="e.g. Advanced React" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}/>
                             <FormField control={form.control} name="description" render={({ field }) => (
                                <FormItem className="md:col-span-2">
                                    <FormLabel>Description</FormLabel>
                                    <FormControl><Textarea placeholder="Describe the course..." {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}/>
                            <FormField control={form.control} name="price" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Price (FBU)</FormLabel>
                                    <FormControl><Input type="number" placeholder="50000" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}/>
                             <FormField control={form.control} name="schedule" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Schedule</FormLabel>
                                    <FormControl><Input placeholder="Mon, Wed | 9-11 AM" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}/>
                            <FormField control={form.control} name="imageUrl" render={({ field }) => (
                                <FormItem className="md:col-span-2">
                                    <FormLabel>Image URL</FormLabel>
                                    <FormControl><Input type="url" placeholder="https://picsum.photos/seed/..." {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}/>
                             <FormField control={form.control} name="imageHint" render={({ field }) => (
                                <FormItem className="md:col-span-2">
                                    <FormLabel>Image Hint</FormLabel>
                                    <FormControl><Input placeholder="e.g. 'code screen'" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}/>
                        </div>

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setIsFormDialogOpen(false)}>Cancel</Button>
                            <Button type="submit" disabled={form.formState.isSubmitting}>
                                {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {editingCourse ? 'Save Changes' : 'Create Course'}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>

        <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {courses.map((course) => (
                <div key={course.id} className="relative group">
                    <CourseCard course={course} />
                     <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="secondary" size="icon" className="h-8 w-8 rounded-full bg-background/70 hover:bg-background">
                                    <MoreVertical className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuItem onClick={() => handleOpenEditDialog(course)}>
                                    <Edit className="mr-2 h-4 w-4" />
                                    Edit Course
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive">
                                            <Trash2 className="mr-2 h-4 w-4" />
                                            Delete Course
                                        </DropdownMenuItem>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                This action cannot be undone. This will permanently delete the course <span className="font-semibold">"{course.title}"</span>.
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                            <AlertDialogAction onClick={() => handleDeleteCourse(course.id)}>Delete</AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>
            ))}
        </div>
    </div>
  );
}
