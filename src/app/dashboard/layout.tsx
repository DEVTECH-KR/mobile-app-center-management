
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarInset,
  SidebarTrigger,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { Home, Library, CreditCard, Calendar, FileText, Settings, Shield, User as UserIcon, LogOut, BookMarked, Send, Lock } from 'lucide-react';
import { UserNav } from "@/components/dashboard/user-nav";
import Link from "next/link";
import Logo from "@/components/icons/logo";
import { MOCK_USERS } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

// In a real app, this would come from your auth provider
const user = MOCK_USERS.student;
const userRole = user.role;

// A student has access if they are enrolled in at least one course.
// Pending requests do not count.
const studentHasAccess = user.role === 'student' && (user.enrolledCourseIds?.length ?? 0) > 0;

const navConfig = {
  student: [
    { href: "/dashboard", icon: Home, label: "Dashboard" },
    { href: "/dashboard/courses", icon: Library, label: "Courses" },
    { href: "/dashboard/payments", icon: CreditCard, label: "My Payments", locked: !studentHasAccess },
    { href: "/dashboard/documents", icon: FileText, label: "Documents", locked: !studentHasAccess },
    { href: "/dashboard/events", icon: Calendar, label: "Events", locked: !studentHasAccess },
  ],
  admin: [
    { href: "/dashboard", icon: Home, label: "Dashboard" },
    { href: "/dashboard/enrollments", icon: Send, label: "Enrollment Requests"},
    { href: "/dashboard/courses", icon: Library, label: "Manage Courses" },
    { href: "/dashboard/classes", icon: BookMarked, label: "Manage Classes" },
    { href: "/dashboard/payments", icon: CreditCard, label: "Manage Payments" },
    { href: "/dashboard/users", icon: UserIcon, label: "Manage Users" },
    { href: "/dashboard/events", icon: Calendar,label: "Manage Events" },
    { href: "/dashboard/settings", icon: Settings, label: "Center Info" },
  ],
  teacher: [
    { href: "/dashboard", icon: Home, label: "Dashboard" },
    { href: "/dashboard/courses", icon: Library, label: "My Courses" },
    { href: "/dashboard/documents", icon: FileText, label: "Upload Documents" },
    { href: "/dashboard/students", icon: UserIcon, label: "My Students" },
    { href: "/dashboard/events", icon: Calendar, label: "Events" },
  ],
};

const navItems = navConfig[userRole];


export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader className="p-4">
          <div className="flex items-center gap-2">
            <Logo className="h-8 w-8 text-primary" />
            <span className="font-bold font-headline text-lg group-data-[collapsible=icon]:hidden">
              FFBF Training Hub
            </span>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            {navItems.map((item) => {
              if (item.locked) {
                return (
                  <SidebarMenuItem key={item.label}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <SidebarMenuButton className="cursor-not-allowed text-muted-foreground" disabled>
                          <Lock />
                          <span>{item.label}</span>
                        </SidebarMenuButton>
                      </TooltipTrigger>
                      <TooltipContent side="right" align="center">
                        <p>Complete your enrollment to unlock.</p>
                      </TooltipContent>
                    </Tooltip>
                  </SidebarMenuItem>
                );
              }
              return (
                <SidebarMenuItem key={item.label}>
                  <SidebarMenuButton asChild tooltip={item.label}>
                    <Link href={item.href}>
                      <item.icon />
                      <span>{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter className="p-4">
            {userRole === 'admin' && (
                <div className="group-data-[collapsible=icon]:hidden">
                    <div className="flex items-center gap-2 rounded-lg bg-accent/50 p-3 text-sm">
                        <Shield className="h-5 w-5 text-primary"/>
                        <div>
                            <p className="font-semibold">Admin Mode</p>
                            <p className="text-xs text-muted-foreground">Full access granted.</p>
                        </div>
                    </div>
                </div>
            )}
        </SidebarFooter>
      </Sidebar>
      <div className="flex flex-col flex-1">
        <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b bg-card px-6">
          <div className="flex items-center gap-4">
            <SidebarTrigger className="md:hidden" />
            <h2 className="font-headline text-xl font-semibold capitalize hidden sm:block">
              {userRole} Dashboard
            </h2>
          </div>
          <UserNav />
        </header>
        <main className="flex-1 overflow-y-auto p-6 bg-background">
          {children}
        </main>
      </div>
    </SidebarProvider>
  );
}
