
'use client';

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
import { Edit, Loader2, MoreVertical, PlusCircle, Search, Trash2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { User, UserRole } from "@/lib/types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useState, useMemo } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useToast } from "@/hooks/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

// In a real app, this would come from an auth context
const currentUser = MOCK_USERS.admin;

const allInitialUsers = Object.values(MOCK_USERS);
const allClasses = MOCK_CLASSES;

const roleVariant: Record<UserRole, "default" | "secondary" | "outline"> = {
    admin: "default",
    teacher: "secondary",
    student: "outline",
}

const formSchema = z.object({
  name: z.string().min(2, { message: "Name is required." }),
  email: z.string().email({ message: "Invalid email address." }),
  role: z.enum(["student", "teacher", "admin"], { required_error: "Please select a role." }),
  avatarUrl: z.string().url().optional(),
});

export default function UsersPage() {
    const [users, setUsers] = useState<User[]>(allInitialUsers);
    const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const { toast } = useToast();

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
    });

     const handleOpenCreateDialog = () => {
        setEditingUser(null);
        form.reset({ name: "", email: "", role: "student", avatarUrl: "" });
        setIsFormDialogOpen(true);
    };

    const handleOpenEditDialog = (user: User) => {
        setEditingUser(user);
        form.reset({
            name: user.name,
            email: user.email,
            role: user.role,
            avatarUrl: user.avatarUrl,
        });
        setIsFormDialogOpen(true);
    };

    const handleDeleteUser = (userId: string) => {
        setUsers(prev => prev.filter(u => u.id !== userId));
        toast({
            title: "User Deleted",
            description: "The user has been successfully deleted.",
            variant: "destructive"
        });
    }

    function onSubmit(values: z.infer<typeof formSchema>) {
        form.handleSubmit(() => {
            // Simulate API call
            setTimeout(() => {
                if (editingUser) {
                    const updatedUser = { ...editingUser, ...values, role: values.role as UserRole };
                    setUsers(prev => prev.map(u => u.id === editingUser.id ? updatedUser : u));
                    toast({
                        title: "User Updated",
                        description: `The user "${updatedUser.name}" has been updated.`,
                    });
                } else {
                    const newUser: User = {
                        id: `user-${Date.now()}`,
                        ...values,
                        role: values.role as UserRole,
                        avatarUrl: values.avatarUrl || `https://picsum.photos/seed/${Date.now()}/100/100`,
                    }
                    setUsers(prev => [newUser, ...prev]);
                    toast({
                        title: "User Created",
                        description: `The user "${newUser.name}" has been successfully created.`,
                    });
                }
                setIsFormDialogOpen(false);
                setEditingUser(null);
                form.reset();
            }, 500);
        })()
    }
    
    const filteredUsers = useMemo(() => {
        if (!searchTerm) return users;
        const lowercasedTerm = searchTerm.toLowerCase();
        return users.filter(user =>
            user.name.toLowerCase().includes(lowercasedTerm) ||
            user.email.toLowerCase().includes(lowercasedTerm)
        );
    }, [users, searchTerm]);


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
        <Button onClick={handleOpenCreateDialog}>
            <PlusCircle className="mr-2 h-4 w-4"/>
            Add User
        </Button>
      </div>

       <Dialog open={isFormDialogOpen} onOpenChange={setIsFormDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                    <DialogHeader>
                    <DialogTitle>{editingUser ? 'Edit User' : 'Create a new user'}</DialogTitle>
                    <DialogDescription>
                        {editingUser ? 'Update the details for this user.' : 'Fill in the details below to create a new user.'}
                    </DialogDescription>
                    </DialogHeader>
                    
                    <div className="grid gap-4 py-4">
                         <FormField control={form.control} name="name" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Full Name</FormLabel>
                                <FormControl><Input placeholder="John Doe" {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )}/>
                        <FormField control={form.control} name="email" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Email</FormLabel>
                                <FormControl><Input type="email" placeholder="name@example.com" {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )}/>
                         <FormField control={form.control} name="role" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Role</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                    <FormControl>
                                        <SelectTrigger><SelectValue placeholder="Select a role" /></SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="student">Student</SelectItem>
                                        <SelectItem value="teacher">Teacher</SelectItem>
                                        <SelectItem value="admin">Admin</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}/>
                         <FormField control={form.control} name="avatarUrl" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Avatar URL (Optional)</FormLabel>
                                <FormControl><Input type="url" placeholder="https://..." {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )}/>
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setIsFormDialogOpen(false)}>Cancel</Button>
                        <Button type="submit" disabled={form.formState.isSubmitting}>
                            {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {editingUser ? 'Save Changes' : 'Create User'}
                        </Button>
                    </DialogFooter>
                </form>
            </Form>
        </DialogContent>
      </Dialog>


      <div className="mb-4 flex items-center justify-between">
          <div className="relative w-full max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"/>
              <Input
                placeholder="Filter by name or email..."
                className="pl-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
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
            {filteredUsers.length === 0 && (
                <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center">
                        No users found.
                    </TableCell>
                </TableRow>
            )}
            {filteredUsers.map((user) => {
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
                          <DropdownMenuItem onClick={() => handleOpenEditDialog(user)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit Profile
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                           <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive">
                                        <Trash2 className="mr-2 h-4 w-4" />
                                        Delete User
                                    </DropdownMenuItem>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        This action cannot be undone. This will permanently delete the user <span className="font-semibold">"{user.name}"</span>.
                                    </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleDeleteUser(user.id)}>Delete</AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
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
