
'use client';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { MOCK_COURSES, MOCK_DOCUMENTS, MOCK_USERS } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";
import { Download, FileText, Loader2, PlusCircle, User } from "lucide-react";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useState } from "react";
import type { Document } from "@/lib/types";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/context/auth-context";


const allUsers = Object.values(MOCK_USERS);

const formSchema = z.object({
  title: z.string().min(3, { message: "Title is required." }),
  courseId: z.string({ required_error: "Please select a course." }),
  type: z.enum(["Syllabus", "Material", "Assignment", "Evaluation"], { required_error: "Please select a type." }),
  fileUrl: z.string().min(1, { message: "File URL is required (can be a placeholder)." }),
});


export default function DocumentsPage() {
    const { userProfile, loading } = useAuth();
    const [documents, setDocuments] = useState<Document[]>(MOCK_DOCUMENTS);
    const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
    const { toast } = useToast();

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
    });

    if (loading || !userProfile) {
        return (
            <div className="flex items-center justify-center h-full">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }
    
    const managedCourses = userProfile.role === 'teacher' ? MOCK_COURSES.filter(course => course.teacherIds?.includes(userProfile.id)) : [];
    const enrolledCourses = userProfile.role === 'student' ? MOCK_COURSES.filter(course => userProfile.enrolledCourseIds?.includes(course.id)) : [];

    const documentsByCourse = (userProfile.role === 'student' ? enrolledCourses : managedCourses).map(course => ({
        ...course,
        documents: documents.filter(doc => doc.courseId === course.id)
    }));
    
    function onSubmit(values: z.infer<typeof formSchema>) {
        if (!userProfile) return;
        form.handleSubmit(() => {
            // Simulate API call
            setTimeout(() => {
                const newDocument: Document = {
                    id: `doc-${Date.now()}`,
                    ...values,
                    type: values.type as "Syllabus" | "Material" | "Assignment" | "Evaluation",
                    uploadedAt: new Date().toISOString(),
                    uploaderId: userProfile.id
                }
                setDocuments(prev => [newDocument, ...prev]);
                toast({
                    title: "Document Uploaded",
                    description: `The document "${newDocument.title}" has been successfully uploaded.`,
                });

                setIsFormDialogOpen(false);
                form.reset();
            }, 500);
        })()
    }


  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
         <div>
            <h2 className="text-3xl font-bold font-headline tracking-tight">
            Course Documents
            </h2>
            <p className="text-muted-foreground">
                {userProfile.role === 'student' ? 'Access your syllabus, materials, and assignments here.' : 'Manage and upload documents for your courses.'}
            </p>
        </div>
         {userProfile.role === 'teacher' && (
            <Button onClick={() => setIsFormDialogOpen(true)}>
                <PlusCircle className="mr-2 h-4 w-4"/>
                Upload Document
            </Button>
        )}
      </div>

       <Dialog open={isFormDialogOpen} onOpenChange={setIsFormDialogOpen}>
            <DialogContent className="sm:max-w-[425px]">
                 <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                        <DialogHeader>
                            <DialogTitle>Upload a new document</DialogTitle>
                            <DialogDescription>
                                Fill in the details below to add a new document for your students.
                            </DialogDescription>
                        </DialogHeader>
                        
                        <div className="grid gap-4 py-4">
                             <FormField control={form.control} name="courseId" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Course</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <FormControl>
                                            <SelectTrigger><SelectValue placeholder="Select a course" /></SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {managedCourses.map(course => <SelectItem key={course.id} value={course.id}>{course.title}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}/>
                            <FormField control={form.control} name="title" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Document Title</FormLabel>
                                    <FormControl><Input placeholder="e.g. Course Syllabus" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}/>
                            <FormField control={form.control} name="type" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Type</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <FormControl>
                                            <SelectTrigger><SelectValue placeholder="Select document type" /></SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="Syllabus">Syllabus</SelectItem>
                                            <SelectItem value="Material">Material</SelectItem>
                                            <SelectItem value="Assignment">Assignment</SelectItem>
                                            <SelectItem value="Evaluation">Evaluation</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}/>
                             <FormField control={form.control} name="fileUrl" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>File URL</FormLabel>
                                    <FormControl><Input placeholder="Enter link to the file..." {...field} defaultValue="#" /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}/>
                        </div>

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setIsFormDialogOpen(false)}>Cancel</Button>
                            <Button type="submit" disabled={form.formState.isSubmitting}>
                                {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Upload Document
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>


      <div className="space-y-8">
        {documentsByCourse.map(course => (
            <Card key={course.id}>
                <CardHeader>
                    <CardTitle className="font-headline text-2xl flex items-center gap-2">
                        <FileText className="text-primary"/>
                        {course.title}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {course.documents.length > 0 ? (
                        <div className="rounded-lg border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                <TableHead>Title</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>Uploaded By</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead className="text-right">Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {course.documents.map(doc => {
                                    const uploader = allUsers.find(u => u.id === doc.uploaderId);
                                    return (
                                        <TableRow key={doc.id}>
                                            <TableCell className="font-medium">{doc.title}</TableCell>
                                            <TableCell>{doc.type}</TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <User className="h-4 w-4 text-muted-foreground"/>
                                                    <span>{uploader?.name || 'Unknown'}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>{format(new Date(doc.uploadedAt as string), 'MMM d, yyyy')}</TableCell>
                                            <TableCell className="text-right">
                                                <Button variant="ghost" size="icon" asChild>
                                                    <a href={doc.fileUrl} download>
                                                        <Download className="h-4 w-4"/>
                                                    </a>
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    )
                                })}
                            </TableBody>
                        </Table>
                        </div>
                    ) : (
                        <p className="text-muted-foreground text-sm">No documents have been uploaded for this course yet.</p>
                    )}
                </CardContent>
            </Card>
        ))}
        {documentsByCourse.length === 0 && (
            <div className="text-center py-10">
                <p className="text-muted-foreground">You are not enrolled in any courses with documents.</p>
            </div>
        )}
      </div>
    </div>
  );
}
