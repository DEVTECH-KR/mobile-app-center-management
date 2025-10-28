// src/app/dashboard/courses/[id]/installments/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Loader2, ArrowLeft, Calculator, Calendar, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { useForm, useFieldArray } from "react-hook-form";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { coursesApi } from '@/lib/api/courses.api';

const formSchema = z.object({
  installments: z.array(z.object({
    name: z.string().min(1, "Name is required"),
    amountType: z.enum(['fixed', 'percentage']),
    amount: z.number().min(0, "Amount must be positive"),
    dueOffsetDays: z.number().min(0, "Due offset must be positive"),
  })).refine(
    (installments) => {
      const percentageInstallments = installments.filter(inst => inst.amountType === 'percentage');
      const totalPercentage = percentageInstallments.reduce((sum, inst) => sum + inst.amount, 0);
      return totalPercentage <= 100;
    },
    {
      message: "Total percentage cannot exceed 100%",
      path: ["installments"],
    }
  ),
});

interface CourseDetails {
  _id: string;
  title: string;
  price: number;
  levels: string[];
}

export default function InstallmentTemplatesPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.id as string;
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [course, setCourse] = useState<CourseDetails | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      installments: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "installments"
  });

  const watchInstallments = form.watch("installments");

  useEffect(() => {
    fetchCourseAndTemplates();
  }, [courseId]);

  const fetchCourseAndTemplates = async () => {
    setIsLoading(true);
    try {
      // Fetch course details
      const courseData = await coursesApi.getById(courseId);
      setCourse(courseData);

      // Fetch templates
      const response = await fetch(`/api/installment-templates/${courseId}`);
      if (!response.ok) {
        if (response.status === 404) {
          form.reset({ installments: [] });
          return;
        }
        throw new Error();
      }
      const templateData = await response.json();
      form.reset(templateData);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load course and templates",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const calculateInstallmentAmount = (installment: any) => {
    if (!course) return 0;
    if (installment.amountType === 'fixed') {
      return installment.amount;
    } else {
      return (course.price * installment.amount) / 100;
    }
  };

  const getTotalAmount = () => {
    if (!course) return 0;
    return watchInstallments.reduce((total, inst) => {
      return total + calculateInstallmentAmount(inst);
    }, 0);
  };

  const getTotalPercentage = () => {
    const percentageInstallments = watchInstallments.filter(inst => inst.amountType === 'percentage');
    return percentageInstallments.reduce((sum, inst) => sum + inst.amount, 0);
  };

  const handleSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/installment-templates/${courseId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update templates');
      }
      
      toast({
        title: "Success",
        description: "Payment templates updated successfully",
      });
      
      // Redirect back to templates overview
      router.push('/dashboard/payment-templates');
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to update templates",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const addDefaultTemplate = () => {
    form.setValue('installments', [
      { name: 'Registration Fee', amountType: 'fixed', amount: 0, dueOffsetDays: 2 },
      { name: 'Installment 1', amountType: 'percentage', amount: 25, dueOffsetDays: 30 },
      { name: 'Installment 2', amountType: 'percentage', amount: 25, dueOffsetDays: 60 },
      { name: 'Installment 3', amountType: 'percentage', amount: 25, dueOffsetDays: 90 },
      { name: 'Installment 4', amountType: 'percentage', amount: 25, dueOffsetDays: 120 },
    ]);
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => router.push('/dashboard/payment-templates')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Templates
          </Button>
          <div>
            <h2 className="text-2xl font-bold">Payment Templates</h2>
            <p className="text-muted-foreground">
              {course ? `Configure installments for ${course.title}` : 'Loading...'}
            </p>
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" onClick={addDefaultTemplate}>
            Use Default Template
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Template Form */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Installment Configuration</CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
                  {fields.map((field, index) => (
                    <div key={field.id} className="grid grid-cols-1 md:grid-cols-5 gap-4 p-4 border rounded-lg">
                      <FormField
                        control={form.control}
                        name={`installments.${index}.name`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Name</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g., Registration Fee" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`installments.${index}.amountType`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Type</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select type" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="fixed">Fixed Amount</SelectItem>
                                <SelectItem value="percentage">Percentage</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`installments.${index}.amount`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              Amount
                              {watchInstallments[index]?.amountType === 'percentage' ? ' (%)' : ' (FBU)'}
                            </FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                {...field} 
                                onChange={e => field.onChange(Number(e.target.value))}
                                min={0}
                                step={watchInstallments[index]?.amountType === 'percentage' ? 1 : 1000}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`installments.${index}.dueOffsetDays`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Due In (days)</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                {...field} 
                                onChange={e => field.onChange(Number(e.target.value))}
                                min={0}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="flex items-end">
                        <Button 
                          type="button" 
                          variant="destructive" 
                          onClick={() => remove(index)}
                          className="w-full"
                        >
                          Remove
                        </Button>
                      </div>

                      {/* Calculated Amount Display */}
                      {course && (
                        <div className="md:col-span-5 text-sm text-muted-foreground">
                          <Calculator className="h-4 w-4 inline mr-1" />
                          Calculated amount: {calculateInstallmentAmount(watchInstallments[index]).toLocaleString()} FBU
                        </div>
                      )}
                    </div>
                  ))}

                  <div className="flex gap-2">
                    <Button 
                      type="button" 
                      onClick={() => append({ name: '', amountType: 'fixed', amount: 0, dueOffsetDays: 0 })}
                      variant="outline"
                    >
                      Add Installment
                    </Button>
                    
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Save Templates
                    </Button>
                  </div>

                  {form.formState.errors.installments && (
                    <div className="text-sm text-destructive">
                      {form.formState.errors.installments.message}
                    </div>
                  )}
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>

        {/* Summary Sidebar */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {course && (
                <>
                  <div>
                    <h4 className="font-semibold mb-2">Course Information</h4>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span>Course:</span>
                        <span className="font-medium">{course.title}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Price:</span>
                        <span className="font-medium">{course.price.toLocaleString()} FBU</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Levels:</span>
                        <span className="font-medium">{course.levels.join(', ')}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">Template Summary</h4>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span>Total Installments:</span>
                        <span className="font-medium">{fields.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Total Percentage:</span>
                        <span className="font-medium">{getTotalPercentage()}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Total Amount:</span>
                        <span className="font-medium">{getTotalAmount().toLocaleString()} FBU</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Difference:</span>
                        <Badge variant={
                          Math.abs(getTotalAmount() - course.price) < 1 ? "default" : "destructive"
                        }>
                          {Math.abs(getTotalAmount() - course.price).toLocaleString()} FBU
                        </Badge>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* Preview of Installments */}
              {watchInstallments.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2">Installment Preview</h4>
                  <div className="space-y-2 text-sm">
                    {watchInstallments.map((inst, index) => (
                      <div key={index} className="flex justify-between items-center p-2 border rounded">
                        <div>
                          <div className="font-medium">{inst.name}</div>
                          <div className="text-muted-foreground">
                            Due in {inst.dueOffsetDays} days
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">
                            {inst.amountType === 'percentage' ? `${inst.amount}%` : `${inst.amount.toLocaleString()} FBU`}
                          </div>
                          {course && (
                            <div className="text-muted-foreground">
                              {calculateInstallmentAmount(inst).toLocaleString()} FBU
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}