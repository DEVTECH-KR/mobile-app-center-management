
'use client';

import { EventCard } from "@/components/dashboard/event-card";
import { MOCK_EVENTS, MOCK_USERS } from "@/lib/mock-data";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Edit, Eye, FileUp, Loader2, MoreVertical, PlusCircle, Trash2, X } from "lucide-react";
import { useState } from "react";
import type { Event } from "@/lib/types";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { format, isBefore, startOfToday } from "date-fns";
import { cn } from "@/lib/utils";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import Link from "next/link";
import Image from "next/image";


// In a real app, this would come from an auth context
const userRole = MOCK_USERS.admin.role;

const formSchema = z.object({
  title: z.string().min(3, { message: "Title must be at least 3 characters." }),
  description: z.string().min(10, { message: "Description is required." }),
  details: z.string().optional(),
  date: z.date({ required_error: "A date is required." }),
  isPast: z.boolean().default(false),
  imageUrls: z.array(z.string().url()).min(1, { message: "At least one image is required." }),
  imageHint: z.string().optional(),
});


export default function EventsPage() {
    const [events, setEvents] = useState<Event[]>(MOCK_EVENTS);
    const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
    const [editingEvent, setEditingEvent] = useState<Event | null>(null);
    const [imagePreviews, setImagePreviews] = useState<string[]>([]);
    const { toast } = useToast();

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            isPast: false,
            imageUrls: [],
        }
    });

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(event.target.files || []);
        
        // In a real app, you'd upload files and get back URLs.
        // For this prototype, we'll just use the blob URLs as placeholders.
        const newPreviews = files.map(file => URL.createObjectURL(file));
        const allPreviews = [...imagePreviews, ...newPreviews];
        setImagePreviews(allPreviews);
        form.setValue('imageUrls', allPreviews, { shouldValidate: true });
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
        form.reset({ title: "", description: "", details: "", date: new Date(), isPast: false, imageUrls: [], imageHint: "" });
        setIsFormDialogOpen(true);
    };

    const handleOpenEditDialog = (event: Event) => {
        setEditingEvent(event);
        setImagePreviews(event.imageUrls);
        form.reset({
            ...event,
            date: new Date(event.date),
        });
        setIsFormDialogOpen(true);
    };

    const handleDeleteEvent = (eventId: string) => {
        setEvents(prev => prev.filter(e => e.id !== eventId));
        toast({
            title: "Event Deleted",
            description: "The event has been successfully deleted.",
            variant: "destructive"
        });
    }

    function onSubmit(values: z.infer<typeof formSchema>) {
         form.handleSubmit(() => {
            // Simulate API call
            setTimeout(() => {
                if (editingEvent) {
                    const updatedEvent: Event = {
                        ...editingEvent,
                        ...values,
                        date: format(values.date, 'yyyy-MM-dd'),
                        isPast: values.isPast || isBefore(values.date, startOfToday()),
                    };
                    setEvents(prev => prev.map(e => e.id === editingEvent.id ? updatedEvent : e));
                    toast({
                        title: "Event Updated",
                        description: `The event "${updatedEvent.title}" has been updated.`,
                    });
                } else {
                    const newEvent: Event = {
                        id: `event-${Date.now()}`,
                        ...values,
                        date: format(values.date, 'yyyy-MM-dd'),
                        isPast: values.isPast || isBefore(values.date, startOfToday()),
                    }
                    setEvents(prev => [newEvent, ...prev]);
                    toast({
                        title: "Event Created",
                        description: `The event "${newEvent.title}" has been successfully created.`,
                    });
                }
                setIsFormDialogOpen(false);
                setEditingEvent(null);
                setImagePreviews([]);
                form.reset();
            }, 500);
        })()
    }

    const upcomingEvents = events.filter((event) => !event.isPast);
    const pastEvents = events.filter((event) => event.isPast);


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
        {userRole === 'admin' && (
            <Button onClick={handleOpenCreateDialog}>
                <PlusCircle className="mr-2 h-4 w-4"/>
                Add Event
            </Button>
        )}
      </div>

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
                                            "w-full pl-3 text-left font-normal",
                                            !field.value && "text-muted-foreground"
                                        )}
                                        >
                                        {field.value ? (
                                            format(field.value, "PPP")
                                        ) : (
                                            <span>Pick a date</span>
                                        )}
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
                                            <div key={index} className="relative group aspect-square">
                                                <Image src={src} alt={`Preview ${index + 1}`} fill className="object-cover rounded-md" />
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
                            <FormField control={form.control} name="isPast" render={({ field }) => (
                                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 md:col-span-2">
                                <FormControl>
                                    <Checkbox
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                    />
                                </FormControl>
                                <div className="space-y-1 leading-none">
                                    <FormLabel>
                                    Mark as Past Event
                                    </FormLabel>
                                    <FormMessage />
                                </div>
                                </FormItem>
                            )}/>
                        </div>

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setIsFormDialogOpen(false)}>Cancel</Button>
                            <Button type="submit" disabled={form.formState.isSubmitting}>
                                {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {editingEvent ? 'Save Changes' : 'Create Event'}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>


      <Tabs defaultValue="upcoming" className="w-full">
        <TabsList>
          <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
          <TabsTrigger value="past">Past</TabsTrigger>
        </TabsList>
        <TabsContent value="upcoming">
          <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 mt-6">
            {upcomingEvents.map((event) => (
                <div key={event.id} className="relative group">
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
                                        <Link href={`/dashboard/events/${event.id}`}>
                                            <Eye className="mr-2 h-4 w-4" />
                                            View Details
                                        </Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleOpenEditDialog(event)}>
                                        <Edit className="mr-2 h-4 w-4" />
                                        Edit
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                     <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive">
                                                <Trash2 className="mr-2 h-4 w-4" />
                                                Delete
                                            </DropdownMenuItem>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    This will permanently delete the event "{event.title}".
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                <AlertDialogAction onClick={() => handleDeleteEvent(event.id)}>Delete</AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    )}
                </div>
            ))}
          </div>
        </TabsContent>
        <TabsContent value="past">
           <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 mt-6">
            {pastEvents.map((event) => (
               <div key={event.id} className="relative group">
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
                                        <Link href={`/dashboard/events/${event.id}`}>
                                            <Eye className="mr-2 h-4 w-4" />
                                            View Details
                                        </Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleOpenEditDialog(event)}>
                                        <Edit className="mr-2 h-4 w-4" />
                                        Edit
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                     <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive">
                                                <Trash2 className="mr-2 h-4 w-4" />
                                                Delete
                                            </DropdownMenuItem>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    This will permanently delete the event "{event.title}".
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                <AlertDialogAction onClick={() => handleDeleteEvent(event.id)}>Delete</AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    )}
                </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

    