'use client';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import ButtonWithLoading from '@/components/ui/button-with-loading';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useState } from 'react';
import api from '@/lib/api';
import Image from 'next/image';
import { FaMeta } from 'react-icons/fa6';
import { FaGithub, FaGoogle } from 'react-icons/fa';
import { getAPIUrl } from '@/lib/config';
import InputPassword from './ui/input-password';
import { toast } from 'sonner';

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<'div'>) {
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    try {
      const response = await api.post<{ token: string }>('/auth/login', {
        email,
        password,
      });

      if (response && response.data) {
        window.location.href = '/';
      } else {
        toast.error('Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      toast.error('Login failed');
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

  const signInWithMeta = async () => {
    window.location.href = `${await getAPIUrl()}/auth/meta/login`;
  };

  return (
    <div className={cn('flex flex-col gap-6', className)} {...props}>
      <Card className='overflow-hidden p-0'>
        <CardContent className='grid p-0 md:grid-cols-2'>
          <form onSubmit={handleSubmit} className='p-6 md:p-8'>
            <div className='flex flex-col gap-6'>
              <div className='flex flex-col items-center text-center'>
                <h1 className='text-2xl font-bold'>Welcome back</h1>
                <p className='text-muted-foreground text-balance'>
                  Login to your Area account
                </p>
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
              <div className='grid gap-3'>
                <div className='flex items-center'>
                  <Label htmlFor='password'>Password</Label>
                  <a
                    href='/forgot-password'
                    className='ml-auto text-sm underline-offset-2 hover:underline'
                  >
                    Forgot your password?
                  </a>
                </div>
                <InputPassword name='password' />
              </div>
              <Button
                type='submit'
                className='w-full cursor-pointer'
                disabled={isLoading}
              >
                {isLoading ? 'Logging in...' : 'Login'}
              </Button>
              <div className='after:border-border relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t'>
                <span className='bg-card text-muted-foreground relative z-10 px-2'>
                  Or continue with
                </span>
              </div>
              <div className='grid grid-cols-3 gap-4'>
                <ButtonWithLoading
                  onClick={async () => await signInWithGithub()}
                  className='w-full cursor-pointer'
                >
                  <FaGithub />
                  <span className='sr-only'>Login with Github</span>
                </ButtonWithLoading>
                <ButtonWithLoading
                  onClick={async () => await signInWithGoogle()}
                  className='w-full cursor-pointer'
                >
                  <FaGoogle />
                  <span className='sr-only'>Login with Google</span>
                </ButtonWithLoading>
                <ButtonWithLoading
                  onClick={async () => await signInWithMeta()}
                  className='w-full cursor-pointer'
                >
                  <FaMeta />
                  <span className='sr-only'>Login with Meta</span>
                </ButtonWithLoading>
              </div>
              <div className='text-center text-sm'>
                Don&apos;t have an account?{' '}
                <a href='/register' className='underline underline-offset-4'>
                  Sign up
                </a>
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
        By clicking continue, you agree to our <a href='#'>Terms of Service</a>{' '}
        and <a href='#'>Privacy Policy</a>.
      </div>
    </div>
  );
}
