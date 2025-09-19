
import Image from "next/image";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { Event, UserRole } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Calendar, Gift } from "lucide-react";
import { format } from "date-fns";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "../ui/carousel";

export function EventCard({ event, userRole }: { event: Event, userRole: UserRole }) {
  const eventDate = new Date(event.date);
  const detailsUrl = userRole === 'admin' ? `/dashboard/events/${event.id}` : `/events/${event.id}`;

  return (
    <Card className="overflow-hidden flex flex-col">
      <Carousel className="w-full">
        <CarouselContent>
          {event.imageUrls.map((url, index) => (
            <CarouselItem key={index}>
              <Image
                src={url}
                alt={`${event.title} - Image ${index + 1}`}
                width={600}
                height={400}
                className="aspect-[3/2] w-full object-cover"
                data-ai-hint={event.imageHint}
              />
            </CarouselItem>
          ))}
        </CarouselContent>
        {event.imageUrls.length > 1 && (
          <>
            <CarouselPrevious className="absolute left-2 top-1/2 -translate-y-1/2" />
            <CarouselNext className="absolute right-2 top-1/2 -translate-y-1/2" />
          </>
        )}
      </Carousel>
      <CardHeader>
        <CardTitle className="font-headline text-xl">{event.title}</CardTitle>
        <div className="flex items-center text-sm text-muted-foreground gap-2">
            <Calendar className="h-4 w-4" />
            <span>{format(eventDate, "MMMM d, yyyy")}</span>
            {event.isPast && <Badge variant="outline">Past Event</Badge>}
        </div>
      </CardHeader>
      <CardContent className="flex-grow">
        <CardDescription>{event.description}</CardDescription>
      </CardContent>
      <CardFooter className="gap-2">
        <Button variant="outline" className="w-full" asChild>
            <Link href={detailsUrl}>View Details</Link>
        </Button>
        {!event.isPast && (
            <Button className="w-full">
                <Gift className="mr-2 h-4 w-4" />
                Contribute
            </Button>
        )}
      </CardFooter>
    </Card>
  );
}
