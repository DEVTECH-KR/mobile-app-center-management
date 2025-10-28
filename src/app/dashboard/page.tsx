// src/app/dashboard/page.tsx
'use client';

import { PaymentStatusCard } from "@/components/dashboard/payment-status";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, BookOpen, Calendar } from "lucide-react";
import { useAuth } from "@/lib/auth";

export default function DashboardPage() {
  const { user } = useAuth();

  if (!user) {
    return null;
  }

  // For real app, fetch enrolledCourses, events, payments based on user
  // For now, assume placeholders or fetch
  const enrolledCourses = []; // Replace with real fetch or user.enrolledCourses
  const upcomingEvents = []; // Fetch
  const paymentDetails = null; // Fetch

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
        {user.role === 'student' && paymentDetails && (
           <div className="lg:col-span-2">
            <PaymentStatusCard paymentDetails={paymentDetails}/>
           </div>
        )}
       
        {user.role === 'student' ? (
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
                     {enrolledCourses.length === 0 && <p className="text-sm text-muted-foreground">You are not enrolled in any courses yet.</p>}
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
                        <p className="text-sm text-muted-foreground">{event.date as string}</p>
                        </div>
                    </div>
                    ))}
                </div>
                </CardContent>
            </Card>
            </div>
        ) : (
             <div className="col-span-full">
                <Card>
                    <CardHeader>
                        <CardTitle>Admin Dashboard</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p>Welcome to the admin control panel. Use the navigation on the left to manage the center.</p>
                    </CardContent>
                </Card>
            </div>
        )}
      </div>
    </div>
  );
}