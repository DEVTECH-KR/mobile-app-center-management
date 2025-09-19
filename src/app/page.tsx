import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { BookOpenCheck } from 'lucide-react';
import Logo from '@/components/icons/logo';

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="container z-40 bg-background">
        <div className="flex h-20 items-center justify-between py-6">
          <div className="flex items-center gap-2">
            <Logo className="h-8 w-8 text-primary" />
            <span className="font-bold font-headline text-lg">
              FFBF Training Hub
            </span>
          </div>
          <nav>
            <Button asChild>
              <Link href="/login">Login</Link>
            </Button>
          </nav>
        </div>
      </header>
      <main className="flex-1">
        <section className="relative h-[calc(100vh-5rem)]">
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" />
          <div
            className="absolute inset-0 bg-dot-slate-400/[0.15] dark:bg-dot-slate-800/[0.25]"
            style={{
              maskImage: 'radial-gradient(ellipse at center, white, transparent 75%)',
            }}
          />
          <div className="container relative z-10 flex h-full flex-col items-center justify-center text-center">
            <h1 className="font-headline text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
              Fighting For a Better Future
            </h1>
            <p className="mt-6 max-w-3xl text-lg text-muted-foreground sm:text-xl">
              Your journey to excellence starts here. Empowering students with
              the skills needed for tomorrow's challenges.
            </p>
            <div className="mt-10 flex gap-4">
              <Button size="lg" asChild>
                <Link href="/login">Get Started</Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/dashboard/courses">Explore Courses</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
