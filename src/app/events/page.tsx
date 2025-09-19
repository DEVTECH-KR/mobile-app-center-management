import { EventCard } from "@/components/dashboard/event-card";
import { AppHeader } from "@/components/layout/app-header";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MOCK_EVENTS, MOCK_USERS } from "@/lib/mock-data";
import { Gift } from "lucide-react";

// In a real app, this would come from an auth context, or be public
const userRole = MOCK_USERS.student.role; 

const upcomingEvents = MOCK_EVENTS.filter((event) => !event.isPast);
const pastEvents = MOCK_EVENTS.filter((event) => event.isPast);

export default function PublicEventsPage() {
  return (
    <div className="flex min-h-screen flex-col">
        <AppHeader />
        <main className="flex-1 bg-background">
            <div className="container mx-auto py-12 px-4 md:px-6">
                <div className="text-center mb-12">
                    <h1 className="font-headline text-4xl font-extrabold tracking-tight sm:text-5xl">Center Events</h1>
                    <p className="mt-4 max-w-2xl mx-auto text-lg text-muted-foreground">Stay updated with our latest events, workshops, and community gatherings.</p>
                     <Button className="mt-6">
                        <Gift className="mr-2 h-4 w-4"/>
                        Contribute to an Event
                    </Button>
                </div>

                <Tabs defaultValue="upcoming" className="w-full">
                    <TabsList className="grid w-full grid-cols-2 md:w-auto md:mx-auto">
                        <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
                        <TabsTrigger value="past">Past</TabsTrigger>
                    </TabsList>
                    <TabsContent value="upcoming">
                        <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 mt-6">
                            {upcomingEvents.map((event) => (
                            <EventCard key={event.id} event={event} userRole={userRole} />
                            ))}
                        </div>
                    </TabsContent>
                    <TabsContent value="past">
                        <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 mt-6">
                            {pastEvents.map((event) => (
                            <EventCard key={event.id} event={event} userRole={userRole} />
                            ))}
                        </div>
                    </TabsContent>
                </Tabs>

            </div>
        </main>
    </div>
  );
}