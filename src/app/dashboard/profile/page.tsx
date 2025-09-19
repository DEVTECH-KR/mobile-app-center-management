
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
import { FileUp, Loader2, X } from "lucide-react";
import type { User } from "@/lib/types";
import { useState, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Image from "next/image";

// In a real app, this would come from an auth context. For now, we simulate it.
const currentUserKey = 'student'; 
const allUsers = MOCK_USERS;


const profileFormSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  email: z.string().email(), // Will be read-only
  avatarUrl: z.string().url().optional().nullable(),
  gender: z.enum(["male", "female", "other"]).optional(),
  nationality: z.string().optional(),
  otherNationality: z.string().optional(),
  educationLevel: z.string().optional(),
  university: z.string().optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
}).refine(data => data.nationality !== 'other' || (data.nationality === 'other' && data.otherNationality && data.otherNationality.length > 1), {
    message: "Please specify your nationality.",
    path: ["otherNationality"],
});

const passwordFormSchema = z.object({
    currentPassword: z.string().min(6, { message: "Current password is required." }),
    newPassword: z.string().min(6, { message: "New password must be at least 6 characters." }),
    confirmPassword: z.string()
}).refine(data => data.newPassword === data.confirmPassword, {
    message: "New passwords do not match.",
    path: ["confirmPassword"],
});


