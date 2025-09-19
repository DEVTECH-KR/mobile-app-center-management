"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Logo from "@/components/icons/logo";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const navLinks = [
    { href: "/about", label: "About" },
    { href: "/courses", label: "Courses" },
    { href: "/events", label: "Events" },
    { href: "/team", label: "Team" },
];

export function AppHeader() {
    const pathname = usePathname();

    return (
        <header className="container z-40 bg-background">
            <div className="flex h-20 items-center justify-between py-6">
                <div className="flex items-center gap-6">
                    <Link href="/" className="flex items-center gap-2">
                        <Logo className="h-8 w-8 text-primary" />
                        <span className="hidden font-bold font-headline text-lg sm:inline-block">
                        FFBF Training Hub
                        </span>
                    </Link>
                    <nav className="hidden md:flex gap-6">
                       {navLinks.map(link => (
                            <Link 
                                key={link.href}
                                href={link.href} 
                                className={cn(
                                    "text-sm font-medium transition-colors hover:text-primary",
                                    pathname === link.href ? "text-primary" : "text-muted-foreground"
                                )}
                            >
                                {link.label}
                            </Link>
                       ))}
                    </nav>
                </div>
                <nav>
                    <Button asChild>
                    <Link href="/login">Login</Link>
                    </Button>
                </nav>
            </div>
        </header>
    )
}
