
'use client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MOCK_USERS } from "@/lib/mock-data";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import type { User } from "@/lib/types";
import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";


// In a real app, this would come from an auth context. For now, we simulate it.
// We'll use the admin user as the default for demonstration.
const currentUserId = 'user-admin'; 
const allUsers = MOCK_USERS;


const profileFormSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  email: z.string().email(), // Will be read-only
  avatarUrl: z.string().url().optional(),
});


export default function ProfilePage() {
    // In a real app, you would fetch the user or get it from a context.
    // Here we're finding it in the mock data and managing its state locally.
    const [user, setUser] = useState<User>(allUsers[currentUserId]);

    const { toast } = useToast();

    const form = useForm<z.infer<typeof profileFormSchema>>({
        resolver: zodResolver(profileFormSchema),
        defaultValues: {
            name: user.name,
            email: user.email,
            avatarUrl: user.avatarUrl || '',
        },
    });

    function onSubmit(values: z.infer<typeof profileFormSchema>) {
        form.handleSubmit(() => {
            // Simulate an API call to update the user profile
             setTimeout(() => {
                const updatedUser = { ...user, name: values.name, avatarUrl: values.avatarUrl };
                
                // Update the user in our mock state
                setUser(updatedUser);
                
                // In a real app, this mock data update wouldn't be necessary
                // as data would be re-fetched or the cache updated.
                MOCK_USERS[currentUserId] = updatedUser;

                toast({
                    title: "Profile Updated",
                    description: "Your profile information has been successfully saved.",
                });
                form.reset(values); // Reset form to new values and clear dirty state
            }, 500);
        })()
    }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold font-headline tracking-tight">
          My Profile
        </h2>
        <p className="text-muted-foreground">
          View and update your personal information.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Profile Details</CardTitle>
          <CardDescription>Manage your account settings below.</CardDescription>
        </CardHeader>
        <CardContent>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                    <div className="flex items-center gap-4">
                        <Avatar className="h-20 w-20">
                            <AvatarImage src={form.watch('avatarUrl')} alt={user.name} />
                            <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <FormField control={form.control} name="avatarUrl" render={({ field }) => (
                            <FormItem className="flex-1">
                                <FormLabel>Avatar URL</FormLabel>
                                <FormControl><Input placeholder="https://..." {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )}/>
                    </div>

                    <FormField control={form.control} name="name" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Full Name</FormLabel>
                            <FormControl><Input {...field} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )}/>

                     <FormField control={form.control} name="email" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Email Address</FormLabel>
                            <FormControl><Input {...field} readOnly className="focus-visible:ring-0 focus-visible:ring-offset-0 bg-muted cursor-not-allowed" /></FormControl>
                            <FormDescription>Your email address cannot be changed.</FormDescription>
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
    </div>
  );
}

