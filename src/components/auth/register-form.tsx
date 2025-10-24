// src/components/auth/register-form.tsx
'use client';

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/lib/auth";

// Update the form schema to include password confirmation
const formSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  email: z.string().email({ message: "Invalid email address." }),
  gender: z.enum(["male", "female", "other"], {
    required_error: "Please select a gender.",
  }),
  nationalityType: z.enum(["Congolese", "Burundian", "Rwandan", "Other"], {
    required_error: "Please select your nationality.",
  }),
  otherNationality: z.string().optional(),
  educationLevel: z.enum(["High School", "Bachelors", "Masters", "Doctorate", "Other"], {
    required_error: "Please select your education level.",
  }),
  university: z.string().optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  password: z.string().min(6, { message: "Password must be at least 6 characters." }),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
}).refine(
  (data) => {
    if (data.nationalityType === "Other") {
      return !!data.otherNationality;
    }
    return true;
  },
  {
    message: "Please specify your nationality",
    path: ["otherNationality"],
  }
);

type FormData = z.infer<typeof formSchema>;

export function RegisterForm() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const { register } = useAuth();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
      gender: "male",
      nationalityType: "Congolese",
      otherNationality: "",
      educationLevel: "Bachelors",
      university: "",
      address: "",
      phone: "",
    },
  });

  // Watch the nationalityType field to show/hide the other nationality input
  const nationalityType = form.watch("nationalityType");

  async function onSubmit(values: FormData) {
    setIsLoading(true);
    try {
      await register({
        ...values,
        nationality: values.nationalityType === "Other" ? values.otherNationality! : values.nationalityType,
        role: 'student',
      });
      
      toast({
        title: "Registration Successful",
        description: "Please login with your new credentials.",
      });
      
      router.push("/login");
    } catch (error) {
      console.error('Registration error:', error);
      toast({
        variant: "destructive",
        title: "Registration Failed",
        description: error instanceof Error 
          ? error.message 
          : "Failed to register. Please try again later.",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Full Name</FormLabel>
              <FormControl>
                <Input placeholder="John Doe" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input placeholder="name@example.com" type="email" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="gender"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Gender</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select your gender" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="nationalityType"
          render={({ field }) => (
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
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {nationalityType === "Other" && (
          <FormField
            control={form.control}
            name="otherNationality"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Specify Nationality</FormLabel>
                <FormControl>
                  <Input placeholder="Enter your nationality" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <FormField
          control={form.control}
          name="educationLevel"
          render={({ field }) => (
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
          )}
        />

        <FormField
          control={form.control}
          name="university"
          render={({ field }) => (
            <FormItem>
              <FormLabel>University/Institution (Optional)</FormLabel>
              <FormControl>
                <Input placeholder="Your university or institution" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="address"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Address (Optional)</FormLabel>
              <FormControl>
                <Input placeholder="Your address" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Phone Number (Optional)</FormLabel>
              <FormControl>
                <Input placeholder="Your phone number" type="tel" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <Input type="password" placeholder="••••••••" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="confirmPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Confirm Password</FormLabel>
              <FormControl>
                <Input type="password" placeholder="••••••••" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Register
        </Button>
      </form>
    </Form>
  );
}