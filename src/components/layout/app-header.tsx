"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Logo from "@/components/icons/logo";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu } from "lucide-react";
import React from "react";

const navLinks = [
    { href: "/about", label: "About" },
    { href: "/courses", label: "Courses" },
    { href: "/events", label: "Events" },
    { href: "/team", label: "Team" },
];

export function AppHeader() {
    const pathname = usePathname();
    const [isOpen, setIsOpen] = React.useState(false);

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
                </div>

                <nav className="hidden md:flex gap-6 items-center">
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
                     <Button asChild>
                        <Link href="/login">Login</Link>
                    </Button>
                </nav>
                
                <div className="md:hidden">
                    <Sheet open={isOpen} onOpenChange={setIsOpen}>
                        <SheetTrigger asChild>
                            <Button variant="ghost" size="icon">
                                <Menu />
                                <span className="sr-only">Open Menu</span>
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="left">
                            <div className="flex flex-col gap-6 p-6">
                                <Link href="/" className="flex items-center gap-2" onClick={() => setIsOpen(false)}>
                                    <Logo className="h-8 w-8 text-primary" />
                                    <span className="font-bold font-headline text-lg">
                                        FFBF Training Hub
                                    </span>
                                </Link>
                                <div className="flex flex-col gap-4">
                                {navLinks.map(link => (
                                    <Link 
                                        key={link.href}
                                        href={link.href} 
                                        onClick={() => setIsOpen(false)}
                                        className={cn(
                                            "text-base font-medium transition-colors hover:text-primary",
                                            pathname === link.href ? "text-primary" : "text-foreground"
                                        )}
                                    >
                                        {link.label}
                                    </Link>
                                ))}
                                </div>
                                <Button asChild>
                                    <Link href="/login" onClick={() => setIsOpen(false)}>Login</Link>
                                </Button>
                            </div>
                        </SheetContent>
                    </Sheet>
                </div>
            </div>
        </header>
    )
}
