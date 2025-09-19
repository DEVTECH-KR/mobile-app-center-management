import { AppHeader } from "@/components/layout/app-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Image from "next/image";

const teamMembers = [
    {
        name: 'Dr. Evelyn Reed',
        role: 'Founder & Lead Instructor (Programming)',
        bio: 'With over 20 years of experience in software development and education, Dr. Reed is passionate about making technology accessible to everyone.',
        avatar: 'https://picsum.photos/seed/201/200/200'
    },
    {
        name: 'Marcus Chen',
        role: 'Instructor (Office Suite)',
        bio: 'Marcus is a certified Microsoft Office Specialist Master with a knack for turning complex software into easy-to-use tools for productivity.',
        avatar: 'https://picsum.photos/seed/202/200/200'
    },
    {
        name: 'Isabelle Dubois',
        role: 'Language Specialist (French & English)',
        bio: 'A native French speaker with a masters in linguistics, Isabelle brings a dynamic and immersive approach to language learning.',
        avatar: 'https://picsum.photos/seed/203/200/200'
    },
     {
        name: 'Admin Director',
        role: 'Center Administrator',
        bio: 'The organizational backbone of the center, ensuring everything runs smoothly for students and staff alike.',
        avatar: 'https://picsum.photos/seed/102/200/200'
    }
]

export default function TeamPage() {
  return (
    <div className="flex min-h-screen flex-col">
        <AppHeader />
        <main className="flex-1 bg-background">
            <div className="container mx-auto py-12 px-4 md:px-6">
                <div className="text-center mb-12">
                    <h1 className="font-headline text-4xl font-extrabold tracking-tight sm:text-5xl">Meet Our Team</h1>
                    <p className="mt-4 max-w-2xl mx-auto text-lg text-muted-foreground">The dedicated professionals behind our success.</p>
                </div>
                <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
                    {teamMembers.map(member => (
                        <Card key={member.name} className="text-center">
                            <CardHeader>
                                <div className="relative h-32 w-32 mx-auto">
                                    <Image src={member.avatar} alt={member.name} className="rounded-full object-cover" fill/>
                                </div>
                                <CardTitle className="font-headline text-xl pt-4">{member.name}</CardTitle>
                                <p className="text-sm text-primary font-medium">{member.role}</p>
                            </CardHeader>
                            <CardContent>
                                <p className="text-muted-foreground text-sm">{member.bio}</p>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </main>
    </div>
  );
}