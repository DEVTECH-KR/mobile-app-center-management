// src/app/register/page.tsx
import { RegisterForm } from "@/components/auth/register-form";
import { AppHeader } from "@/components/layout/app-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function RegisterPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader />
      <main className="flex-1">
        <div className="container flex items-center justify-center py-10">
          <Card className="w-full max-w-lg">
            <CardHeader>
              <CardTitle>Create an Account</CardTitle>
              <CardDescription>
                Join FFBF Training Hub to start your learning journey
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RegisterForm />
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}