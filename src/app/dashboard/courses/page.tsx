

'use client';

import { useState } from "react";
import { CourseCard } from "@/components/dashboard/course-card";
import { MOCK_COURSES, MOCK_USERS } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";
import { Edit, FileUp, Loader2, MoreVertical, PlusCircle, Trash2, X, Clock, User, Users, Star } from "lucide-react";
import type { Course, User as UserType, UserRole } from "@/lib/types";
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
import Image from "next/image";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CheckIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";

// In a real app, this would come from an auth context
const currentUser = MOCK_USERS.admin;
const allTeachers = Object.values(MOCK_USERS).filter(u => u.role === 'teacher');

const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const courseLevels = ["Beginner", "Intermediate", "Advanced", "All levels"];

const formSchema = z.object({
  title: z.string().min(3, { message: "Title must be at least 3 characters." }),
  description: z.string().min(10, { message: "Description is required." }),
  price: z.coerce.number().min(0, { message: "Price must be a positive number." }),
  days: z.array(z.string()).min(1, "At least one day must be selected."),
  startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format (HH:MM)."),
  endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format (HH:MM)."),
  imageUrl: z.string().min(1, { message: "An image is required." }),
  imageHint: z.string().optional(),
  teacherIds: z.array(z.string()).optional(),
  otherInstructorName: z.string().optional(),
  levels: z.array(z.string()).min(1, "At least one level must be selected."),
});


