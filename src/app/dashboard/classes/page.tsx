
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
import { BookMarked, MoreVertical, PlusCircle, Search, Users } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import type { Course } from "@/lib/types";


// In a real app, this would come from an auth context
const currentUser = MOCK_USERS.admin;
const allCourses = MOCK_COURSES;
const allTeachers = Object.values(MOCK_USERS).filter(u => u.role === 'teacher');

export default function ClassesPage() {
    const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);

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
            Manage Classes
            </h2>
            <p className="text-muted-foreground">
                Create new classes, assign teachers, and view student enrollments.
            </p>
        </div>
        <Dialog>
            <DialogTrigger asChild>
                <Button>
                    <PlusCircle className="mr-2 h-4 w-4"/>
                    Create Class
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                <DialogTitle>Create a new class</DialogTitle>
                <DialogDescription>
                    Fill in the details below to create a new class.
                </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="course" className="text-right">Course</Label>
                        <Select onValueChange={(value) => setSelectedCourse(allCourses.find(c => c.id === value) || null)}>
                            <SelectTrigger className="col-span-3">
                                <SelectValue placeholder="Select a course" />
                            </SelectTrigger>
                            <SelectContent>
                                {allCourses.map(course => <SelectItem key={course.id} value={course.id}>{course.title}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                    {selectedCourse && selectedCourse.levels && (
                         <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="level" className="text-right">Level</Label>
                            <Select>
                                <SelectTrigger className="col-span-3">
                                    <SelectValue placeholder="Select a level" />
                                </SelectTrigger>
                                <SelectContent>
                                    {selectedCourse.levels.map(level => <SelectItem key={level} value={level}>{level}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                    )}
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="name" className="text-right">
                        Class Name
                        </Label>
                        <Input id="name" placeholder="e.g. Room A" className="col-span-3" />
                    </div>
                </div>
                <DialogFooter>
                    <Button type="submit">Create Class</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
      </div>
      
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Class</TableHead>
              <TableHead>Course</TableHead>
              <TableHead>Teacher</TableHead>
              <TableHead>Students</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {MOCK_CLASSES.map((cls) => {
              const course = MOCK_COURSES.find(c => c.id === cls.courseId);
              const teacher = MOCK_USERS[cls.teacherId || ''] || null;
              const students = cls.studentIds.map(id => Object.values(MOCK_USERS).find(u => u.id === id));
              return(
              <TableRow key={cls.id}>
                <TableCell>
                  <div className="font-medium">{cls.name}</div>
                  <div className="text-sm text-muted-foreground">{cls.level}</div>
                </TableCell>
                <TableCell>{course?.title}</TableCell>
                <TableCell>
                    {teacher ? (
                         <Badge variant="secondary">{teacher.name}</Badge>
                    ) : (
                        <Badge variant="outline">Unassigned</Badge>
                    )}
                </TableCell>
                 <TableCell>
                    <div className="flex items-center gap-1">
                        <Users className="h-4 w-4 text-muted-foreground"/>
                        {cls.studentIds.length}
                    </div>
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
                        <DropdownMenuItem>Edit Class</DropdownMenuItem>
                        <DropdownMenuItem>View Students</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive">Delete Class</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            )})}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
