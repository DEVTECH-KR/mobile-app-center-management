// src/app/dashboard/profile/page.tsx
'use client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { FileUp, Loader2, X } from "lucide-react";
import type { User, UserRole } from "@/lib/types";
import { useState, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Image from "next/image";
import { useAuth } from "@/lib/auth";
import { Label } from "@/components/ui/label";

const profileFormSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
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

type LocalUser = {
    id: string;
    _id?: string;
    name: string;
    email: string;
    role: UserRole | string;
    gender?: string | undefined; 
    nationality?: string | null;
    otherNationality?: string | null;
    educationLevel?: string | null;
    university?: string | null;
    address?: string | null;
    phone?: string | null;
    avatarUrl?: string | null;
};

export default function ProfilePage() {
    const { user: authUser, setAuthUser } = useAuth(); 
    const [user, setUser] = useState<LocalUser | null>(() => {
        if (!authUser) return null;
        return mapAuthUserToLocal(authUser);
    });

    const [imagePreview, setImagePreview] = useState<string | null>(user?.avatarUrl || null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const { toast } = useToast();

    const form = useForm<z.infer<typeof profileFormSchema>>({
        resolver: zodResolver(profileFormSchema),
        defaultValues: {
            name: user?.name || '',
            avatarUrl: user?.avatarUrl ?? null,
            gender: normalizeGender(user?.gender),
            nationality: user?.nationality ?? undefined,
            otherNationality: user?.otherNationality ?? undefined,
            educationLevel: user?.educationLevel ?? undefined,
            university: user?.university ?? undefined,
            address: user?.address ?? undefined,
            phone: user?.phone ?? undefined,
        },
        mode: "onChange",
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

    /* MODIFIED: whenever the global authUser changes (login / refresh / setAuthUser), update local state + form */
    useEffect(() => {
        if (!authUser) {
            setUser(null);
            return;
        }

        const mapped = mapAuthUserToLocal(authUser);
        setUser(mapped);

        // Reset react-hook-form fields using normalized values that match zod schema
        form.reset({
            name: mapped.name || '',
            avatarUrl: mapped.avatarUrl ?? null,
            gender: normalizeGender(mapped.gender),
            nationality: mapped.nationality ?? undefined,
            otherNationality: mapped.otherNationality ?? undefined,
            educationLevel: mapped.educationLevel ?? undefined,
            university: mapped.university ?? undefined,
            address: mapped.address ?? undefined,
            phone: mapped.phone ?? undefined,
        });

        setImagePreview(mapped.avatarUrl ?? null);
    }, [authUser]);

    /* Helper: accept any incoming gender string and only return union values expected by zod form */
    function normalizeGender(g?: string | undefined) {
        if (!g) return undefined;
        return g === 'male' || g === 'female' || g === 'other' ? g : undefined;
    }

    /* Helper: map the authUser (which can have different shape) to our LocalUser */
    function mapAuthUserToLocal(a: any): LocalUser {
        const id = (a && (a.id ?? a._id ?? a._id?.toString())) || '';
        return {
            id,
            _id: a._id ?? undefined,
            name: a.name ?? '',
            email: a.email ?? '',
            role: a.role ?? 'student',
            gender: a.gender ?? undefined,
            nationality: a.nationality ?? null,
            otherNationality: a.otherNationality ?? null,
            educationLevel: a.educationLevel ?? null,
            university: a.university ?? null,
            address: a.address ?? null,
            phone: a.phone ?? null,
            avatarUrl: a.avatarUrl ?? null,
        };
    }

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const result = reader.result as string;
                setImagePreview(result);
                form.setValue("avatarUrl", result);
            };
            reader.readAsDataURL(file);
        }
    };

    const removeImage = () => {
        setImagePreview(null);
        form.setValue("avatarUrl", null);
        console.log('Image removed, form dirty?', form.formState.isDirty);
    };

    const handleFormSubmit = form.handleSubmit((values) => {
      onSubmit(values);
    }, (errors) => {
      console.log('Validation errors:', errors);
      toast({
        variant: "destructive",
        title: "Validation Failed",
        description: "Please fix the errors in the form.",
      });
    });

    async function onSubmit(values: z.infer<typeof profileFormSchema>) {
        setIsSubmitting(true);
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error('No authentication token found');
            }

            const response = await fetch('/api/auth/profile', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify(values),
            });


            // MODIFIED: handle 401 explicitly to avoid silent failures & force logout
            if (response.status === 401) {
                // token invalid or expired
                localStorage.removeItem('token');
                toast({
                    variant: 'destructive',
                    title: 'Session Expirée',
                    description: 'Your session has expired. Please log in again.',
                });
                setIsSubmitting(false);
                return;
            }

            console.log('Response status:', response.status);

            if (!response.ok) {
                // try parse error body if available
                const errorBody = await response.json().catch(() => ({}));
                throw new Error(errorBody.error || 'Failed to update profile');
            }

            const updatedUser = await response.json();

            // MODIFIED: update local page state (mapped) so form immediately reflects DB response
            const mapped = mapAuthUserToLocal(updatedUser);
            setUser(mapped);

            try {
                setAuthUser({
                id: mapped.id,
                name: mapped.name,
                email: mapped.email,
                role: mapped.role as UserRole,
                } as any); 
            } catch (e) {
                console.warn('setAuthUser failed type-check, but update proceeds:', e);
            }

            // reset the form values to the updated ones (normalized)
            form.reset({
                name: mapped.name,
                avatarUrl: mapped.avatarUrl ?? null,
                gender: normalizeGender(mapped.gender),
                nationality: mapped.nationality ?? undefined,
                otherNationality: mapped.otherNationality ?? undefined,
                educationLevel: mapped.educationLevel ?? undefined,
                university: mapped.university ?? undefined,
                address: mapped.address ?? undefined,
                phone: mapped.phone ?? undefined,
            });

            toast({
                title: "Profile Updated",
                description: "Your profile has been successfully updated.",
            });
  
        } catch (error: any) {
            console.error('Full error in onSubmit:', error); // DEBUG.
            toast({
                variant: "destructive",
                title: "Update Failed",
                description: error.message || "An error occurred while updating your profile.",
            });
        } finally {
            setIsSubmitting(false);
        }
    }

    async function onPasswordSubmit(values: z.infer<typeof passwordFormSchema>) {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error('No authentication token found');
            }

            const response = await fetch('/api/auth/change-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                    currentPassword: values.currentPassword,
                    newPassword: values.newPassword
                }),
            });

            if (response.status === 401) {
                localStorage.removeItem('token');
                toast({
                    variant: 'destructive',
                    title: 'Session Expirée',
                    description: 'Your session has expired. Please log in again.',
                });
                return;
            }

            if (!response.ok) {
                const error = await response.json().catch(() => ({}));
                throw new Error(error.error || 'Failed to change password');
            }

            toast({
                title: "Password Changed",
                description: "Your password has been successfully updated.",
            });
            passwordForm.reset();

        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Password Change Failed",
                description: error.message || "An error occurred while changing your password.",
            });
        }
    }

    if (!user) {
        return <div>Loading profile...</div>; 
    }


    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-3xl font-bold font-headline tracking-tight">My Profile</h2>
                <p className="text-muted-foreground">Manage your personal information and security settings.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle>Personal Information</CardTitle>
                        <CardDescription>Update your profile details.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Form {...form}>
                            <form onSubmit={handleFormSubmit} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-6">
                                        <FormItem>
                                            <FormLabel>Profile Picture</FormLabel>
                                            <div className="flex items-center gap-4">
                                                <Avatar className="h-20 w-20">
                                                    <AvatarImage src={imagePreview || undefined} />
                                                    <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                                                </Avatar>
                                                <div className="space-y-2">
                                                    <Button type="button" variant="outline" onClick={() => document.getElementById('avatar-upload')?.click()}>
                                                        <FileUp className="mr-2 h-4 w-4" /> Upload New
                                                    </Button>
                                                    {imagePreview && (
                                                        <Button type="button" variant="ghost" size="sm" onClick={removeImage}>
                                                            <X className="mr-2 h-4 w-4" /> Remove
                                                        </Button>
                                                    )}
                                                    <input
                                                        id="avatar-upload"
                                                        type="file"
                                                        accept="image/*"
                                                        className="hidden"
                                                        onChange={handleFileChange}
                                                    />
                                                </div>
                                            </div>
                                            <FormDescription>Accepted formats: JPG, PNG, GIF. Max size: 2MB</FormDescription>
                                        </FormItem>

                                        <FormField control={form.control} name="name" render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Full Name</FormLabel>
                                                <FormControl><Input {...field} /></FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}/>

                                        <FormItem>
                                            <FormLabel>Email Address</FormLabel>
                                            <Input value={user.email} disabled />
                                            <FormDescription>Your email cannot be changed.</FormDescription>
                                        </FormItem>

                                        <FormField control={form.control} name="gender" render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Gender</FormLabel>
                                                <FormControl>
                                                    <RadioGroup
                                                        onValueChange={field.onChange}
                                                        defaultValue={field.value}
                                                        className="flex space-x-4"
                                                    >
                                                        <div className="flex items-center space-x-2">
                                                            <RadioGroupItem value="male" id="male" />
                                                            <Label htmlFor="male">Male</Label>
                                                        </div>
                                                        <div className="flex items-center space-x-2">
                                                            <RadioGroupItem value="female" id="female" />
                                                            <Label htmlFor="female">Female</Label>
                                                        </div>
                                                        <div className="flex items-center space-x-2">
                                                            <RadioGroupItem value="other" id="other" />
                                                            <Label htmlFor="other">Other</Label>
                                                        </div>
                                                    </RadioGroup>
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}/>
                                    </div>

                                    <div className="space-y-6">
                                        <FormField control={form.control} name="nationality" render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Nationality</FormLabel>
                                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                    <FormControl>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Select your nationality" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        <SelectItem value="Congolese">Congolese</SelectItem>
                                                        <SelectItem value="Burundian">Burundian</SelectItem>
                                                        <SelectItem value="Rwandan">Rwandan</SelectItem>
                                                        <SelectItem value="other">Other</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}/>

                                        {nationality === 'other' && (
                                            <FormField control={form.control} name="otherNationality" render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Specify Nationality</FormLabel>
                                                    <FormControl><Input {...field} value={field.value ?? ''} /></FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}/>
                                        )}

                                        <FormField control={form.control} name="educationLevel" render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Education Level</FormLabel>
                                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                    <FormControl>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Select your education level" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        <SelectItem value="High School">High School</SelectItem>
                                                        <SelectItem value="Bachelors">Bachelor's Degree</SelectItem>
                                                        <SelectItem value="Masters">Master's Degree</SelectItem>
                                                        <SelectItem value="Doctorate">Doctorate</SelectItem>
                                                        <SelectItem value="Other">Other</SelectItem>
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
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <FormField control={form.control} name="address" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Address (Optional)</FormLabel>
                                            <FormControl><Input {...field} value={field.value ?? ''} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}/>

                                    <FormField control={form.control} name="phone" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Phone Number (Optional)</FormLabel>
                                            <FormControl><Input type="tel" {...field} value={field.value ?? ''} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}/>
                                </div>

                                <div className="flex justify-end pt-4">
                                    <Button type="submit" disabled={isSubmitting}>
                                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
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