export default function ProfilePage() {
    const [user, setUser] = useState<User | undefined>(undefined);
    const [imagePreview, setImagePreview] = useState<string | null>(null);

    useEffect(() => {
        const currentUser = allUsers[currentUserKey];
        if (currentUser) {
            setUser(currentUser);
            setImagePreview(currentUser.avatarUrl || null);
        }
    }, []);

    const { toast } = useToast();

    const form = useForm<z.infer<typeof profileFormSchema>>({
        resolver: zodResolver(profileFormSchema),
        values: user ? {
            name: user.name,
            email: user.email,
            avatarUrl: user.avatarUrl ?? null,
            gender: user.gender,
            nationality: user.nationality,
            otherNationality: user.otherNationality,
            educationLevel: user.educationLevel,
            university: user.university,
            address: user.address,
            phone: user.phone,
        } : {},
    });
    
    const passwordForm = useForm<z.infer<typeof passwordFormSchema>>({
        resolver: zodResolver(passwordFormSchema),
        defaultValues: {
            currentPassword: "",
            newPassword: "",
            confirmPassword: ""
        }
    });

    const nationality = form.watch("nationality");

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const result = reader.result as string;
                setImagePreview(result);
                form.setValue('avatarUrl', result, { shouldValidate: true });
            };
            reader.readAsDataURL(file);
        }
    };

    const removeImage = () => {
        setImagePreview(null);
        form.setValue('avatarUrl', null, { shouldValidate: true });
    };

    function onProfileSubmit(values: z.infer<typeof profileFormSchema>) {
        // Simulate an API call to update the user profile
         setTimeout(() => {
            if (!user) return;
            const updatedUser = { ...user, ...values } as User;
            setUser(updatedUser);
            // This is a mock update, in a real app this would be a DB call
            const userKey = Object.keys(MOCK_USERS).find(key => MOCK_USERS[key].id === user.id);
            if(userKey) {
                MOCK_USERS[userKey] = updatedUser;
            }


            toast({
                title: "Profile Updated",
                description: "Your profile information has been successfully saved.",
            });
            form.reset(values);
        }, 500);
    }
    
     function onPasswordSubmit(values: z.infer<typeof passwordFormSchema>) {
        // Simulate an API call to change password
        setTimeout(() => {
            // In a real app, you'd verify the current password on the backend
            console.log("Password change requested:", values);
            toast({
                title: "Password Updated",
                description: "Your password has been successfully changed.",
            });
            passwordForm.reset();
        }, 500);
    }

    if (!user) {
        return (
             <div className="flex items-center justify-center h-full">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        )
    }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold font-headline tracking-tight">
          My Profile
        </h2>
        <p className="text-muted-foreground">
          View and update your personal and security information.
        </p>
      </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2">
                <CardHeader>
                <CardTitle>Personal Information</CardTitle>
                <CardDescription>Manage your public profile and personal details.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onProfileSubmit)} className="space-y-8">
                             <div className="space-y-2">
                                <FormLabel>Profile Picture</FormLabel>
                                <div className="flex items-center gap-4">
                                     <Avatar className="h-20 w-20">
                                        <AvatarImage src={imagePreview || undefined} alt={user.name} />
                                        <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1">
                                        {imagePreview ? (
                                            <div className="relative group aspect-square w-24">
                                                <Image src={imagePreview} alt="Image preview" fill className="object-cover rounded-md" />
                                                <Button type="button" variant="destructive" size="icon" className="absolute top-1 right-1 h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity" onClick={removeImage}>
                                                    <X className="h-3 w-3" />
                                                </Button>
                                            </div>
                                        ) : (
                                            <div className="relative">
                                                <Button type="button" variant="outline" asChild className="cursor-pointer">
                                                    <div><FileUp className="mr-2 h-4 w-4" /> Upload</div>
                                                </Button>
                                                <Input id="file-upload" type="file" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" onChange={handleFileChange} accept="image/*"/>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <FormField control={form.control} name="avatarUrl" render={({ field }) => (
                                    <FormItem className="hidden">
                                        <FormControl><Input {...field} value={field.value ?? ''} /></FormControl>
                                    </FormItem>
                                )}/>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                                
                                <FormField control={form.control} name="phone" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Phone Number</FormLabel>
                                        <FormControl><Input type="tel" {...field} value={field.value ?? ''} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}/>

                                 <FormField control={form.control} name="address" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Full Address</FormLabel>
                                        <FormControl><Input {...field} value={field.value ?? ''} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}/>
                                
                                <FormField control={form.control} name="gender" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Gender</FormLabel>
                                        <RadioGroup onValueChange={field.onChange} value={field.value} className="flex gap-4 pt-2">
                                            <FormItem className="flex items-center space-x-2 space-y-0"><FormControl><RadioGroupItem value="male" /></FormControl><FormLabel className="font-normal">Male</FormLabel></FormItem>
                                            <FormItem className="flex items-center space-x-2 space-y-0"><FormControl><RadioGroupItem value="female" /></FormControl><FormLabel className="font-normal">Female</FormLabel></FormItem>
                                            <FormItem className="flex items-center space-x-2 space-y-0"><FormControl><RadioGroupItem value="other" /></FormControl><FormLabel className="font-normal">Other</FormLabel></FormItem>
                                        </RadioGroup>
                                        <FormMessage />
                                    </FormItem>
                                )}/>
                                
                                 <FormField control={form.control} name="nationality" render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>Nationality</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <FormControl><SelectTrigger><SelectValue placeholder="Select nationality" /></SelectTrigger></FormControl>
                                            <SelectContent>
                                                <SelectItem value="congolese">Congolese</SelectItem>
                                                <SelectItem value="burundian">Burundian</SelectItem>
                                                <SelectItem value="other">Other</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    <FormMessage />
                                    </FormItem>
                                )}/>
                                
                                {nationality === 'other' && (
                                    <FormField control={form.control} name="otherNationality" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Please Specify Nationality</FormLabel>
                                            <FormControl><Input {...field} value={field.value ?? ''} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}/>
                                )}
                                
                                <FormField control={form.control} name="educationLevel" render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>Level of Education</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <FormControl><SelectTrigger><SelectValue placeholder="Select level" /></SelectTrigger></FormControl>
                                            <SelectContent>
                                                <SelectItem value="none">None</SelectItem>
                                                <SelectItem value="high-school">High school</SelectItem>
                                                <SelectItem value="bachelors">Bachelor's</SelectItem>
                                                <SelectItem value="masters">Master's</SelectItem>
                                                <SelectItem value="doctorate">Doctorate</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    <FormMessage />
                                    </FormItem>
                                )}/>
                                
                                <FormField control={form.control} name="university" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Name of University (Optional)</FormLabel>
                                        <FormControl><Input {...field} value={field.value ?? ''} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}/>
                            </div>
                            
                            <div className="flex justify-end pt-4">
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
                    <CardTitle>Security</CardTitle>
                    <CardDescription>Change your password.</CardDescription>
                </CardHeader>
                <CardContent>
                     <Form {...passwordForm}>
                        <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-6">
                             <FormField control={passwordForm.control} name="currentPassword" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Current Password</FormLabel>
                                    <FormControl><Input type="password" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}/>
                            <FormField control={passwordForm.control} name="newPassword" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>New Password</FormLabel>
                                    <FormControl><Input type="password" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}/>
                             <FormField control={passwordForm.control} name="confirmPassword" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Confirm New Password</FormLabel>
                                    <FormControl><Input type="password" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}/>
                            <div className="flex justify-end">
                                <Button type="submit" variant="secondary" disabled={passwordForm.formState.isSubmitting || !passwordForm.formState.isDirty}>
                                    {passwordForm.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Change Password
                                </Button>
                            </div>
                        </form>
                     </Form>
                </CardContent>
            </Card>
        </div>
    </div>
  );
}
