'use client';

import { LoginForm } from '@/components/login-form';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { TbLoader3 } from 'react-icons/tb';

export default function LoginPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  if (isAuthenticated) {
    router.push('/');
    return null;
  }
  if (isLoading) {
    return (
      <div className='min-h-screen bg-background flex items-center justify-center p-4'>
        Loading...
        <TbLoader3 className='animate-spin h-10 w-10 text-primary' />
      </div>
    );
  }

  return (
    <div className='bg-muted flex min-h-svh flex-col items-center justify-center p-6 md:p-10'>
      <div className='w-full max-w-sm md:max-w-3xl'>
        <LoginForm />
      </div>
    </div>
  );
}
