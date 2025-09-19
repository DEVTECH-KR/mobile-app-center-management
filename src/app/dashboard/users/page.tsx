
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MOCK_CLASSES, MOCK_COURSES, MOCK_USERS } from "@/lib/mock-data";
import { Input } from "@/components/ui/input";
import { MoreVertical, PlusCircle, Search } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { UserRole } from "@/lib/types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

// In a real app, this would come from an auth context
const currentUser = MOCK_USERS.admin;

const allUsers = Object.values(MOCK_USERS);
const allTeachers = allUsers.filter(u => u.role === 'teacher');
const allClasses = MOCK_CLASSES;

const roleVariant: Record<UserRole, "default" | "secondary" | "outline"> = {
    admin: "default",
    teacher: "secondary",
    student: "outline",
}

export default function UsersPage() {
    if (currentUser.role !== 'admin') {
        return (
            <div className="flex items-center justify-center h-full">
                <p className="text-muted-foreground">You do not have permission to access this page.</p>
            </div>
        )
    }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
            <h2 className="text-3xl font-bold font-headline tracking-tight">
            Manage Users
            </h2>
            <p className="text-muted-foreground">
                View, add, and manage user accounts and permissions.
            </p>
        </div>
        <Button>
            <PlusCircle className="mr-2 h-4 w-4"/>
            Add User
        </Button>
      </div>

      <div className="mb-4 flex items-center justify-between">
          <div className="relative w-full max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"/>
              <Input placeholder="Filter by name or email..." className="pl-9"/>
          </div>
      </div>
      
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Assigned Class</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {allUsers.map((user) => {
              const assignedClasses = user.classIds?.map(id => MOCK_CLASSES.find(c => c.id === id)).filter(Boolean) || [];
              const assignedClassNames = assignedClasses.map(c => {
                  const course = MOCK_COURSES.find(co => co.id === c!.courseId);
                  return `${c!.name} (${course?.title} - ${c!.level})`
              }).join(', ');

              return(
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={user.avatarUrl} alt={user.name} />
                        <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{user.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {user.email}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                      <Badge variant={roleVariant[user.role]} className="capitalize">{user.role}</Badge>
                  </TableCell>
                  <TableCell>
                      {user.role === 'teacher' ? (
                          <Select defaultValue={assignedClasses[0]?.id}>
                              <SelectTrigger className="w-[280px]">
                                  <SelectValue placeholder="Assign a class" />
                              </SelectTrigger>
                              <SelectContent>
                                  {allClasses.map(c => {
                                      const course = MOCK_COURSES.find(co => co.id === c.courseId);
                                      return <SelectItem key={c.id} value={c.id}>{c.name} ({course?.title} - {c.level})</SelectItem>
                                  })}
                              </SelectContent>
                          </Select>
                      ) : user.role === 'student' ? (
                          <span>{assignedClassNames || "Not assigned"}</span>
                      ) : (
                          <span className="text-muted-foreground">N/A</span>
                      )}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem>Edit Profile</DropdownMenuItem>
                          <DropdownMenuItem>Change Role</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive">Delete User</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
