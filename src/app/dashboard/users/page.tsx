// Updated src/app/dashboard/users/page.tsx
'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Edit, Loader2, MoreVertical, PlusCircle, Trash2, Users, X } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from '@/components/ui/form';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { usersApi } from '@/lib/api/users.api';
import { classesApi } from '@/lib/api/classes.api';
import { useAuth } from '@/lib/auth';
import type { IUser } from '@/server/api/auth/user.schema';
import type { IClass } from '@/server/api/classes/class.schema';
import { assignmentsApi } from '@/lib/api/assignments.api';

const formSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters.' }),
  email: z.string().email({ message: 'Please enter a valid email address.' }),
  role: z.enum(['student', 'teacher', 'admin'], { required_error: 'Please select a role.' }),
  status: z.enum(['active', 'banned', 'pending', 'inactive'], { required_error: 'Please select a status.' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters.' }).optional().or(z.literal('')),
});

const assignmentSchema = z.object({
  studentId: z.string().min(1, { message: 'Please select a student.' }),
  classId: z.string().min(1, { message: 'Please select a class.' }),
});

// Updated StudentAssignedClassesCell Component with auto-refresh
function StudentAssignedClassesCell({ 
  user, 
  refreshTrigger 
}: { 
  user: IUser; 
  refreshTrigger: number; // Add this prop to trigger re-renders
}) {
  const [classesCount, setClassesCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const { user: currentUser } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    const fetchClassesCount = async () => {
      try {
        setIsLoading(true);
        const result = await assignmentsApi.getAssignedClassesCount(
          user._id.toString(), 
          currentUser?.token
        );
        setClassesCount(result.count || 0);
      } catch (error: any) {
        console.error('Error fetching classes count:', error);
        toast({
          title: 'Error',
          description: error.message || 'Failed to load class count',
          variant: 'destructive'
        });
        setClassesCount(0);
      } finally {
        setIsLoading(false);
      }
    };

    fetchClassesCount();
  }, [user._id, currentUser?.token, toast, refreshTrigger]); // Add refreshTrigger to dependencies

  if (isLoading) {
    return <span className="text-muted-foreground">Loading...</span>;
  }

  if (classesCount === 0) {
    return <span className="text-muted-foreground italic">Not assigned</span>;
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm">
        {classesCount} {classesCount === 1 ? 'class' : 'classes'}
      </span>
    </div>
  );
}