export default function CoursesPage() {
    const [courses, setCourses] = useState<Course[]>(MOCK_COURSES);
    const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
    const [editingCourse, setEditingCourse] = useState<Course | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [showOtherInstructorField, setShowOtherInstructorField] = useState(false);
    const { toast } = useToast();

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            teacherIds: [],
            levels: [],
        }
    });

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const result = reader.result as string;
                setImagePreview(result);
                form.setValue('imageUrl', result, { shouldValidate: true });
            };
            reader.readAsDataURL(file);
        }
    };

    const removeImage = () => {
        setImagePreview(null);
        form.setValue('imageUrl', '', { shouldValidate: true });
    };

    const handleOpenCreateDialog = () => {
        setEditingCourse(null);
        setImagePreview(null);
        setShowOtherInstructorField(false);
        form.reset({ title: "", description: "", price: 0, days: [], startTime: "", endTime: "", imageUrl: "", imageHint: "", teacherIds: [], otherInstructorName: "", levels: [] });
        setIsFormDialogOpen(true);
    };

    const handleOpenEditDialog = (course: Course) => {
        setEditingCourse(course);
        setImagePreview(course.imageUrl);
        // A bit of a simplification: if there are teacher IDs not in the known list, we assume it was an 'other'
        const knownTeacherIds = allTeachers.map(t => t.id);
        const hasOther = course.teacherIds.some(id => !knownTeacherIds.includes(id));
        setShowOtherInstructorField(hasOther);
        
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
        // Simulate API call
        setTimeout(() => {
            if (editingCourse) {
                const updatedCourse = { ...editingCourse, ...values };
                    if (values.otherInstructorName) {
                    // In a real app, you'd create a new teacher user here and get an ID
                    const newTeacherId = `user-other-${Date.now()}`;
                    updatedCourse.teacherIds = [...(updatedCourse.teacherIds || []), newTeacherId];
                }
                setCourses(prev => prev.map(c => c.id === editingCourse.id ? updatedCourse : c));
                toast({
                    title: "Course Updated",
                    description: `The course "${updatedCourse.title}" has been updated.`,
                });
            } else {
                const newCourse: Course = {
                    id: `course-${Date.now()}`,
                    ...values,
                    teacherIds: values.teacherIds || [],
                }
                if (values.otherInstructorName) {
                    // In a real app, you'd create a new teacher user here and get an ID
                    const newTeacherId = `user-other-${Date.now()}`;
                    newCourse.teacherIds.push(newTeacherId);
                    // You might also want to add this new teacher to a global state/mock data list
                }
                setCourses(prev => [newCourse, ...prev]);
                toast({
                    title: "Course Created",
                    description: `The course "${newCourse.title}" has been successfully created.`,
                });
            }
            setIsFormDialogOpen(false);
            setEditingCourse(null);
            setImagePreview(null);
            setShowOtherInstructorField(false);
            form.reset();
        }, 500);
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
                    <CourseCard key={course.id} course={course} userRole={currentUser.role as UserRole}/>
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
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 py-4 max-h-[70vh] overflow-y-auto pr-4">
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
                             <FormField
                                control={form.control}
                                name="days"
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>Days</FormLabel>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                        <FormControl>
                                            <Button
                                            variant="outline"
                                            role="combobox"
                                            className={cn(
                                                "w-full justify-between",
                                                !field.value?.length && "text-muted-foreground"
                                            )}
                                            >
                                            {field.value?.length > 0
                                                ? field.value.join(", ")
                                                : "Select days"}
                                            <Clock className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                            </Button>
                                        </FormControl>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-[200px] p-0">
                                            <div className="p-2 space-y-1">
                                            {weekDays.map((day) => (
                                                <div key={day} className="flex items-center gap-2">
                                                    <Checkbox
                                                        id={`day-${day}`}
                                                        checked={field.value?.includes(day)}
                                                        onCheckedChange={(checked) => {
                                                            const currentDays = field.value || [];
                                                            if (checked) {
                                                                field.onChange([...currentDays, day]);
                                                            } else {
                                                                field.onChange(currentDays.filter((d) => d !== day));
                                                            }
                                                        }}
                                                    />
                                                    <label htmlFor={`day-${day}`} className="text-sm font-medium">{day}</label>
                                                </div>
                                            ))}
                                            </div>
                                        </PopoverContent>
                                    </Popover>
                                    <FormMessage />
                                    </FormItem>
                                )}
                                />
                             <FormField control={form.control} name="startTime" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Start Time</FormLabel>
                                    <FormControl><Input type="time" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}/>
                             <FormField control={form.control} name="endTime" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>End Time</FormLabel>
                                    <FormControl><Input type="time" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}/>
                            <FormField
                                control={form.control}
                                name="levels"
                                render={() => (
                                    <FormItem className="md:col-span-2">
                                    <FormLabel>Levels</FormLabel>
                                    <div className="grid grid-cols-2 gap-2">
                                    {courseLevels.map((level) => (
                                        <FormField
                                        key={level}
                                        control={form.control}
                                        name="levels"
                                        render={({ field }) => {
                                            return (
                                            <FormItem
                                                key={level}
                                                className="flex flex-row items-start space-x-3 space-y-0"
                                            >
                                                <FormControl>
                                                <Checkbox
                                                    checked={field.value?.includes(level)}
                                                    onCheckedChange={(checked) => {
                                                    return checked
                                                        ? field.onChange([...field.value, level])
                                                        : field.onChange(
                                                            field.value?.filter(
                                                            (value) => value !== level
                                                            )
                                                        )
                                                    }}
                                                />
                                                </FormControl>
                                                <FormLabel className="font-normal">
                                                {level}
                                                </FormLabel>
                                            </FormItem>
                                            )
                                        }}
                                        />
                                    ))}
                                    </div>
                                    <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="teacherIds"
                                render={({ field }) => (
                                    <FormItem className="md:col-span-2">
                                    <FormLabel>Instructors</FormLabel>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                        <FormControl>
                                            <Button
                                                variant="outline"
                                                role="combobox"
                                                className="w-full justify-between"
                                            >
                                                <span className="truncate">
                                                {field.value?.length > 0
                                                    ? `${field.value.length} selected`
                                                    : "Select instructors"}
                                                </span>
                                                <Users className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                            </Button>
                                        </FormControl>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                                            <Command>
                                                <CommandInput placeholder="Search instructors..." />
                                                <CommandEmpty>No instructor found.</CommandEmpty>
                                                <CommandGroup>
                                                    <CommandList>
                                                        {allTeachers.map((teacher) => (
                                                            <CommandItem
                                                            value={teacher.name}
                                                            key={teacher.id}
                                                            onSelect={() => {
                                                                const currentIds = field.value || [];
                                                                const isSelected = currentIds.includes(teacher.id);
                                                                if (isSelected) {
                                                                    field.onChange(currentIds.filter((id) => id !== teacher.id));
                                                                } else {
                                                                    field.onChange([...currentIds, teacher.id]);
                                                                }
                                                            }}
                                                            >
                                                            <CheckIcon
                                                                className={cn(
                                                                "mr-2 h-4 w-4",
                                                                field.value?.includes(teacher.id) ? "opacity-100" : "opacity-0"
                                                                )}
                                                            />
                                                            <Avatar className="h-6 w-6 mr-2">
                                                                <AvatarImage src={teacher.avatarUrl} alt={teacher.name} />
                                                                <AvatarFallback>{teacher.name.charAt(0)}</AvatarFallback>
                                                            </Avatar>
                                                            {teacher.name}
                                                            </CommandItem>
                                                        ))}
                                                        <CommandItem
                                                            onSelect={() => {
                                                                setShowOtherInstructorField(!showOtherInstructorField)
                                                            }}
                                                            >
                                                             <CheckIcon
                                                                className={cn(
                                                                "mr-2 h-4 w-4",
                                                                showOtherInstructorField ? "opacity-100" : "opacity-0"
                                                                )}
                                                            />
                                                            Other
                                                        </CommandItem>
                                                    </CommandList>
                                                </CommandGroup>
                                            </Command>
                                        </PopoverContent>
                                    </Popover>
                                    <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {showOtherInstructorField && (
                                <FormField control={form.control} name="otherInstructorName" render={({ field }) => (
                                    <FormItem className="md:col-span-2">
                                        <FormLabel>Other Instructor Name</FormLabel>
                                        <FormControl><Input placeholder="Enter instructor's name" {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}/>
                            )}

                            <div className="md:col-span-2 space-y-2">
                                <FormLabel>Course Image</FormLabel>
                                 <FormMessage {...form.getFieldState("imageUrl")}/>
                                {imagePreview ? (
                                    <div className="relative group aspect-video">
                                        <Image src={imagePreview} alt="Image preview" fill className="object-cover rounded-md" />
                                        <Button
                                            type="button"
                                            variant="destructive"
                                            size="icon"
                                            className="absolute top-2 right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                            onClick={removeImage}
                                        >
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ) : (
                                     <div className="relative">
                                        <Button type="button" variant="outline" asChild className="cursor-pointer w-full">
                                            <div>
                                                <FileUp className="mr-2 h-4 w-4" />
                                                Upload Image
                                            </div>
                                        </Button>
                                        <Input id="file-upload" type="file" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" onChange={handleFileChange} accept="image/*"/>
                                    </div>
                                )}
                                <FormField control={form.control} name="imageUrl" render={({ field }) => (
                                    <FormItem className="hidden">
                                        <FormControl><Input {...field} /></FormControl>
                                    </FormItem>
                                )}/>
                            </div>
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
                    <CourseCard course={course} userRole={currentUser.role as UserRole} />
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
