'use client';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { FaGithub, FaGoogle, FaMicrosoft } from 'react-icons/fa';
import api from '@/lib/api';
import Image from 'next/image';
import { toast } from 'sonner';
import InputPassword from './ui/input-password';
import { getAPIUrl } from '@/lib/config';
import ButtonWithLoading from './ui/button-with-loading';
import { useI18n } from '@/contexts/I18nContext';

export function RegisterForm({
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
    const name = formData.get('username') as string;
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const confirmPassword = formData.get('confirm-password') as string;
    if (password !== confirmPassword) {
      toast.error(t.auth.register.passwordsDoNotMatch);
      setIsLoading(false);
      return;
    }

    try {
      await api.post<{ message?: string; error?: string }>('/auth/register', {
        email,
        name,
        password,
      });
      toast.success(t.auth.register.registrationSuccess);
      setTimeout(() => router.push('/login'), 2000);
    } catch (error) {
      console.error('Registration error:', error);
      toast.error(t.auth.register.registrationFailed + error);
    } finally {
      setIsLoading(false);
    }
  };

  const signInWithGithub = async () => {
    window.location.href = `${await getAPIUrl()}/auth/github/login`;
  };

  const signInWithGoogle = async () => {
    window.location.href = `${await getAPIUrl()}/auth/google/login`;
  };

  const signInWithMicrosoft = async () => {
    window.location.href = `${await getAPIUrl()}/auth/microsoft/login`;
  };

  return (
    <div className={cn('flex flex-col gap-6', className)} {...props}>
      <Card className='overflow-hidden p-0'>
        <CardContent className='grid p-0 md:grid-cols-2'>
          <form onSubmit={handleSubmit} className='p-6 md:p-8'>
            <div className='flex flex-col gap-6'>
              <div className='flex flex-col items-center text-center'>
                <h1 className='text-2xl font-bold'>{t.auth.register.title}</h1>
                <p className='text-muted-foreground text-balance'>
                  {t.auth.register.subtitle}
                </p>
              </div>
              <div className='grid gap-3'>
                <Label htmlFor='username'>{t.auth.register.username}</Label>
                <Input
                  id='username'
                  name='username'
                  type='text'
                  placeholder={t.auth.register.usernamePlaceholder}
                  required
                />
              </div>
              <div className='grid gap-3'>
                <Label htmlFor='email'>{t.auth.register.email}</Label>
                <Input
                  id='email'
                  name='email'
                  type='email'
                  placeholder={t.auth.register.emailPlaceholder}
                  required
                />
              </div>
              <div className='grid gap-3'>
                <Label htmlFor='password'>{t.auth.register.password}</Label>
                <InputPassword name='password' />
              </div>
              <div className='grid gap-3'>
                <Label htmlFor='confirm-password'>{t.auth.register.confirmPassword}</Label>
                <InputPassword
                  id='confirm-password'
                  name='confirm-password'
                  placeholder={t.auth.register.confirmPasswordPlaceholder}
                />
              </div>
              <Button
                type='submit'
                className='w-full cursor-pointer'
                disabled={isLoading}
              >
                {isLoading ? t.auth.register.registering : t.auth.register.registerButton}
              </Button>
              <div className='after:border-border relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t'>
                <span className='bg-card text-muted-foreground relative z-10 px-2'>
                  {t.auth.register.orContinueWith}
                </span>
              </div>
              <div className='grid grid-cols-3 gap-4'>
                <ButtonWithLoading
                  className='w-full cursor-pointer'
                  onClick={async () => await signInWithGithub()}
                >
                  <FaGithub />
                  <span className='sr-only'>{t.auth.register.loginWithGithub}</span>
                </ButtonWithLoading>
                <ButtonWithLoading
                  className='w-full cursor-pointer'
                  onClick={async () => await signInWithGoogle()}
                >
                  <FaGoogle />
                  <span className='sr-only'>{t.auth.register.loginWithGoogle}</span>
                </ButtonWithLoading>
                <ButtonWithLoading
                  className='w-full'
                  onClick={async () => await signInWithMicrosoft()}
                >
                  <FaMicrosoft />
                  <span className='sr-only'>{t.auth.register.loginWithMicrosoft}</span>
                </ButtonWithLoading>
              </div>
            </div>
          </form>
          <div className='bg-muted relative hidden md:block'>
            <Image
              width={500}
              height={500}
              src='/base-logo-inversed.png'
              alt='Image'
              className='absolute inset-0 h-full w-full object-cover dark:brightness-[0.2] dark:grayscale'
            />
          </div>
        </CardContent>
      </Card>
      <div className='text-muted-foreground *:[a]:hover:text-primary text-center text-xs text-balance *:[a]:underline *:[a]:underline-offset-4'>
        {t.auth.register.termsPrefix} <a href='#'>{t.auth.register.terms}</a>{' '}
        {t.auth.register.and} <a href='#'>{t.auth.register.privacy}</a>.
      </div>
    </div>
  );
}
