
import { PaymentStatusCard } from "@/components/dashboard/payment-status";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MOCK_COURSES, MOCK_EVENTS, MOCK_PAYMENTS, MOCK_USERS } from "@/lib/mock-data";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, BookOpen, Calendar } from "lucide-react";

// In a real app, this would come from an auth context
const user = MOCK_USERS.admin;
const enrolledCourses = MOCK_COURSES.filter(course => user.enrolledCourseIds?.includes(course.id));
const upcomingEvents = MOCK_EVENTS.filter(event => !event.isPast).slice(0, 2);
// In a real app, you'd fetch the primary payment details for the user
const paymentDetails = MOCK_PAYMENTS;


export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold font-headline tracking-tight">
          Welcome back, {user.name.split(" ")[0]}!
        </h2>
        <p className="text-muted-foreground">
          Here&apos;s a summary of your activities.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <PaymentStatusCard paymentDetails={paymentDetails}/>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg font-medium">My Courses</CardTitle>
               <Button variant="ghost" size="sm" asChild>
                <Link href="/dashboard/courses">View All <ArrowRight className="ml-2 h-4 w-4"/></Link>
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {enrolledCourses.map(course => (
                  <div key={course.id} className="flex items-center gap-4">
                    <div className="bg-primary/10 p-3 rounded-lg">
                      <BookOpen className="h-5 w-5 text-primary"/>
                    </div>
                    <div>
                      <p className="font-medium">{course.title}</p>
                      <p className="text-sm text-muted-foreground">{`${course.days.join(', ')} | ${course.startTime} - ${course.endTime}`}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg font-medium">Upcoming Events</CardTitle>
               <Button variant="ghost" size="sm" asChild>
                <Link href="/dashboard/events">View All <ArrowRight className="ml-2 h-4 w-4"/></Link>
              </Button>
            </CardHeader>
            <CardContent>
               <div className="space-y-4">
                {upcomingEvents.map(event => (
                  <div key={event.id} className="flex items-center gap-4">
                     <div className="bg-accent/10 p-3 rounded-lg">
                      <Calendar className="h-5 w-5 text-accent-foreground"/>
                    </div>
                    <div>
                      <p className="font-medium">{event.title}</p>
                      <p className="text-sm text-muted-foreground">{event.date}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