// Updated ViewClassesDialog Component
function ViewClassesDialog({ 
  user, 
  isOpen, 
  onClose,
  onRemoveFromClass 
}: { 
  user: IUser; 
  isOpen: boolean; 
  onClose: () => void;
  onRemoveFromClass: (userId: string, classId: string) => Promise<void>;
}) {
  const [assignedClasses, setAssignedClasses] = useState<IClass[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const { user: currentUser } = useAuth();

  useEffect(() => {
    const fetchAssignedClasses = async () => {
      if (isOpen && user._id) {
        try {
          setIsLoading(true);
          const result = await assignmentsApi.getStudentAssignedClasses(
            user._id.toString(), 
            currentUser?.token
          );
          setAssignedClasses(result.classes || []);
        } catch (error: any) {
          toast({
            title: 'Error',
            description: error.message || 'Failed to load assigned classes',
            variant: 'destructive'
          });
        } finally {
          setIsLoading(false);
        }
      }
    };

    fetchAssignedClasses();
  }, [isOpen, user._id, currentUser?.token, toast]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Classes for {user.name}</DialogTitle>
          <DialogDescription>
            View and manage class assignments for this student.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {isLoading ? (
            <div className="flex justify-center py-4">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : assignedClasses.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">No classes assigned</p>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {assignedClasses.map((cls) => (
                <div key={cls._id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="font-medium">{cls.name}</div>
                    {cls.courseId?.title && (
                      <div className="text-sm text-muted-foreground">
                        {cls.courseId.title} - {cls.level}
                      </div>
                    )}
                    {cls.schedule && (
                      <div className="text-xs text-muted-foreground mt-1">
                        Schedule: {cls.schedule}
                      </div>
                    )}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onRemoveFromClass(user._id.toString(), cls._id.toString())}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10 ml-2"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
        
        <DialogFooter>
          <Button onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


function AvailableClassesSelect({ 
  studentId, 
  currentUser 
}: { 
  studentId: string; 
  currentUser: any;
}) {
  const [availableClasses, setAvailableClasses] = useState<IClass[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const fetchAvailableClasses = async () => {
      if (studentId) {
        try {
          setIsLoading(true);
          const result = await assignmentsApi.getAvailableClasses(studentId, currentUser?.token);
          setAvailableClasses(result.availableClasses || []);
        } catch (error: any) {
          console.error('Error fetching available classes:', error);
          toast({
            title: 'Error',
            description: error.message || 'Failed to load available classes',
            variant: 'destructive'
          });
          setAvailableClasses([]);
        } finally {
          setIsLoading(false);
        }
      } else {
        setAvailableClasses([]);
      }
    };

    fetchAvailableClasses();
  }, [studentId, currentUser?.token, toast]);

  if (!studentId) {
    return <SelectItem value="select-student-first" disabled>Select a student first</SelectItem>;
  }

  if (isLoading) {
    return <SelectItem value="loading" disabled>Loading classes...</SelectItem>;
  }

  if (availableClasses.length === 0) {
    return <SelectItem value="no-classes" disabled>No available classes</SelectItem>;
  }

  return (
    <>
      {availableClasses.map((cls) => (
        <SelectItem key={cls._id} value={cls._id.toString()}>
          {cls.name} ({cls.courseId?.title} - {cls.level})
        </SelectItem>
      ))}
    </>
  );
}

function TeacherAssignedClassesCell({ 
  user, 
  refreshTrigger 
}: { 
  user: IUser; 
  refreshTrigger: number;
}) {
  const [classesCount, setClassesCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const { user: currentUser } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    const fetchClassesCount = async () => {
      try {
        setIsLoading(true);
        // Compter les classes où cet enseignant est assigné
        const result = await classesApi.getAll({}, currentUser?.token);
        const teacherClasses = result.classes?.filter((cls: IClass) => 
          (cls.teacherId as any)?._id.toString() === user._id.toString()
        ) || [];
        setClassesCount(teacherClasses.length);
      } catch (error: any) {
        console.error('Error fetching teacher classes count:', error);
        toast({
          title: 'Error',
          description: error.message || 'Failed to load class count',
          variant: 'destructive'
        });
        setClassesCount(0);
      } finally {
        setIsLoading(false);
      }
    };

    fetchClassesCount();
  }, [user._id, currentUser?.token, toast, refreshTrigger]);

  if (isLoading) {
    return <span className="text-muted-foreground">Loading...</span>;
  }

  if (classesCount === 0) {
    return <span className="text-muted-foreground italic">Not assigned</span>;
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm">
        {classesCount} {classesCount === 1 ? 'class' : 'classes'}
      </span>
    </div>
  );
}

function ViewTeacherClassesDialog({ 
  user, 
  isOpen, 
  onClose 
}: { 
  user: IUser; 
  isOpen: boolean; 
  onClose: () => void;
}) {
  const [assignedClasses, setAssignedClasses] = useState<IClass[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const { user: currentUser } = useAuth();

  useEffect(() => {
    const fetchAssignedClasses = async () => {
      if (isOpen && user._id) {
        try {
          setIsLoading(true);
          const result = await classesApi.getAll({}, currentUser?.token);
          const teacherClasses = result.classes?.filter((cls: IClass) => 
            (cls.teacherId as any)?._id.toString() === user._id.toString()
          ) || [];
          setAssignedClasses(teacherClasses);
        } catch (error: any) {
          toast({
            title: 'Error',
            description: error.message || 'Failed to load assigned classes',
            variant: 'destructive'
          });
        } finally {
          setIsLoading(false);
        }
      }
    };

    fetchAssignedClasses();
  }, [isOpen, user._id, currentUser?.token, toast]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Classes taught by {user.name}</DialogTitle>
          <DialogDescription>
            View classes where this teacher is assigned.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {isLoading ? (
            <div className="flex justify-center py-4">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : assignedClasses.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">No classes assigned</p>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {assignedClasses.map((cls) => (
                <div key={cls._id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="font-medium">{cls.name}</div>
                    {cls.courseId?.title && (
                      <div className="text-sm text-muted-foreground">
                        {cls.courseId.title} - {cls.level}
                      </div>
                    )}
                    <div className="text-xs text-muted-foreground mt-1">
                      Students: {cls.studentIds?.length || 0}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        <DialogFooter>
          <Button onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function UsersPage() {
  const { user: currentUser, register } = useAuth();
  const [users, setUsers] = useState<IUser[]>([]);
  const [classes, setClasses] = useState<IClass[]>([]);
  const [students, setStudents] = useState<IUser[]>([]);
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
  const [isAssignmentDialogOpen, setIsAssignmentDialogOpen] = useState(false);
  const [isViewClassesDialogOpen, setIsViewClassesDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<IUser | null>(null);
  const [editingUser, setEditingUser] = useState<IUser | null>(null);
  const [filterName, setFilterName] = useState('');
  const [filterRole, setFilterRole] = useState<string | undefined>(undefined);
  const [filterStatus, setFilterStatus] = useState<string | undefined>(undefined);
  const [filterClassId, setFilterClassId] = useState<string | undefined>(undefined);
  const [filterPromotion, setFilterPromotion] = useState<string | undefined>(undefined);
  const [stats, setStats] = useState<{ total: number; byRole: any; byStatus: any }>({ total: 0, byRole: {}, byStatus: {} });
  const [isLoading, setIsLoading] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0); // Add this state for triggering refreshes
  const [activeTab, setActiveTab] = useState('users'); // Add active tab state
  const filterTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [isViewTeacherClassesDialogOpen, setIsViewTeacherClassesDialogOpen] = useState(false);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { name: '', email: '', role: 'student', status: 'pending', password: '' },
  });

  const assignmentForm = useForm<z.infer<typeof assignmentSchema>>({
    resolver: zodResolver(assignmentSchema),
    defaultValues: { studentId: '', classId: '' },
  });

  // Data fetching and handlers
  useEffect(() => {
    console.log('📊 Users state updated:', {
      totalUsers: users.length,
      students: students.length,
      userWithClasses: users.filter(u => u.classIds && u.classIds.length > 0).length
    });
  }, [users, students]);

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      try {
        if (currentUser?.role !== 'admin') {
          toast({ title: 'Access Denied', description: 'Only admins can access this page.', variant: 'destructive' });
          return;
        }

        // Fix: Don't send "all" values to the backend
        const apiFilters = {
          name: filterName || undefined,
          role: filterRole && filterRole !== 'all' ? filterRole : undefined,
          status: filterStatus && filterStatus !== 'all' ? filterStatus : undefined,
          classId: filterClassId && filterClassId !== 'all' ? filterClassId : undefined,
          promotion: filterPromotion || undefined,
        };

        const [classResult, userResult] = await Promise.all([
          classesApi.getAll({}, currentUser.token),
          usersApi.getAll(apiFilters, currentUser.token),
        ]);
        setClasses(classResult.classes || []);
        setUsers(userResult.users || []);
        setStudents(userResult.users?.filter((user: IUser) => user.role === 'student') || []);
        setStats(userResult.stats || { total: 0, byRole: {}, byStatus: {} });
      } catch (error: any) {
        toast({ title: 'Error', description: error.message || 'Failed to load data.', variant: 'destructive' });
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, [currentUser, refreshTrigger]); 

  useEffect(() => {
    if (filterTimeoutRef.current) clearTimeout(filterTimeoutRef.current);
    filterTimeoutRef.current = setTimeout(async () => {
      try {
        // Fix: Don't send "all" values to the backend
        const apiFilters = {
          name: filterName || undefined,
          role: filterRole && filterRole !== 'all' ? filterRole : undefined,
          status: filterStatus && filterStatus !== 'all' ? filterStatus : undefined,
          classId: filterClassId && filterClassId !== 'all' ? filterClassId : undefined,
          promotion: filterPromotion || undefined,
        };  

        const result = await usersApi.getAll(apiFilters, currentUser?.token);
        setUsers(result.users || []);
        setStudents(result.users?.filter((user: IUser) => user.role === 'student') || []);
        setStats(result.stats || { total: 0, byRole: {}, byStatus: {} });
      } catch (error: any) {
        toast({ title: 'Error', description: error.message || 'Failed to apply filters.', variant: 'destructive' });
      }
    }, 500);
    return () => { if (filterTimeoutRef.current) clearTimeout(filterTimeoutRef.current); };
  }, [filterName, filterRole, filterStatus, filterClassId, filterPromotion, currentUser, refreshTrigger]);

  const handleOpenCreateDialog = () => {
    setEditingUser(null);
    form.reset({ name: '', email: '', role: 'student', status: 'pending', password: '' });
    setIsFormDialogOpen(true);
  };

  const handleOpenEditDialog = (user: IUser) => {
    console.log('📝 Opening edit dialog for user:', user);
    setEditingUser(user);
    
    const formData = {
      name: user.name || '',
      email: user.email || '',
      role: user.role || 'student',
      status: user.status || 'pending',
      password: '', // Always empty for editing
    };
    
    console.log('📋 Setting form data:', formData);
    form.reset(formData);
    
    // Force form validation after reset
    setTimeout(() => {
      form.trigger();
    }, 100);
    
    setIsFormDialogOpen(true);
  };

  const handleOpenAssignmentDialog = (student?: IUser) => {
    assignmentForm.reset({ studentId: '', classId: '' });
    if (student) {
      assignmentForm.setValue('studentId', student._id.toString());
    }
    setIsAssignmentDialogOpen(true);
  };

  const refreshData = async () => {
    try {
      console.log('🔄 Refreshing data...');
      
      // Fix: Use the same filter logic as in useEffect
      const apiFilters = {
        name: filterName || undefined,
        role: filterRole && filterRole !== 'all' ? filterRole : undefined,
        status: filterStatus && filterStatus !== 'all' ? filterStatus : undefined,
        classId: filterClassId && filterClassId !== 'all' ? filterClassId : undefined,
        promotion: filterPromotion || undefined,
      };
      
      const result = await usersApi.getAll(apiFilters, currentUser?.token);
      
      console.log('✅ Data refreshed, updating state...');
      
      // Update all state variables
      setUsers(result.users || []);
      setStudents(result.users?.filter((user: IUser) => user.role === 'student') || []);
      setStats(result.stats || { total: 0, byRole: {}, byStatus: {} });
      
      // Trigger refresh for child components
      setRefreshTrigger(prev => prev + 1);
      
    } catch (error: any) {
      console.error('❌ Refresh data error:', error);
      toast({ 
        title: 'Error', 
        description: error.message || 'Failed to refresh data.', 
        variant: 'destructive' 
      });
    }
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      await usersApi.delete(userId, currentUser?.token);
      await refreshData();
      toast({ title: 'User Deleted', description: 'The user has been successfully deleted.', variant: 'destructive' });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Failed to delete user.', variant: 'destructive' });
    }
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    console.log('🚀 Form submission started');
    console.log('📝 Form values:', values);
    console.log('👤 Editing user:', editingUser);
    console.log('🔍 Form state:', {
      isSubmitting: form.formState.isSubmitting,
      isValid: form.formState.isValid,
      errors: form.formState.errors
    });

    // Check if form is valid
    if (!form.formState.isValid) {
      console.error('❌ Form validation failed:', form.formState.errors);
      toast({ 
        title: 'Validation Error', 
        description: 'Please check all required fields are filled correctly.', 
        variant: 'destructive' 
      });
      return;
    }

    try {
      if (editingUser?._id) {
        console.log('✏️ Updating existing user:', editingUser._id.toString());
        
        // Update existing user with all changed fields
        const updateData = {
          name: values.name,
          email: values.email,
          role: values.role,
          status: values.status,
        };
        
        console.log('📤 Sending update data:', updateData);
        
        const result = await usersApi.update(editingUser._id.toString(), updateData, currentUser?.token);
        
        console.log('✅ Update successful:', result);
        toast({ 
          title: 'User Updated', 
          description: `The user "${values.name}" has been updated successfully.` 
        });
      } else {
        console.log('➕ Creating new user');
        
        // Create new user
        const createData = {
          name: values.name, 
          email: values.email, 
          password: values.password || 'defaultPassword123',
          role: values.role, 
          status: values.status, 
          gender: 'other', 
          nationality: 'Unknown', 
          educationLevel: 'Other',
        };
        
        console.log('📤 Sending create data:', createData);
        
        const result = await register(createData);
        
        console.log('✅ Create successful:', result);
        toast({ 
          title: 'User Created', 
          description: `The user "${values.name}" has been successfully created.` 
        });
      }
      
      console.log('🔄 Refreshing data...');
      await refreshData();
      
      console.log('🚪 Closing dialog...');
      setIsFormDialogOpen(false);
      setEditingUser(null);
      form.reset();
      
      console.log('✅ Form submission completed successfully');
    } catch (error: any) {
      console.error('❌ Form submission error:', error);
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        response: error.response
      });
      
      toast({ 
        title: 'Error', 
        description: error.message || 'Failed to save user. Please try again.', 
        variant: 'destructive' 
      });
    }
  };

  const debugFormState = () => {
    console.log('🔍 Current form state:', {
      values: form.getValues(),
      errors: form.formState.errors,
      isValid: form.formState.isValid,
      isSubmitting: form.formState.isSubmitting,
      isDirty: form.formState.isDirty,
      touchedFields: form.formState.touchedFields,
      dirtyFields: form.formState.dirtyFields
    });
  };

  const onAssignmentSubmit = async (values: z.infer<typeof assignmentSchema>) => {
    try {
      console.log('🔄 Starting class assignment...', values);
      
      if (!currentUser?.id) {
        throw new Error('Admin user not found');
      }

      // Use the new assignment API
      await assignmentsApi.addClasses(
        values.studentId, 
        [values.classId], // Single class to add
        currentUser.id,   // Admin user ID
        currentUser.token
      );
      
      console.log('✅ Assignment successful, refreshing data...');
      toast({ 
        title: 'Class Assigned', 
        description: 'The student has been successfully assigned to the class.' 
      });
      
      // Refresh data - this will now trigger UI updates
      await refreshData();
      
      console.log('✅ Data refreshed, closing dialog...');
      setIsAssignmentDialogOpen(false);
      assignmentForm.reset();
      
    } catch (error: any) {
      console.error('❌ Assignment error:', error);
      toast({ 
        title: 'Error', 
        description: error.message || 'Failed to assign class.', 
        variant: 'destructive' 
      });
    }
  };

  const handleRemoveFromClass = async (userId: string, classId?: string) => {
    try {
      console.log('🗑️ Removing from class:', { userId, classId });
      
      if (classId) {
        // Remove from specific class using new API
        await assignmentsApi.removeClasses(userId, [classId], currentUser?.token);
        toast({ 
          title: 'Class Removed', 
          description: 'The student has been removed from the class.' 
        });
      } else {
        // FIXED: Remove from all classes - use removeClasses with empty array
        await assignmentsApi.removeClasses(userId, [], currentUser?.token);
        toast({ 
          title: 'All Classes Removed', 
          description: 'The student has been removed from all classes.' 
        });
      }
      
      // Refresh data - this will now trigger UI updates
      await refreshData();
      
      // Close the dialog if it's open
      if (isViewClassesDialogOpen) {
        setIsViewClassesDialogOpen(false);
      }
      
    } catch (error: any) {
      console.error('❌ Remove from class error:', error);
      toast({ 
        title: 'Error', 
        description: error.message || 'Failed to remove student from class.', 
        variant: 'destructive' 
      });
    }
  };

  const handleViewClasses = (user: IUser) => {
    setSelectedUser(user);
    setIsViewClassesDialogOpen(true);
  };

  const handleViewTeacherClasses = (user: IUser) => {
    setSelectedUser(user);
    setIsViewTeacherClassesDialogOpen(true);
  };

  if (isLoading) return <div className="flex items-center justify-center py-10"><Loader2 className="animate-spin h-8 w-8" /></div>;
  if (currentUser?.role !== 'admin') return <div className="flex items-center justify-center h-full"><p className="text-muted-foreground">You do not have permission to access this page.</p></div>;

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-3xl font-bold font-headline tracking-tight">Manage Users</h2>
          <p className="text-muted-foreground">View, add, and manage user accounts and permissions.</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleOpenCreateDialog}><PlusCircle className="mr-2 h-4 w-4" />Add User</Button>
          {/* REMOVED: Duplicate Assign Student to Class button - keeping only the one in Student Assignments tab */}
        </div>
      </div>

      <Tabs defaultValue="users" className="w-full" onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="users">All Users</TabsTrigger>
          <TabsTrigger value="assignments">Student Assignments</TabsTrigger>
        </TabsList>
        
        <TabsContent value="users" className="space-y-6">
          {/* Filters */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Input placeholder="Filter by name or email..." value={filterName} onChange={(e) => setFilterName(e.target.value)} className="max-w-sm" />
            <Select value={filterRole} onValueChange={setFilterRole}>
              <SelectTrigger><SelectValue placeholder="Filter by role" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="student">Student</SelectItem>
                <SelectItem value="teacher">Teacher</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger><SelectValue placeholder="Filter by status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="banned">Banned</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterClassId} onValueChange={setFilterClassId}>
              <SelectTrigger><SelectValue placeholder="Filter by class" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Classes</SelectItem>
                {classes.map((cls) => (
                  <SelectItem key={cls._id} value={cls._id}>{cls.name} ({cls.courseId?.title} - {cls.level})</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 bg-muted rounded-lg"><p className="text-sm text-muted-foreground">Total Users</p><p className="text-2xl font-bold">{stats.total}</p></div>
            <div className="p-4 bg-muted rounded-lg"><p className="text-sm text-muted-foreground">Students</p><p className="text-2xl font-bold">{stats.byRole.student || 0}</p></div>
            <div className="p-4 bg-muted rounded-lg"><p className="text-sm text-muted-foreground">Teachers</p><p className="text-2xl font-bold">{stats.byRole.teacher || 0}</p></div>
            <div className="p-4 bg-muted rounded-lg"><p className="text-sm text-muted-foreground">Banned</p><p className="text-2xl font-bold">{stats.byStatus.banned || 0}</p></div>
          </div>

          {/* Users Table */}
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Assigned Class</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user._id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar>
                          {user.avatarUrl && user.avatarUrl !== '' ? (
                            <AvatarImage src={user.avatarUrl} alt={user.name} />
                          ) : (
                            <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                          )}
                        </Avatar>
                        <div>
                          <div className="font-medium">{user.name}</div>
                          <div className="text-sm text-muted-foreground">{user.email}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell><Badge variant={roleVariant[user.role]} className="capitalize">{user.role}</Badge></TableCell>
                    <TableCell><Badge variant={user.status === 'active' ? 'default' : 'outline'} className="capitalize">{user.status || 'pending'}</Badge></TableCell>
                    <TableCell>
                      {user.role === 'student' ? (
                        <StudentAssignedClassesCell 
                          user={user} 
                          refreshTrigger={refreshTrigger} 
                        />
                      ) : user.role === 'teacher' ? (
                        <TeacherAssignedClassesCell 
                          user={user} 
                          refreshTrigger={refreshTrigger} 
                        />
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
                          <DropdownMenuLabel>User Actions</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => handleOpenEditDialog(user)}>
                            <Edit className="mr-2 h-4 w-4" />Edit Profile
                          </DropdownMenuItem>
                          
                          {/* Only show View Classes for students in All Users tab */}
                          {(user.role === 'student' || user.role === 'teacher') && (
                            <DropdownMenuItem onClick={() => user.role === 'student' ? handleViewClasses(user) : handleViewTeacherClasses(user)}>
                              <Users className="mr-2 h-4 w-4" />View Classes
                            </DropdownMenuItem>
                          )}
                          
                          <DropdownMenuSeparator />
                          
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive">
                                <Trash2 className="mr-2 h-4 w-4" />Delete User
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
                                <AlertDialogAction onClick={() => handleDeleteUser(user._id.toString())}>
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="assignments" className="space-y-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h3 className="text-xl font-semibold">Student Class Assignments</h3>
              <p className="text-muted-foreground">Manage student assignments to classes.</p>
            </div>
            <Button onClick={() => handleOpenAssignmentDialog()}><PlusCircle className="mr-2 h-4 w-4" />Assign Student to Class</Button>
          </div>

          {/* ADDED: Search bar for Student Assignments */}
          <div className="flex gap-4">
            <Input 
              placeholder="Search students by name or email..." 
              value={filterName}
              onChange={(e) => setFilterName(e.target.value)}
              className="max-w-sm"
            />
          </div>

          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Assigned Classes</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {students.map((student) => (
                  <TableRow key={student._id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar>
                          {student.avatarUrl && student.avatarUrl !== '' ? (
                            <AvatarImage src={student.avatarUrl} alt={student.name} />
                          ) : (
                            <AvatarFallback>{student.name.charAt(0)}</AvatarFallback>
                          )}
                        </Avatar>
                        <div className="font-medium">{student.name}</div>
                      </div>
                    </TableCell>
                    <TableCell>{student.email}</TableCell>
                    <TableCell>
                      <Badge variant={student.status === 'active' ? 'default' : 'outline'} className="capitalize">
                        {student.status || 'pending'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <StudentAssignedClassesCell 
                        user={student} 
                        refreshTrigger={refreshTrigger} 
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Assignment Actions</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => handleViewClasses(student)}>
                            <Users className="mr-2 h-4 w-4" />View Classes
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleOpenAssignmentDialog(student)}>
                            <PlusCircle className="mr-2 h-4 w-4" />Assign Class
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive">
                                <Trash2 className="mr-2 h-4 w-4" />Remove All Classes
                              </DropdownMenuItem>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Remove from all classes?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to remove <span className="font-semibold">{student.name}</span> from all classes?
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleRemoveFromClass(student._id.toString())}>
                                  Remove All
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>

      {/* User Creation/Edit Dialog */}
      <Dialog open={isFormDialogOpen} onOpenChange={setIsFormDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <DialogHeader>
                <DialogTitle>{editingUser ? 'Edit User' : 'Create a new user'}</DialogTitle>
                <DialogDescription>
                  {editingUser ? 'Update the details for this user.' : 'Fill in the details below to create a new user. Users will be created independently without class assignments.'}
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <FormField control={form.control} name="name" render={({ field }) => (
                  <FormItem><FormLabel>Full Name</FormLabel><FormControl><Input placeholder="John Doe" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="email" render={({ field }) => (
                  <FormItem><FormLabel>Email</FormLabel><FormControl><Input type="email" placeholder="name@example.com" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                {!editingUser && (
                  <FormField control={form.control} name="password" render={({ field }) => (
                    <FormItem><FormLabel>Password</FormLabel><FormControl><Input type="password" placeholder="••••••••" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                )}
                <FormField control={form.control} name="role" render={({ field }) => (
                  <FormItem><FormLabel>Role</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Select a role" /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="student">Student</SelectItem>
                        <SelectItem value="teacher">Teacher</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select><FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="status" render={({ field }) => (
                  <FormItem><FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Select a status" /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="banned">Banned</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                      </SelectContent>
                    </Select><FormMessage />
                  </FormItem>
                )} />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsFormDialogOpen(false)}>Cancel</Button>
                <Button 
                  type="submit" 
                  disabled={form.formState.isSubmitting}
                  onClick={(e) => {
                    console.log('🖱️ Save Changes button clicked');
                    debugFormState();
                  }}
                  >
                  {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {editingUser ? 'Save Changes' : 'Create User'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Student-Class Assignment Dialog */}
      <Dialog open={isAssignmentDialogOpen} onOpenChange={setIsAssignmentDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <Form {...assignmentForm}>
            <form onSubmit={assignmentForm.handleSubmit(onAssignmentSubmit)} className="space-y-8">
              <DialogHeader>
                <DialogTitle>Assign Student to Class</DialogTitle>
                <DialogDescription>Select a student and class to create the assignment.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <FormField control={assignmentForm.control} name="studentId" render={({ field }) => (
                  <FormItem><FormLabel>Student</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Select a student" /></SelectTrigger></FormControl>
                      <SelectContent>
                        {students.map((student) => (
                          <SelectItem key={student._id} value={student._id.toString()}>{student.name} ({student.email})</SelectItem>
                        ))}
                      </SelectContent>
                    </Select><FormMessage />
                  </FormItem>
                )} />
                <FormField control={assignmentForm.control} name="classId" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Class</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      value={field.value}
                      disabled={!assignmentForm.watch('studentId')}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a class" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <AvailableClassesSelect 
                          studentId={assignmentForm.watch('studentId')} 
                          currentUser={currentUser}
                        />
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsAssignmentDialogOpen(false)}>Cancel</Button>
                <Button 
                  type="submit" 
                  disabled={assignmentForm.formState.isSubmitting || !assignmentForm.watch('studentId') || !assignmentForm.watch('classId')}
                >
                  {assignmentForm.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Assign Student
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* View Classes Dialog */}
      {selectedUser && (
        <ViewClassesDialog
          user={selectedUser}
          isOpen={isViewClassesDialogOpen}
          onClose={() => {
            setIsViewClassesDialogOpen(false);
            setSelectedUser(null);
          }}
          onRemoveFromClass={handleRemoveFromClass}
        />
      )}
      {selectedUser && (
        <ViewTeacherClassesDialog
          user={selectedUser}
          isOpen={isViewTeacherClassesDialogOpen}
          onClose={() => {
            setIsViewTeacherClassesDialogOpen(false);
            setSelectedUser(null);
          }}
        />
      )}
    </div>
  );
}

const roleVariant: Record<string, 'default' | 'secondary' | 'outline'> = {
  admin: 'default',
  teacher: 'secondary',
  student: 'outline',
};