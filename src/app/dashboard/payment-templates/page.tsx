// src/app/dashboard/payment-templates/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, FileText, Edit, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { coursesApi } from '@/lib/api/courses.api';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface CourseWithTemplates {
  _id: string;
  title: string;
  price: number;
  imageUrl?: string;
  levels: string[];
  installments?: {
    name: string;
    amountType: 'fixed' | 'percentage';
    amount: number;
    dueOffsetDays: number;
  }[];
  hasTemplate: boolean;
}

export default function PaymentTemplatesPage() {
  const [courses, setCourses] = useState<CourseWithTemplates[]>([]);
  const [filteredCourses, setFilteredCourses] = useState<CourseWithTemplates[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    fetchCoursesWithTemplates();
  }, []);

  useEffect(() => {
    const filtered = courses.filter(course =>
      course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.levels.some(level => level.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    setFilteredCourses(filtered);
  }, [searchTerm, courses]);

  const fetchCoursesWithTemplates = async () => {
    setIsLoading(true);
    try {
      // Récupérer tous les cours
      const coursesResult = await coursesApi.getAll();
      const coursesData = coursesResult.courses || [];

      // Pour chaque cours, vérifier s'il a un template
      const coursesWithTemplates = await Promise.all(
        coursesData.map(async (course: any) => {
          try {
            const templateResponse = await fetch(`/api/installment-templates/${course._id}`);
            if (templateResponse.ok) {
              const templateData = await templateResponse.json();
              return {
                ...course,
                installments: templateData.installments || [],
                hasTemplate: templateData.installments && templateData.installments.length > 0
              };
            }
            return {
              ...course,
              installments: [],
              hasTemplate: false
            };
          } catch {
            return {
              ...course,
              installments: [],
              hasTemplate: false
            };
          }
        })
      );

      setCourses(coursesWithTemplates);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load courses and templates",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getInstallmentCount = (course: CourseWithTemplates) => {
    return course.installments?.length || 0;
  };

  const getTotalPercentage = (course: CourseWithTemplates) => {
    if (!course.installments?.length) return 0;
    
    const percentageInstallments = course.installments.filter(
      inst => inst.amountType === 'percentage'
    );
    
    const totalPercentage = percentageInstallments.reduce(
      (sum, inst) => sum + inst.amount, 0
    );
    
    return totalPercentage;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin h-8 w-8" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold font-headline tracking-tight">
            Payment Templates
          </h2>
          <p className="text-muted-foreground">
            Manage installment payment templates for all courses
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/courses">
            <Plus className="mr-2 h-4 w-4" />
            Create New Course
          </Link>
        </Button>
      </div>

      {/* Search and Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <div className="md:col-span-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search courses by title or level..."
              className="pl-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold">{courses.length}</div>
              <div className="text-sm text-muted-foreground">Total Courses</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Courses Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredCourses.map((course) => (
          <Card key={course._id} className="relative">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={course.imageUrl} />
                    <AvatarFallback>{course.title.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="text-lg leading-tight">
                      {course.title}
                    </CardTitle>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {course.levels.slice(0, 2).map((level) => (
                        <Badge key={level} variant="secondary" className="text-xs">
                          {level}
                        </Badge>
                      ))}
                      {course.levels.length > 2 && (
                        <Badge variant="outline" className="text-xs">
                          +{course.levels.length - 2}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
                <Badge variant={course.hasTemplate ? "default" : "outline"}>
                  {course.hasTemplate ? "Configured" : "No Template"}
                </Badge>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-3">
              {/* Template Summary */}
              {course.hasTemplate ? (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Installments:</span>
                    <span className="font-medium">{getInstallmentCount(course)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Total %:</span>
                    <span className="font-medium">{getTotalPercentage(course)}%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Course Price:</span>
                    <span className="font-medium">{course.price.toLocaleString()} FBU</span>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4">
                  <FileText className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No payment template configured</p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-2">
                <Button asChild variant={course.hasTemplate ? "outline" : "default"} className="flex-1">
                  <Link href={`/dashboard/courses/${course._id}/installments`}>
                    <Edit className="mr-2 h-4 w-4" />
                    {course.hasTemplate ? "Edit Template" : "Create Template"}
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredCourses.length === 0 && (
        <div className="text-center py-12">
          <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No courses found</h3>
          <p className="text-muted-foreground mb-4">
            {searchTerm ? 'Try adjusting your search terms' : 'Create your first course to get started'}
          </p>
          <Button asChild>
            <Link href="/dashboard/courses">
              <Plus className="mr-2 h-4 w-4" />
              Create Course
            </Link>
          </Button>
        </div>
      )}
    </div>
  );
}