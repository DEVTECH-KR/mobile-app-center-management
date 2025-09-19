import { AppHeader } from "@/components/layout/app-header";
import { Button } from "@/components/ui/button";
import { MOCK_EVENTS } from "@/lib/mock-data";
import { notFound } from "next/navigation";
import Image from "next/image";
import { format } from "date-fns";
import { ArrowLeft, Calendar, Gift } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";

export default function EventDetailsPage({ params }: { params: { id: string } }) {
  const event = MOCK_EVENTS.find((e) => e.id === params.id);

  if (!event) {
    notFound();
  }

  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader />
      <main className="flex-1 bg-background">
        <div className="container mx-auto py-12 px-4 md:px-6">
          <div className="mb-8">
            <Button variant="outline" asChild>
              <Link href="/events">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Events
              </Link>
            </Button>
          </div>

          <div className="grid md:grid-cols-5 gap-8">
            <div className="md:col-span-3">
              <Carousel className="w-full">
                <CarouselContent>
                  {event.imageUrls.map((url, index) => (
                    <CarouselItem key={index}>
                      <Image
                        src={url}
                        alt={`${event.title} - Image ${index + 1}`}
                        width={1200}
                        height={800}
                        className="rounded-lg object-cover w-full aspect-[3/2]"
                        data-ai-hint={event.imageHint}
                      />
                    </CarouselItem>
                  ))}
                </CarouselContent>
                 {event.imageUrls.length > 1 && (
                  <>
                    <CarouselPrevious className="left-2" />
                    <CarouselNext className="right-2" />
                  </>
                )}
              </Carousel>
            </div>
            <div className="md:col-span-2">
                <h1 className="font-headline text-4xl font-extrabold tracking-tight mb-2">
                    {event.title}
                </h1>
                <div className="flex items-center text-muted-foreground gap-4 mb-6">
                    <div className="flex items-center gap-2">
                        <Calendar className="h-5 w-5" />
                        <span className="font-medium text-lg">{format(new Date(event.date), "MMMM d, yyyy")}</span>
                    </div>
                    {event.isPast && <Badge variant="outline">Past Event</Badge>}
                </div>

                <p className="text-lg mb-6">{event.details || event.description}</p>
                
                {!event.isPast && (
                    <Button size="lg" className="w-full">
                        <Gift className="mr-2 h-5 w-5" />
                        Contribute
                    </Button>
                )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
