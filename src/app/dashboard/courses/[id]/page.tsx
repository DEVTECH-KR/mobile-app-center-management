
import { Button } from "@/components/ui/button";
import { MOCK_COURSES, MOCK_USERS } from "@/lib/mock-data";
import { notFound } from "next/navigation";
import Image from "next/image";
import { ArrowLeft, BookOpen, Clock, Tag, User } from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function CourseDetailsPage({ params }: { params: { id: string } }) {
  const course = MOCK_COURSES.find((c) => c.id === params.id);

  if (!course) {
    notFound();
  }

  const teachers = MOCK_USERS ? Object.values(MOCK_USERS).filter(u => u.role === 'teacher' && course.teacherIds.includes(u.id)) : [];
  const schedule = `${course.days.join(', ')} | ${course.startTime} - ${course.endTime}`;

  const currencyFormatter = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "FBU",
    minimumFractionDigits: 0,
  });

  return (
      <div className="space-y-6">
        <div className="mb-8">
            <Button variant="outline" asChild>
                <Link href="/dashboard/courses">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Courses
                </Link>
            </Button>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
            <div className="md:col-span-2 space-y-6">
                 <h1 className="font-headline text-4xl font-extrabold tracking-tight">
                    {course.title}
                </h1>
                <div className="relative aspect-video w-full">
                    <Image
                        src={course.imageUrl}
                        alt={course.title}
                        fill
                        className="rounded-lg object-cover"
                        data-ai-hint={course.imageHint}
                    />
                </div>
                <div>
                    <h2 className="font-headline text-2xl font-semibold mb-2">Description</h2>
                    <p className="text-muted-foreground">{course.description}</p>
                </div>
            </div>
            <div className="md:col-span-1 space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="font-headline text-2xl text-primary">{currencyFormatter.format(course.price)}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                         <div className="flex items-center gap-3">
                            <Clock className="h-5 w-5 text-muted-foreground" />
                            <div>
                                <p className="font-medium">Schedule</p>
                                <p className="text-sm text-muted-foreground">{schedule}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <Tag className="h-5 w-5 text-muted-foreground" />
                            <div>
                                <p className="font-medium">Levels</p>
                                <div className="flex flex-wrap gap-1 mt-1">
                                    {course.levels?.map(level => <Badge key={level} variant="secondary">{level}</Badge>)}
                                </div>
                            </div>
                        </div>
                         <div className="flex items-start gap-3">
                            <User className="h-5 w-5 text-muted-foreground mt-1" />
                            <div>
                                <p className="font-medium">Instructors</p>
                                <div className="text-sm text-muted-foreground">
                                    {teachers.length > 0 ? teachers.map(t => t.name).join(', ') : 'Not yet assigned'}
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                 <Button size="lg" className="w-full">
                    <BookOpen className="mr-2 h-5 w-5" />
                    Enroll Student
                </Button>
            </div>
          </div>
      </div>
  );
}
