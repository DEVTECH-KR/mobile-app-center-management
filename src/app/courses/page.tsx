import { CourseCard } from "@/components/dashboard/course-card";
import { AppHeader } from "@/components/layout/app-header";
import { MOCK_COURSES } from "@/lib/mock-data";

export default function PublicCoursesPage() {
  return (
    <div className="flex min-h-screen flex-col">
        <AppHeader />
        <main className="flex-1 bg-background">
            <div className="container mx-auto py-12 px-4 md:px-6">
                 <div className="text-center mb-12">
                    <h1 className="font-headline text-4xl font-extrabold tracking-tight sm:text-5xl">Our Courses</h1>
                    <p className="mt-4 max-w-2xl mx-auto text-lg text-muted-foreground">Find the perfect course to advance your skills and career.</p>
                </div>
                <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                    {MOCK_COURSES.map((course) => (
                    <CourseCard key={course.id} course={course} />
                    ))}
                </div>
            </div>
        </main>
    </div>
  );
}
