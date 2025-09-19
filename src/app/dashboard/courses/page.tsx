import { CourseCard } from "@/components/dashboard/course-card";
import { MOCK_COURSES } from "@/lib/mock-data";

export default function CoursesPage() {
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
        {MOCK_COURSES.map((course) => (
          <CourseCard key={course.id} course={course} />
        ))}
      </div>
    </div>
  );
}
