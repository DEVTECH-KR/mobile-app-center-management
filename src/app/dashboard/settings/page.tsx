// src/app/dashboard/settings/page.tsx
'use client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useAuth } from "@/lib/auth";

const formSchema = z.object({
  mission: z.string().min(10, { message: "Mission statement is required." }),
  schedule: z.string().min(1, { message: "Schedule information is required." }),
  registrationFee: z.coerce.number().min(0, { message: "Fee must be a positive number." }),
});

export default function SettingsPage() {
    const { user } = useAuth();
    const { toast } = useToast();
    const { setTheme, theme } = useTheme();

    if (!user || user.role !== 'admin') {
        return (
            <div className="flex items-center justify-center h-full">
                <p className="text-muted-foreground">You do not have permission to access this page.</p>
            </div>
        )
    }

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {}, // Fetch real center info
    });

    function onSubmit(values: z.infer<typeof formSchema>) {
        form.handleSubmit(() => {
            // Simulate API call to save settings
             setTimeout(() => {
                // In a real app, you'd update this in your database.
                // For now, we'll just show a toast.
                console.log("Updated Center Info:", values);
                toast({
                    title: "Settings Saved",
                    description: "The center information has been successfully updated.",
                });
                form.reset(values); // Resets form state to show it's no longer dirty
            }, 500);
        })()
    }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold font-headline tracking-tight">
          Center Information
        </h2>
        <p className="text-muted-foreground">
          Manage general information about the training center.
        </p>
      </div>

       <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
            <CardHeader>
            <CardTitle>General Settings</CardTitle>
            <CardDescription>Update mission statement, schedule, and fees.</CardDescription>
            </CardHeader>
            <CardContent>
            <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <FormField control={form.control} name="mission" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Mission Statement</FormLabel>
                                <FormControl><Textarea rows={5} {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )}/>
                        <FormField control={form.control} name="schedule" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Schedule</FormLabel>
                                <FormControl><Input {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )}/>
                        <FormField control={form.control} name="registrationFee" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Registration Fee (FBU)</FormLabel>
                                <FormControl><Input type="number" {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )}/>
                        
                        <div className="flex justify-end">
                            <Button type="submit" disabled={form.formState.isSubmitting || !form.formState.isDirty}>
                                {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Save Changes
                            </Button>
                        </div>
                    </form>
            </Form>
            </CardContent>
        </Card>

        <Card>
            <CardHeader>
                <CardTitle>Appearance</CardTitle>
                <CardDescription>Customize the look and feel of the dashboard.</CardDescription>
            </CardHeader>
            <CardContent>
                <RadioGroup value={theme} onValueChange={setTheme} className="space-y-2">
                    <Label>Theme</Label>
                    <div className="flex items-center space-x-2">
                        <RadioGroupItem value="light" id="light" />
                        <Label htmlFor="light" className="flex items-center gap-2">
                            <Sun className="h-4 w-4"/> Light
                        </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                        <RadioGroupItem value="dark" id="dark" />
                        <Label htmlFor="dark" className="flex items-center gap-2">
                            <Moon className="h-4 w-4"/> Dark
                        </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                        <RadioGroupItem value="system" id="system" />
                        <Label htmlFor="system" className="flex items-center gap-2">
                            <Monitor className="h-4 w-4"/> System
                        </Label>
                    </div>
                </RadioGroup>
            </CardContent>
        </Card>
      </div>
    </div>
  );
}

