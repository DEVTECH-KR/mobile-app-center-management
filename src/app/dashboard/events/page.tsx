import { EventCard } from "@/components/dashboard/event-card";
import { MOCK_EVENTS, MOCK_USERS } from "@/lib/mock-data";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";

// In a real app, this would come from an auth context
const userRole = MOCK_USERS.student.role;
// const userRole = MOCK_USERS.admin.role;

const upcomingEvents = MOCK_EVENTS.filter((event) => !event.isPast);
const pastEvents = MOCK_EVENTS.filter((event) => event.isPast);

export default function EventsPage() {
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
            <Button>
                <PlusCircle className="mr-2 h-4 w-4"/>
                Add Event
            </Button>
        )}
      </div>

      <Tabs defaultValue="upcoming" className="w-full">
        <TabsList>
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
  );
}
