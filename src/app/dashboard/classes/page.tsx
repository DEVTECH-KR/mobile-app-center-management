
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
import { Loader2, MoreVertical, PlusCircle, Trash2, Users, Edit } from "lucide-react";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import type { Course, Class, User } from "@/lib/types";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";


const formSchema = z.object({
  courseId: z.string({ required_error: "Please select a course." }),
  level: z.string().optional(),
  name: z.string().min(1, { message: "Class name is required." }),
});


// In a real app, this would come from an auth context
const currentUser = MOCK_USERS.admin;
const allCourses = MOCK_COURSES;
const allUsers = Object.values(MOCK_USERS);

export default function ClassesPage() {
    const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
    const [editingClass, setEditingClass] = useState<Class | null>(null);
    const [viewingClass, setViewingClass] = useState<Class | null>(null);
    const [classes, setClasses] = useState<Class[]>(MOCK_CLASSES);
    const { toast } = useToast();

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
    });

    const selectedCourseId = form.watch("courseId");
    const selectedCourse = allCourses.find(c => c.id === selectedCourseId);

    const handleOpenCreateDialog = () => {
        setEditingClass(null);
        form.reset({ name: "", courseId: "", level: "" });
        setIsFormDialogOpen(true);
    };

    const handleOpenEditDialog = (cls: Class) => {
        setEditingClass(cls);
        form.reset({
            name: cls.name,
            courseId: cls.courseId,
            level: cls.level,
        });
        setIsFormDialogOpen(true);
    };

    const handleOpenViewStudentsDialog = (cls: Class) => {
        setViewingClass(cls);
    };

    const handleDeleteClass = (classId: string) => {
        setClasses(prev => prev.filter(c => c.id !== classId));
        toast({
            title: "Class Deleted",
            description: "The class has been successfully deleted.",
            variant: "destructive"
        });
    }

    function onSubmit(values: z.infer<typeof formSchema>) {
        form.handleSubmit(() => {
            // Simulate API call
            setTimeout(() => {
                if (editingClass) {
                    // Update existing class
                    const updatedClass = { ...editingClass, ...values };
                    setClasses(prev => prev.map(c => c.id === editingClass.id ? updatedClass : c));
                    toast({
                        title: "Class Updated",
                        description: `The class "${updatedClass.name}" has been updated.`,
                    });
                } else {
                    // Create new class
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
                }
                setIsFormDialogOpen(false);
                setEditingClass(null);
                form.reset();
            }, 500);
        })()
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
        <Button onClick={handleOpenCreateDialog}>
            <PlusCircle className="mr-2 h-4 w-4"/>
            Create Class
        </Button>
      </div>

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
                                    <Select onValueChange={field.onChange} value={field.value}>
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
                        <Button type="button" variant="outline" onClick={() => setIsFormDialogOpen(false)}>Cancel</Button>
                        <Button type="submit" disabled={form.formState.isSubmitting}>
                            {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {editingClass ? 'Save Changes' : 'Create Class'}
                        </Button>
                    </DialogFooter>
                </form>
            </Form>
        </DialogContent>
      </Dialog>
      
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
              const teacher = allUsers.find(u => u.id === cls.teacherId) || null;
              
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
                        <DropdownMenuItem onClick={() => handleOpenEditDialog(cls)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit Class
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleOpenViewStudentsDialog(cls)} disabled={cls.studentIds.length === 0}>
                            <Users className="mr-2 h-4 w-4" />
                            View Students
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive">
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Delete Class
                                </DropdownMenuItem>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    This action cannot be undone. This will permanently delete the class <span className="font-semibold">"{cls.name}"</span>.
                                </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDeleteClass(cls.id)}>Delete</AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            )})}
          </TableBody>
        </Table>
      </div>

       <Dialog open={!!viewingClass} onOpenChange={(open) => !open && setViewingClass(null)}>
        <DialogContent className="max-w-md">
            <DialogHeader>
                <DialogTitle>Students in {viewingClass?.name}</DialogTitle>
                <DialogDescription>
                    {MOCK_COURSES.find(c => c.id === viewingClass?.courseId)?.title} - {viewingClass?.level}
                </DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-4">
                {viewingClass && viewingClass.studentIds.length > 0 ? (
                    viewingClass.studentIds.map(id => {
                        const student = allUsers.find(u => u.id === id);
                        return student ? (
                            <div key={student.id} className="flex items-center gap-3">
                                <Avatar>
                                    <AvatarImage src={student.avatarUrl} alt={student.name} />
                                    <AvatarFallback>{student.name.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div>
                                    <p className="font-medium">{student.name}</p>
                                    <p className="text-sm text-muted-foreground">{student.email}</p>
                                </div>
                            </div>
                        ) : null;
                    })
                ) : (
                    <p className="text-sm text-muted-foreground">No students are enrolled in this class yet.</p>
                )}
            </div>
             <DialogFooter>
                <Button variant="outline" onClick={() => setViewingClass(null)}>Close</Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );

    