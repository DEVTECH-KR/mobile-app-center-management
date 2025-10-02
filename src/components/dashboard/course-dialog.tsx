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
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { teacherIds: [], levels: [], days: [] },
  });

  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      async function fetchTeachers() {
        try {
          const teacherList = await usersApi.getByRole("teacher");
          console.log('CourseDialog fetched teachers:', teacherList.map(t => ({ _id: t._id, name: t.name, avatarUrl: t.avatarUrl }))); // Debug avatarUrl
          setTeachers(teacherList);
        } catch (error: any) {
          console.error('CourseDialog fetch teachers error:', error);
          setTeachers([]);
          toast({ title: "Error", description: "Failed to load instructors.", variant: "destructive" });
        }
      }
      fetchTeachers();
    }
  }, [isOpen, toast]);

  useEffect(() => {
    if (editingCourse) {
      form.reset({
        ...editingCourse,
        teacherIds: editingCourse.teacherIds?.map(t => String(t._id || t)) || [],
        levels: editingCourse.levels || [],
        days: editingCourse.days || [],
      });
      setImagePreview(editingCourse.imageUrl || null);
    } else {
      form.reset({ title: "", description: "", price: 0, days: [], startTime: "", endTime: "", imageUrl: "", imageHint: "", teacherIds: [], levels: [] });
      setImagePreview(null);
    }
  }, [editingCourse, form]);

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

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSave)} className="space-y-8">
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
                          render={({ field }) => (
                            <FormItem
                              key={level}
                              className="flex flex-row items-start space-x-3 space-y-0"
                            >
                              <FormControl>
                                <Checkbox
                                  checked={field.value?.includes(level)}
                                  onCheckedChange={(checked) => {
                                    return checked
                                      ? field.onChange([...(field.value || []), level])
                                      : field.onChange(
                                          (field.value || [])?.filter(
                                            (value) => value !== level
                                          )
                                        );
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
                          >
                            <span className="truncate">
                              {field.value?.length > 0
                                ? field.value
                                    .map(id => teachers.find(t => t._id.toString() === id)?.name || id)
                                    .join(", ")
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
                              {teachers.length === 0 ? (
                                <div className="p-2 text-muted-foreground">No instructors available</div>
                              ) : (
                                teachers.map((teacher) => (
                                  <CommandItem
                                    value={teacher.name || teacher.email}
                                    key={teacher._id}
                                    onSelect={() => {
                                      const currentIds = field.value || [];
                                      if (currentIds.includes(String(teacher._id))) {
                                        field.onChange(currentIds.filter((id) => id !== String(teacher._id)));
                                      } else {
                                        field.onChange([...currentIds, String(teacher._id)]);
                                      }
                                    }}
                                  >
                                    <CheckIcon
                                      className={cn(
                                        "mr-2 h-4 w-4",
                                        field.value?.includes(String(teacher._id)) ? "opacity-100" : "opacity-0"
                                      )}
                                    />
                                    <Avatar className="h-6 w-6 mr-2">
                                      <AvatarImage src={teacher.avatarUrl || ''} alt={teacher.name || teacher.email} />
                                      <AvatarFallback>{(teacher.name || teacher.email).charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    {teacher.name || teacher.email}
                                  </CommandItem>
                                ))
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
              <Button type="submit" disabled={form.formState.isSubmitting || !form.formState.isDirty}>
                {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};