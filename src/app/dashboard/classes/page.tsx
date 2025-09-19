
'use client';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MOCK_CLASSES, MOCK_COURSES, MOCK_USERS } from "@/lib/mock-data";
import { Input } from "@/components/ui/input";
import { BookMarked, Loader2, MoreVertical, PlusCircle, Search, Users } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import type { Course, Class } from "@/lib/types";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";


const formSchema = z.object({
  courseId: z.string({ required_error: "Please select a course." }),
  level: z.string().optional(),
  name: z.string().min(1, { message: "Class name is required." }),
});


// In a real app, this would come from an auth context
const currentUser = MOCK_USERS.admin;
const allCourses = MOCK_COURSES;
const allTeachers = Object.values(MOCK_USERS).filter(u => u.role === 'teacher');

export default function ClassesPage() {
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [classes, setClasses] = useState<Class[]>(MOCK_CLASSES);
    const { toast } = useToast();

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: "",
        },
    });

    const selectedCourseId = form.watch("courseId");
    const selectedCourse = allCourses.find(c => c.id === selectedCourseId);

    function onSubmit(values: z.infer<typeof formSchema>) {
        // Simulate API call
        setTimeout(() => {
            const newClass: Class = {
                id: `class-${Date.now()}`,
                courseId: values.courseId,
                name: values.name,
                level: values.level || 'N/A',
                teacherId: null,
                studentIds: [],
            }
            setClasses(prev => [newClass, ...prev]);
            toast({
                title: "Class Created",
                description: `The class "${newClass.name}" has been successfully created.`,
            });
            setIsCreateDialogOpen(false);
            form.reset();
        }, 500);
    }

    if (currentUser.role !== 'admin') {
        return (
            <div className="flex items-center justify-center h-full">
                <p className="text-muted-foreground">You do not have permission to access this page.</p>
            </div>
        )
    }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
            <h2 className="text-3xl font-bold font-headline tracking-tight">
            Manage Classes
            </h2>
            <p className="text-muted-foreground">
                Create new classes, assign teachers, and view student enrollments.
            </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
                <Button>
                    <PlusCircle className="mr-2 h-4 w-4"/>
                    Create Class
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                        <DialogHeader>
                        <DialogTitle>Create a new class</DialogTitle>
                        <DialogDescription>
                            Fill in the details below to create a new class.
                        </DialogDescription>
                        </DialogHeader>
                        
                        <div className="grid gap-4 py-4">
                            <FormField
                                control={form.control}
                                name="courseId"
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>Course</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select a course" />
                                        </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                        {allCourses.map(course => <SelectItem key={course.id} value={course.id}>{course.title}</SelectItem>)}
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
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select a level" />
                                            </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {selectedCourse.levels.map(level => <SelectItem key={level} value={level}>{level}</SelectItem>)}
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
                        </div>

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>Cancel</Button>
                            <Button type="submit" disabled={form.formState.isSubmitting}>
                                {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Create Class
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
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
            {classes.map((cls) => {
              const course = MOCK_COURSES.find(c => c.id === cls.courseId);
              const teacher = Object.values(MOCK_USERS).find(u => u.id === cls.teacherId) || null;
              const students = cls.studentIds.map(id => Object.values(MOCK_USERS).find(u => u.id === id));
              return(
              <TableRow key={cls.id}>
                <TableCell>
                  <div className="font-medium">{cls.name}</div>
                  <div className="text-sm text-muted-foreground">{cls.level}</div>
                </TableCell>
                <TableCell>{course?.title}</TableCell>
                <TableCell>
                    {teacher ? (
                         <Badge variant="secondary">{teacher.name}</Badge>
                    ) : (
                        <Badge variant="outline">Unassigned</Badge>
                    )}
                </TableCell>
                 <TableCell>
                    <div className="flex items-center gap-1">
                        <Users className="h-4 w-4 text-muted-foreground"/>
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
                        <DropdownMenuItem>Edit Class</DropdownMenuItem>
                        <DropdownMenuItem>View Students</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive">Delete Class</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            )})}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
