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
import { useI18n } from '@/contexts/I18nContext';

export function PasswordEmailForm({
  className,
  ...props
}: React.ComponentProps<'div'>) {
  const { t } = useI18n();
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
        toast.error(t.auth.forgotPassword.requestFailed);
      }
      setTimeout(() => router.push('/login'), 4000);
    } catch (error) {
      console.error('Request password reset:', error);
      toast.error(t.auth.forgotPassword.requestFailed);
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
                <h1 className='text-2xl font-bold'>
                  {t.auth.forgotPassword.title}
                </h1>
              </div>
              <div className='grid gap-3'>
                <Label htmlFor='email'>{t.auth.forgotPassword.email}</Label>
                <Input
                  id='email'
                  name='email'
                  type='email'
                  placeholder={t.auth.forgotPassword.emailPlaceholder}
                  data-testid='email-input'
                  required
                />
              </div>
              <Button
                type='submit'
                className='w-full cursor-pointer'
                disabled={isLoading}
              >
                {isLoading
                  ? t.auth.forgotPassword.requesting
                  : t.auth.forgotPassword.requestButton}
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
  const { t } = useI18n();
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
      toast.error(t.auth.resetPassword.passwordsDoNotMatch);
      setIsLoading(false);
      return;
    }
    if (!token) {
      toast.error(t.auth.resetPassword.invalidToken);
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
        toast.error(t.auth.resetPassword.resetFailed);
      }
      setTimeout(() => router.push('/login'), 4000);
    } catch (error) {
      console.error('Request password reset:', error);
      toast.error(t.auth.resetPassword.resetFailed);
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
                <h1 className='text-2xl font-bold'>
                  {t.auth.resetPassword.title}
                </h1>
              </div>
              <div className='grid gap-3'>
                <Label htmlFor='password'>
                  {t.auth.resetPassword.password}
                </Label>
                <Input
                  id='password'
                  name='password'
                  type='password'
                  placeholder={t.auth.resetPassword.passwordPlaceholder}
                  required
                />
              </div>
              <div className='grid gap-3'>
                <Label htmlFor='confirm-password'>
                  {t.auth.resetPassword.confirmPassword}
                </Label>
                <Input
                  id='confirm-password'
                  name='confirm-password'
                  type='password'
                  placeholder={t.auth.resetPassword.confirmPasswordPlaceholder}
                  required
                />
              </div>
              <Button
                type='submit'
                className='w-full cursor-pointer'
                disabled={isLoading}
              >
                {isLoading
                  ? t.auth.resetPassword.loading
                  : t.auth.resetPassword.resetButton}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
