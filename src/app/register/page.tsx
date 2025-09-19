import Link from 'next/link';
import { RegisterForm } from '@/components/auth/register-form';
import Logo from '@/components/icons/logo';

export default function RegisterPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center">
          <Link href="/" aria-label="Home">
            <Logo className="h-16 w-16 text-primary" />
          </Link>
          <h1 className="mt-4 font-headline text-3xl font-bold">
            Create an Account
          </h1>
          <p className="text-muted-foreground">
            Join our community to start learning.
          </p>
        </div>
        <RegisterForm />
        <div className="mt-4 text-center text-sm">
            <p>
                Already have an account?{' '}
                <Link href="/login" className="underline">
                    Login
                </Link>
            </p>
        </div>
      </div>
    </div>
  );
}
