'use client';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import api from '@/lib/api';
import { toast } from 'sonner';

export function PasswordEmailForm({
  className,
  ...props
}: React.ComponentProps<'div'>) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;

    try {
      const response = await api.post<{ message?: string; error?: string }>(
        '/auth/forgot-password',
        {
          email,
        }
      );

      if (response && response.data?.message) {
        toast.success(response.data.message);
      } else if (response && response.data?.error) {
        toast.error(response.data.error);
      } else {
        toast.error('Request failed');
      }
      setTimeout(() => router.push('/login'), 4000);
    } catch (error) {
      console.error('Request password reset:', error);
      toast.error('Request password reset failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={cn('flex flex-col gap-6', className)} {...props}>
      <Card className='overflow-hidden p-0'>
        <CardContent className='grid p-0'>
          <form onSubmit={handleSubmit} className='p-6 md:p-8'>
            <div className='flex flex-col gap-6'>
              <div className='flex flex-col items-center text-center'>
                <h1 className='text-2xl font-bold'>Forgot Password</h1>
              </div>
              <div className='grid gap-3'>
                <Label htmlFor='email'>Email</Label>
                <Input
                  id='email'
                  name='email'
                  type='email'
                  placeholder='m@example.com'
                  required
                />
              </div>
              <Button type='submit' className='w-full cursor-pointer' disabled={isLoading}>
                {isLoading
                  ? 'Requesting password reset link...'
                  : 'Request password reset'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default function PasswordForm({
  className,
  ...props
}: React.ComponentProps<'div'>) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const newPassword = formData.get('password') as string;
    const confirmPassword = formData.get('confirm-password') as string;

    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      setIsLoading(false);
      return;
    }
    if (!token) {
      toast.error('Invalid or expired token');
      setIsLoading(false);
      return;
    }
    try {
      const response = await api.post<{ message?: string; error?: string }>(
        '/auth/reset-password',
        {
          newPassword: newPassword,
        },
        token
      );

      if (response && response.data?.message) {
        toast.success(response.data.message);
      } else if (response && response.data?.error) {
        toast.error(response.data.error);
      } else {
        toast.error('Request failed');
      }
      setTimeout(() => router.push('/login'), 4000);
    } catch (error) {
      console.error('Request password reset:', error);
      toast.error('Request password reset failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={cn('flex flex-col gap-6', className)} {...props}>
      <Card className='overflow-hidden p-0'>
        <CardContent className='grid p-0'>
          <form onSubmit={handleSubmit} className='p-6 md:p-8'>
            <div className='flex flex-col gap-6'>
              <div className='flex flex-col items-center text-center'>
                <h1 className='text-2xl font-bold'>Reset your password</h1>
              </div>
              <div className='grid gap-3'>
                <Label htmlFor='password'>Password</Label>
                <Input
                  id='password'
                  name='password'
                  type='password'
                  placeholder='••••••••'
                  required
                />
              </div>
              <div className='grid gap-3'>
                <Label htmlFor='confirm-password'>Confirm password</Label>
                <Input
                  id='confirm-password'
                  name='confirm-password'
                  type='password'
                  placeholder='••••••••'
                  required
                />
              </div>
              <Button type='submit' className='w-full cursor-pointer' disabled={isLoading}>
                {isLoading ? 'Loading...' : 'Reset password'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
