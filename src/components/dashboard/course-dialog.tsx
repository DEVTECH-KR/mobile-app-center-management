// src/components/dashboard/course-dialog.tsx
import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { usersApi } from "@/lib/api/courses.api";
import { CheckIcon, Clock, FileUp, Image as ImageIcon, Loader2, Users, X } from "lucide-react";
import { Command, CommandInput, CommandEmpty, CommandGroup, CommandList, CommandItem } from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { ICourse } from "@/server/api/courses/course.schema";
import type { IUser } from "@/server/api/auth/user.schema";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";

const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const courseLevels = ["Beginner", "Intermediate", "Advanced", "All levels"];

const formSchema = z.object({
  title: z.string().min(3),
  description: z.string().min(10),
  price: z.coerce.number().min(0),
  days: z.array(z.string()).min(1),
  startTime: z.string(),
  endTime: z.string(),
  imageUrl: z.string().min(1),
  imageHint: z.string().optional(),
  teacherIds: z.array(z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid teacher ID")).optional(),
  levels: z.array(z.string()).min(1),
});

interface CourseDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  editingCourse?: ICourse | null;
  onSave: (data: z.infer<typeof formSchema>) => void;
}

export const CourseDialog: React.FC<CourseDialogProps> = ({
  isOpen,
  onOpenChange,
  editingCourse,
  onSave,
}) => {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [teachers, setTeachers] = useState<IUser[]>([]);
  const [isLoadingTeachers, setIsLoadingTeachers] = useState(false);
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { 
      teacherIds: [], 
      levels: [], 
      days: [],
      title: "",
      description: "",
      price: 0,
      startTime: "",
      endTime: "",
      imageUrl: "",
      imageHint: "",
    },
  });

  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      async function fetchTeachers() {
        setIsLoadingTeachers(true);
        try {
          const teacherList = await usersApi.getByRole("teacher");
          console.log('Fetched teachers:', teacherList);
          
          // S'assurer que teacherList est toujours un tableau
          const safeTeachers = Array.isArray(teacherList) ? teacherList : [];
          setTeachers(safeTeachers);
        } catch (error: any) {
          console.error('CourseDialog fetch teachers error:', error);
          setTeachers([]); // Toujours définir comme tableau vide
          toast({ 
            title: "Error", 
            description: "Failed to load instructors.", 
            variant: "destructive" 
          });
        } finally {
          setIsLoadingTeachers(false);
        }
      }
      fetchTeachers();
    }
  }, [isOpen, toast]);

  useEffect(() => {
    if (editingCourse && isOpen) {
      console.log('Setting form values for editing course:', editingCourse);
      
      // Préparer les données pour le formulaire
      const formData = {
        ...editingCourse,
        teacherIds: Array.isArray(editingCourse.teacherIds) 
          ? editingCourse.teacherIds.map(t => {
              // Gérer différents formats d'ID d'enseignant
              if (typeof t === 'string') return t;
              if (t && typeof t === 'object') return String(t._id || t.id || t);
              return String(t);
            }).filter(Boolean)
          : [],
        levels: Array.isArray(editingCourse.levels) ? editingCourse.levels : [],
        days: Array.isArray(editingCourse.days) ? editingCourse.days : [],
        price: typeof editingCourse.price === 'number' ? editingCourse.price : 0,
      };
      
      form.reset(formData);
      setImagePreview(editingCourse.imageUrl || null);
    } else if (!editingCourse && isOpen) {
      // Reset pour une nouvelle création
      form.reset({ 
        title: "", 
        description: "", 
        price: 0, 
        days: [], 
        startTime: "", 
        endTime: "", 
        imageUrl: "", 
        imageHint: "", 
        teacherIds: [], 
        levels: [] 
      });
      setImagePreview(null);
    }
  }, [editingCourse, form, isOpen]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setImagePreview(result);
        form.setValue("imageUrl", result, { shouldValidate: true });
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImagePreview(null);
    form.setValue("imageUrl", "", { shouldValidate: true });
  };

  const handleSubmit = async (data: z.infer<typeof formSchema>) => {
    try {
      await onSave(data);
      // Reset form and image preview after successful submission
      form.reset({ 
        title: "", 
        description: "", 
        price: 0, 
        days: [], 
        startTime: "", 
        endTime: "", 
        imageUrl: "", 
        imageHint: "", 
        teacherIds: [], 
        levels: [] 
      });
      setImagePreview(null);
      onOpenChange(false); // Close dialog
    } catch (error: any) {
      console.error('CourseDialog submit error:', error);
      toast({ 
        title: "Error", 
        description: error.message || "Failed to save course.", 
        variant: "destructive" 
      });
    }
  };

  // Fonction utilitaire pour obtenir l'ID d'un enseignant de manière sécurisée
  const getTeacherId = (teacher: IUser): string => {
    return String(teacher._id || teacher.id || '');
  };

  // Fonction utilitaire pour obtenir le nom d'un enseignant de manière sécurisée
  const getTeacherName = (teacher: IUser): string => {
    return teacher.name || teacher.email || 'Unknown Teacher';
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
            <DialogHeader>
              <DialogTitle>{editingCourse ? "Edit Course" : "Create a new course"}</DialogTitle>
              <DialogDescription>
                {editingCourse ? "Update the details for this course." : "Fill in the details below to create a new course."}
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
                            {Array.isArray(field.value) && field.value.length > 0
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
                                checked={Array.isArray(field.value) && field.value.includes(day)}
                                onCheckedChange={(checked) => {
                                  const currentDays = Array.isArray(field.value) ? field.value : [];
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
                          render={({ field }) => (
                            <FormItem
                              key={level}
                              className="flex flex-row items-start space-x-3 space-y-0"
                            >
                              <FormControl>
                                <Checkbox
                                  checked={Array.isArray(field.value) && field.value.includes(level)}
                                  onCheckedChange={(checked) => {
                                    const currentLevels = Array.isArray(field.value) ? field.value : [];
                                    return checked
                                      ? field.onChange([...currentLevels, level])
                                      : field.onChange(currentLevels.filter((value) => value !== level));
                                  }}
                                />
                              </FormControl>
                              <FormLabel className="font-normal">{level}</FormLabel>
                            </FormItem>
                          )}
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
                            disabled={isLoadingTeachers}
                          >
                            <span className="truncate">
                              {isLoadingTeachers ? (
                                "Loading instructors..."
                              ) : Array.isArray(field.value) && field.value.length > 0 ? (
                                field.value
                                  .map(id => {
                                    const teacher = teachers.find(t => getTeacherId(t) === id);
                                    return teacher ? getTeacherName(teacher) : id;
                                  })
                                  .join(", ")
                              ) : (
                                "Select instructors"
                              )}
                            </span>
                            {isLoadingTeachers ? (
                              <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                            ) : (
                              <Users className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            )}
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                        <Command>
                          <CommandInput placeholder="Search instructors..." />
                          <CommandEmpty>
                            {isLoadingTeachers ? "Loading..." : "No instructor found."}
                          </CommandEmpty>
                          <CommandGroup>
                            <CommandList>
                              {isLoadingTeachers ? (
                                <div className="p-2 text-center">
                                  <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                                  <p className="text-sm text-muted-foreground mt-1">Loading instructors...</p>
                                </div>
                              ) : !Array.isArray(teachers) || teachers.length === 0 ? (
                                <div className="p-2 text-muted-foreground">No instructors available</div>
                              ) : (
                                teachers.map((teacher) => {
                                  const teacherId = getTeacherId(teacher);
                                  const isSelected = Array.isArray(field.value) && field.value.includes(teacherId);
                                  
                                  return (
                                    <CommandItem
                                      value={getTeacherName(teacher)}
                                      key={teacherId}
                                      onSelect={() => {
                                        const currentIds = Array.isArray(field.value) ? field.value : [];
                                        if (isSelected) {
                                          field.onChange(currentIds.filter((id) => id !== teacherId));
                                        } else {
                                          field.onChange([...currentIds, teacherId]);
                                        }
                                      }}
                                    >
                                      <CheckIcon
                                        className={cn(
                                          "mr-2 h-4 w-4",
                                          isSelected ? "opacity-100" : "opacity-0"
                                        )}
                                      />
                                      <Avatar className="h-6 w-6 mr-2">
                                        <AvatarImage src={teacher.avatarUrl || ''} alt={getTeacherName(teacher)} />
                                        <AvatarFallback>
                                          {getTeacherName(teacher).charAt(0).toUpperCase()}
                                        </AvatarFallback>
                                      </Avatar>
                                      {getTeacherName(teacher)}
                                    </CommandItem>
                                  );
                                })
                              )}
                            </CommandList>
                          </CommandGroup>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="md:col-span-2 space-y-2">
                <FormLabel>Course Image</FormLabel>
                <FormMessage {...form.getFieldState("imageUrl")} />
                {imagePreview ? (
                  <div className="relative group aspect-video">
                    <img src={imagePreview} alt="Image preview" className="object-cover rounded-md w-full h-full" />
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
                    <Input
                      id="file-upload"
                      type="file"
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      onChange={handleFileChange}
                      accept="image/*"
                    />
                  </div>
                )}
                <FormField
                  control={form.control}
                  name="imageUrl"
                  render={({ field }) => (
                    <FormItem className="hidden">
                      <FormControl><Input {...field} /></FormControl>
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="imageHint"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Image Hint</FormLabel>
                    <FormControl><Input placeholder="e.g. 'code screen'" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter>
              <Button 
                type="submit" 
                disabled={form.formState.isSubmitting || !form.formState.isDirty}
              >
                {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editingCourse ? "Update Course" : "Create Course"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};