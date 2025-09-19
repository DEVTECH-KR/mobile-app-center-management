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
import { Download, FileText, PlusCircle } from "lucide-react";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// In a real app, this would come from an auth context
const user = MOCK_USERS.student;
const userRole = user.role;
const enrolledCourses = MOCK_COURSES.filter(course => user.enrolledCourseIds?.includes(course.id));
const documentsByCourse = enrolledCourses.map(course => ({
    ...course,
    documents: MOCK_DOCUMENTS.filter(doc => doc.courseId === course.id)
}));

export default function DocumentsPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
         <div>
            <h2 className="text-3xl font-bold font-headline tracking-tight">
            Course Documents
            </h2>
            <p className="text-muted-foreground">
                Access your syllabus, materials, and assignments here.
            </p>
        </div>
         {userRole === 'teacher' && (
            <Button>
                <PlusCircle className="mr-2 h-4 w-4"/>
                Upload Document
            </Button>
        )}
      </div>

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
                    <div className="rounded-lg border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                            <TableHead>Title</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Uploaded</TableHead>
                            <TableHead className="text-right">Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {course.documents.map(doc => (
                                <TableRow key={doc.id}>
                                    <TableCell className="font-medium">{doc.title}</TableCell>
                                    <TableCell>{doc.type}</TableCell>
                                    <TableCell>{format(new Date(doc.uploadedAt), 'MMM d, yyyy')}</TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="icon" asChild>
                                            <a href={doc.fileUrl} download>
                                                <Download className="h-4 w-4"/>
                                            </a>
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                    </div>
                </CardContent>
            </Card>
        ))}
      </div>
    </div>
  );
}
