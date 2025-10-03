'use client';

import { EventCard } from "@/components/dashboard/event-card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Edit, Eye, FileUp, Loader2, MoreVertical, PlusCircle, Trash2, X } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import type { IEvent } from "@/server/api/events/events.schema";
import type { IUser } from "@/server/api/auth/user.schema";
import { eventsApi } from "@/lib/api/events.api";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { format, isBefore, startOfToday } from "date-fns";
import { cn } from "@/lib/utils";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { usersApi } from "@/lib/api/courses.api";
import NextImage from "next/image";
import { debounce } from "lodash"; // Import lodash for debouncing

const formSchema = z.object({
  title: z.string().min(3, { message: "Title must be at least 3 characters." }),
  description: z.string().min(10, { message: "Description is required." }),
  details: z.string().optional(),
  date: z.date({ required_error: "A date is required." }),
  imageUrls: z.array(z.string()).min(1, { message: "At least one image is required." }),
  imageHint: z.string().optional(),
});

export default function EventsPage() {
  const [events, setEvents] = useState<IEvent[]>([]);
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<IEvent | null>(null);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userRole, setUserRole] = useState<'admin' | 'teacher' | 'student'>('student');
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [eventToDelete, setEventToDelete] = useState<IEvent | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>(""); // New state for search query
  const { toast } = useToast();
  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      imageUrls: [],
    },
  });

  // Debounced fetch function to avoid excessive API calls
  const fetchEvents = useCallback(
    debounce(async (query: string) => {
      setIsLoading(true);
      try {
        const user: IUser | null = await usersApi.getCurrentUser();
        if (!user) {
          toast({ title: "Error", description: "Please log in.", variant: "destructive" });
          router.push('/login');
          return;
        }
        setUserRole(user.role);

        const result = await eventsApi.getAll({
          title: query, // Search across title
          description: query, // Search across description
          details: query, // Search across details
        });
        setEvents(result.events || []);
      } catch (error: any) {
        console.error('Events fetch error:', error);
        toast({ title: "Error", description: error.message || "Failed to load events.", variant: "destructive" });
      } finally {
        setIsLoading(false);
      }
    }, 500), // 500ms debounce delay
    [router, toast]
  );

  useEffect(() => {
    fetchEvents(searchQuery);
    return () => {
      fetchEvents.cancel(); // Cancel debounce on unmount
    };
  }, [searchQuery, fetchEvents]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    const currentPreviews = form.getValues('imageUrls') || [];

    const newFilePromises = files.map(file => {
      return new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    });

    Promise.all(newFilePromises).then(newPreviews => {
      const allPreviews = [...currentPreviews, ...newPreviews];
      setImagePreviews(allPreviews);
      form.setValue('imageUrls', allPreviews, { shouldValidate: true });
    });
  };

  const removeImage = (index: number) => {
    const currentPreviews = [...imagePreviews];
    currentPreviews.splice(index, 1);
    setImagePreviews(currentPreviews);
    form.setValue('imageUrls', currentPreviews, { shouldValidate: true });
  };

  const handleOpenCreateDialog = () => {
    setEditingEvent(null);
    setImagePreviews([]);
    form.reset({ title: "", description: "", details: "", date: new Date(), imageUrls: [], imageHint: "" });
    setIsFormDialogOpen(true);
  };

  const handleOpenEditDialog = (event: IEvent) => {
    setEditingEvent(event);
    setImagePreviews(event.imageUrls);
    form.reset({
      ...event,
      date: new Date(event.date),
    });
    setIsFormDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!eventToDelete) return;
    try {
      await eventsApi.delete(eventToDelete._id);
      const result = await eventsApi.getAll({
        title: searchQuery,
        description: searchQuery,
        details: searchQuery,
      });
      setEvents(result.events || []);
      toast({ title: "Success", description: `Event "${eventToDelete.title}" deleted!` });
    } catch (error: any) {
      console.error('Delete event error:', error);
      toast({ title: "Error", description: error.message || "Failed to delete event.", variant: "destructive" });
    } finally {
      setIsDeleteDialogOpen(false);
      setEventToDelete(null);
    }
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      const payload: Partial<IEvent> = {
        ...values,
        date: values.date,
      };
      if (editingEvent) {
        await eventsApi.update(editingEvent._id, payload);
      } else {
        await eventsApi.create(payload);
      }
      const result = await eventsApi.getAll({
        title: searchQuery,
        description: searchQuery,
        details: searchQuery,
      });
      setEvents(result.events || []);
      setIsFormDialogOpen(false);
      toast({ title: "Success", description: editingEvent ? "Event updated!" : "Event created!" });
    } catch (error: any) {
      console.error('Save event error:', error);
      toast({ title: "Error", description: error.message || "Failed to save event.", variant: "destructive" });
    }
  };

  if (isLoading) {
    return <div className="flex items-center justify-center py-10"><Loader2 className="animate-spin h-8 w-8" /></div>;
  }

  const upcomingEvents = events.filter(e => !e.isPast);
  const pastEvents = events.filter(e => e.isPast);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-3xl font-bold font-headline tracking-tight">
            Center Events
          </h2>
          <p className="text-muted-foreground">
            Stay updated with our latest events and activities.
          </p>
        </div>
        <div className="flex gap-4">
          <Input
            placeholder="Search events by title, description, or details..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full md:w-64"
          />
          {userRole === 'admin' && (
            <Button onClick={handleOpenCreateDialog}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Event
            </Button>
          )}
        </div>
      </div>

      <Tabs defaultValue="upcoming" className="w-full">
        <TabsList>
          <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
          <TabsTrigger value="past">Past</TabsTrigger>
        </TabsList>
        <TabsContent value="upcoming">
          {upcomingEvents.length === 0 ? (
            <p className="text-center text-muted-foreground">No upcoming events available.</p>
          ) : (
            <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 mt-6">
              {upcomingEvents.map((event) => (
                <div key={event._id} className="relative group">
                  <EventCard event={event} userRole={userRole} />
                  {userRole === 'admin' && (
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="secondary" size="icon" className="h-8 w-8 rounded-full bg-background/70 hover:bg-background">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/dashboard/events/${event._id}`}>
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleOpenEditDialog(event)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => {
                              setEventToDelete(event);
                              setIsDeleteDialogOpen(true);
                            }}
                            className="text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </TabsContent>
        <TabsContent value="past">
          {pastEvents.length === 0 ? (
            <p className="text-center text-muted-foreground">No past events available.</p>
          ) : (
            <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 mt-6">
              {pastEvents.map((event) => (
                <div key={event._id} className="relative group">
                  <EventCard event={event} userRole={userRole} />
                  {userRole === 'admin' && (
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="secondary" size="icon" className="h-8 w-8 rounded-full bg-background/70 hover:bg-background">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/dashboard/events/${event._id}`}>
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleOpenEditDialog(event)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => {
                              setEventToDelete(event);
                              setIsDeleteDialogOpen(true);
                            }}
                            className="text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={isFormDialogOpen} onOpenChange={setIsFormDialogOpen}>
        <DialogContent className="sm:max-w-2xl">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <DialogHeader>
                <DialogTitle>{editingEvent ? 'Edit Event' : 'Create a new event'}</DialogTitle>
                <DialogDescription>
                  {editingEvent ? 'Update the details for this event.' : 'Fill in the details below to create a new event.'}
                </DialogDescription>
              </DialogHeader>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4 max-h-[70vh] overflow-y-auto pr-4">
                <FormField control={form.control} name="title" render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Title</FormLabel>
                    <FormControl><Input placeholder="e.g. Tech Conference 2024" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}/>
                <FormField control={form.control} name="description" render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Short Description</FormLabel>
                    <FormControl><Textarea placeholder="A brief summary of the event..." {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}/>
                <FormField control={form.control} name="details" render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Full Details (Optional)</FormLabel>
                    <FormControl><Textarea placeholder="Provide more details about the event..." {...field} rows={5} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}/>
                <FormField control={form.control} name="date" render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Event Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full justify-between text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}/>
                <div className="md:col-span-2 space-y-4">
                  <FormItem>
                    <FormLabel>Event Images</FormLabel>
                    <div className="relative">
                      <Button type="button" variant="outline" asChild className="cursor-pointer w-full">
                        <div>
                          <FileUp className="mr-2 h-4 w-4" />
                          Upload Images
                        </div>
                      </Button>
                      <Input type="file" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" multiple onChange={handleFileChange} accept="image/*"/>
                    </div>
                    <FormMessage {...form.getFieldState("imageUrls")}/>
                  </FormItem>
                  {imagePreviews.length > 0 && (
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                      {imagePreviews.map((src, index) => (
                        <div key={`preview-${index}`} className="relative group aspect-square">
                          <NextImage src={src} alt={`Preview ${index + 1}`} fill className="object-cover rounded-md" />
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => removeImage(index)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <FormField control={form.control} name="imageHint" render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Image Hint</FormLabel>
                    <FormControl><Input placeholder="e.g. 'conference presentation'" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}/>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {editingEvent ? 'Save Changes' : 'Create Event'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the event "{eventToDelete?.title}".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}