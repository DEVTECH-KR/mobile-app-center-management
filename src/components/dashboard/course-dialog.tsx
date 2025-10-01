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
import { CheckIcon } from "lucide-react";
import { Command, CommandInput, CommandEmpty, CommandGroup, CommandList, CommandItem } from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Course, User } from "@/lib/types";

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
  teacherIds: z.array(z.string()).optional(),
  levels: z.array(z.string()).min(1),
});

interface CourseDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  editingCourse?: Course | null;
  onSave: (data: z.infer<typeof formSchema>) => void;
}

export const CourseDialog: React.FC<CourseDialogProps> = ({
  isOpen,
  onOpenChange,
  editingCourse,
  onSave,
}) => {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [teachers, setTeachers] = useState<User[]>([]);
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { teacherIds: [], levels: [] },
  });

  useEffect(() => {
    usersApi.getByRole("teacher").then(setTeachers);
  }, []);

  useEffect(() => {
    if (editingCourse) {
      form.reset({
        ...editingCourse,
        teacherIds: editingCourse.teacherIds || [],
        levels: editingCourse.levels || [],
        days: editingCourse.days || [],
      });
      setImagePreview(editingCourse.imageUrl || null);
    } else {
      form.reset({ title: "", description: "", price: 0, days: [], startTime: "", endTime: "", imageUrl: "", imageHint: "", teacherIds: [], levels: [] });
      setImagePreview(null);
    }
  }, [editingCourse]);

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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField control={form.control} name="title" render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="price" render={({ field }) => (
                <FormItem>
                  <FormLabel>Price (FBU)</FormLabel>
                  <FormControl><Input type="number" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            <FormField control={form.control} name="description" render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl><Textarea {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            {/* Image upload */}
            <div className="flex flex-col space-y-2">
              <FormLabel>Course Image</FormLabel>
              {imagePreview ? (
                <div className="relative">
                  <img src={imagePreview} className="w-full h-48 object-cover rounded-md" />
                  <Button type="button" onClick={removeImage} className="absolute top-2 right-2">Remove</Button>
                </div>
              ) : (
                <Input type="file" accept="image/*" onChange={handleFileChange} />
              )}
            </div>

            {/* Days selection */}
            <FormField control={form.control} name="days" render={({ field }) => (
              <FormItem>
                <FormLabel>Days</FormLabel>
                <div className="flex flex-wrap gap-2">
                  {weekDays.map(day => (
                    <label key={day} className="flex items-center space-x-2">
                      <input type="checkbox" value={day} checked={field.value.includes(day)} onChange={(e) => {
                        if (e.target.checked) field.onChange([...field.value, day]);
                        else field.onChange(field.value.filter(d => d !== day));
                      }} />
                      <span>{day}</span>
                    </label>
                  ))}
                </div>
              </FormItem>
            )} />

            {/* Start / End time */}
            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="startTime" render={({ field }) => (
                <FormItem>
                  <FormLabel>Start Time</FormLabel>
                  <FormControl><Input type="time" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="endTime" render={({ field }) => (
                <FormItem>
                  <FormLabel>End Time</FormLabel>
                  <FormControl><Input type="time" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            <DialogFooter>
              <Button type="submit">{editingCourse ? "Update Course" : "Create Course"}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
