import { AppHeader } from "@/components/layout/app-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building, Goal, History, Users } from "lucide-react";

const aboutSections = [
    {
        title: 'History',
        icon: History,
        content: 'FFBF Training Center was founded in 2010 with the goal of providing accessible, high-quality education to our community. From humble beginnings, we have grown into a leading institution for professional development.'
    },
    {
        title: 'Mission',
        icon: Goal,
        content: 'To empower individuals with practical skills and knowledge, fostering personal and professional growth for a brighter future. We are committed to providing high-quality training in a supportive and dynamic learning environment.'
    },
    {
        title: 'Vision',
        icon: Building,
        content: 'Our vision is to be a beacon of learning and opportunity, recognized for our commitment to excellence, innovation, and community impact. We aspire to create a future where every individual has the chance to reach their full potential.'
    },
    {
        title: 'Partners',
        icon: Users,
        content: 'We are proud to partner with local businesses, non-profits, and educational organizations to enhance our programs and provide our students with valuable real-world experiences and networking opportunities.'
    }
]

export default function AboutPage() {
  return (
    <div className="flex min-h-screen flex-col">
        <AppHeader />
        <main className="flex-1 bg-background">
            <div className="container mx-auto py-12 px-4 md:px-6">
                <div className="text-center mb-12">
                    <h1 className="font-headline text-4xl font-extrabold tracking-tight sm:text-5xl">About FFBF Training Hub</h1>
                    <p className="mt-4 max-w-2xl mx-auto text-lg text-muted-foreground">Learn about our journey, our values, and the people who make it all happen.</p>
                </div>

                <div className="grid gap-8 md:grid-cols-2">
                    {aboutSections.map(section => (
                        <Card key={section.title}>
                            <CardHeader className="flex flex-row items-center gap-4">
                                <section.icon className="h-8 w-8 text-primary"/>
                                <CardTitle className="font-headline text-2xl">{section.title}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-muted-foreground">{section.content}</p>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </main>
    </div>
  );
}