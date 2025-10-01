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
import { Loader2, Monitor, Moon, Sun, Globe } from "lucide-react";
import { useTheme } from "next-themes";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useAuth } from "@/lib/auth";
import { useEffect, useState } from "react";

const formSchema = z.object({
  mission: z.string().min(10, { message: "Mission statement is required." }),
  schedule: z.string().min(1, { message: "Schedule information is required." }),
  registrationFee: z.coerce.number().min(0, { message: "Fee must be a positive number." }),
});

export default function SettingsPage() {
  const { user, setAuthUser } = useAuth();
  const { theme, setTheme } = useTheme();
  const [language, setLanguage] = useState<"fr" | "en">("fr");
  const { toast } = useToast();

  const isAdmin = user?.role === "admin";

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {},
  });

  // Init language from user preferences
  useEffect(() => {
    if (user?.preferences?.language) {
      setLanguage(user.preferences.language);
    }
  }, [user]);

  // Helper pour update theme ou language dans la DB et context
  const updatePreference = async (key: "theme" | "language", value: string) => {
    if (!user) return;
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("No token found");

      const res = await fetch(`/api/users/${user.id}/preferences`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({ [key]: value }),
      });

      if (!res.ok) throw new Error("Failed to update preferences");

      // Update contexte local
      setAuthUser({
        ...user,
        preferences: { ...user.preferences, [key]: value },
      });

      if (key === "theme") setTheme(value as "light" | "dark" | "system");

    } catch (err) {
      console.error(`Error updating ${key}:`, err);
      toast({
        title: "Error",
        description: `Failed to update ${key}.`,
      });
    }
  };

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    form.handleSubmit(() => {
      setTimeout(() => {
        console.log("Updated Center Info:", values);
        toast({
          title: "Settings Saved",
          description: "The center information has been successfully updated.",
        });
        form.reset(values);
      }, 500);
    })();
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold font-headline tracking-tight">
          {isAdmin ? "Center Information" : "User Settings"}
        </h2>
        <p className="text-muted-foreground">
          {isAdmin
            ? "Manage general information about the training center."
            : "Customize your personal preferences."}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {isAdmin && (
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>General Settings</CardTitle>
              <CardDescription>
                Update mission statement, schedule, and fees.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="mission"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Mission Statement</FormLabel>
                        <FormControl>
                          <Textarea rows={5} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="schedule"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Schedule</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="registrationFee"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Registration Fee (FBU)</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

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
        )}

        {/* Appearance & Language */}
        <Card>
          <CardHeader>
            <CardTitle>Appearance & Language</CardTitle>
            <CardDescription>
              Customize the look and feel of the dashboard and language.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Theme */}
              <RadioGroup value={theme} onValueChange={(val) => updatePreference("theme", val)} className="space-y-2">
                <Label>Theme</Label>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="light" id="light" />
                  <Label htmlFor="light" className="flex items-center gap-2">
                    <Sun className="h-4 w-4" /> Light
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="dark" id="dark" />
                  <Label htmlFor="dark" className="flex items-center gap-2">
                    <Moon className="h-4 w-4" /> Dark
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="system" id="system" />
                  <Label htmlFor="system" className="flex items-center gap-2">
                    <Monitor className="h-4 w-4" /> System
                  </Label>
                </div>
              </RadioGroup>

              {/* Language */}
              <RadioGroup value={language} onValueChange={(val) => { setLanguage(val as "fr"|"en"); updatePreference("language", val); }} className="space-y-2">
                <Label>Language</Label>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="fr" id="fr" />
                  <Label htmlFor="fr" className="flex items-center gap-2">
                    <Globe className="h-4 w-4" /> French
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="en" id="en" />
                  <Label htmlFor="en" className="flex items-center gap-2">
                    <Globe className="h-4 w-4" /> English
                  </Label>
                </div>
              </RadioGroup>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
