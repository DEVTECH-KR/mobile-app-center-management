// src/app/login/page.tsx
import Link from 'next/link';
import { LoginForm } from '@/components/auth/login-form';
import Logo from '@/components/icons/logo';

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center">
          <Link href="/" aria-label="Home">
            <Logo className="h-16 w-16 text-primary" />
          </Link>
          <h1 className="mt-4 font-headline text-3xl font-bold">
            Welcome Back
          </h1>
          <p className="text-muted-foreground">
            Sign in to access your dashboard.
          </p>
        </div>
        <LoginForm />
        <div className="mt-4 text-center text-sm">
          <p>
            Don&apos;t have an account?{' '}
            <Link href="/register" className="underline">
              Register
            </Link>
          </p>
          <p className="mt-2">
            <Link href="#" className="underline">
              Forgot your password?
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
