'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import { CheckCircle, XCircle, Loader2, Mail, ArrowRight } from 'lucide-react';
import { api } from '@/lib/api';

export default function VerifyPage() {
  const router = useRouter();
  const [verified, setVerified] = useState(false);
  const [loading, setLoading] = useState(true);
  const searchParams = useSearchParams();
  let token = searchParams.get('token');

  const verifyToken = useCallback(async () => {
    try {
      setLoading(true);

      const response = (
        await api.post<{ error?: string; msg?: string; message?: string }>(
          '/auth/verify',
          {},
          token!
        )
      ).data;
      if (response?.error || response?.msg) {
        throw new Error(response.error);
      }
      setVerified(true);
    } catch (error) {
      console.error(error);
      setVerified(false);
    } finally {
      setLoading(false);
      setTimeout(() => router.push('/login'), 5000);
    }
  }, [token]);

  useEffect(() => {
    if (token) {
      verifyToken();
    }
  }, [token, verifyToken]);

  if (!token) {
    return (
      <div className='min-h-screen bg-background flex items-center justify-center p-4'>
        <div className='max-w-md w-full text-center animate-fade-in-up'>
          <div className='bg-card/50 backdrop-blur-sm border border-border rounded-2xl p-8 shadow-2xl'>
            <XCircle className='w-16 h-16 text-destructive mx-auto mb-4' />
            <h1 className='text-2xl font-bold text-foreground mb-2'>
              Invalid Link
            </h1>
            <p className='text-muted-foreground mb-6'>
              This verification link is invalid or has expired.
            </p>
            <button
              onClick={() => router.push('/login')}
              className='inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-3 rounded-lg font-medium transition-all duration-300 hover:scale-105'
            >
              Go to Login <ArrowRight className='w-4 h-4' />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-background flex items-center justify-center p-4'>
      <div className='max-w-md w-full text-center'>
        {loading && (
          <div className='animate-fade-in-up'>
            <div className='bg-card/50 backdrop-blur-sm border border-border rounded-2xl p-8 shadow-2xl'>
              <div className='relative mb-6'>
                <div className='w-20 h-20 mx-auto relative'>
                  <Loader2 className='w-20 h-20 text-primary animate-spin-slow' />
                  <Mail className='w-8 h-8 text-primary absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2' />
                </div>
              </div>
              <h1 className='text-2xl font-bold text-foreground mb-2'>
                Verifying Email
              </h1>
              <p className='text-muted-foreground'>
                Please wait while we verify your email address...
              </p>
              <div className='flex justify-center mt-4'>
                <div className='flex space-x-1'>
                  <div className='w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]'></div>
                  <div className='w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]'></div>
                  <div className='w-2 h-2 bg-primary rounded-full animate-bounce'></div>
                </div>
              </div>
            </div>
          </div>
        )}

        {!loading && verified && (
          <div className='animate-bounce-in'>
            <div className='bg-card/50 backdrop-blur-sm border border-border rounded-2xl p-8 shadow-2xl'>
              <div className='relative mb-6'>
                <div className='w-20 h-20 mx-auto bg-chart-4/20 rounded-full flex items-center justify-center'>
                  <CheckCircle className='w-12 h-12 text-chart-4' />
                </div>
              </div>
              <h1 className='text-2xl font-bold text-foreground mb-2'>
                Email Verified!
              </h1>
              <p className='text-muted-foreground mb-6'>
                Your email has been successfully verified! Redirecting to
                login...
              </p>
              <div className='flex items-center justify-center gap-2 text-chart-4'>
                <span className='text-sm'>Redirecting</span>
                <div className='flex space-x-1'>
                  <div className='w-1 h-1 bg-chart-4 rounded-full animate-bounce [animation-delay:-0.3s]'></div>
                  <div className='w-1 h-1 bg-chart-4 rounded-full animate-bounce [animation-delay:-0.15s]'></div>
                  <div className='w-1 h-1 bg-chart-4 rounded-full animate-bounce'></div>
                </div>
              </div>
            </div>
          </div>
        )}

        {!loading && !verified && (
          <div className='animate-bounce-in'>
            <div className='bg-card/50 backdrop-blur-sm border border-border rounded-2xl p-8 shadow-2xl'>
              <div className='relative mb-6'>
                <div className='w-20 h-20 mx-auto bg-destructive/20 rounded-full flex items-center justify-center'>
                  <XCircle className='w-12 h-12 text-destructive' />
                </div>
              </div>
              <h1 className='text-2xl font-bold text-foreground mb-2'>
                Verification Failed
              </h1>
              <p className='text-muted-foreground mb-6'>
                Verification failed or token is invalid. Redirecting to login...
              </p>
              <div className='space-y-4'>
                <div className='flex items-center justify-center gap-2 text-destructive'>
                  <span className='text-sm'>Redirecting</span>
                  <div className='flex space-x-1'>
                    <div className='w-1 h-1 bg-destructive rounded-full animate-bounce [animation-delay:-0.3s]'></div>
                    <div className='w-1 h-1 bg-destructive rounded-full animate-bounce [animation-delay:-0.15s]'></div>
                    <div className='w-1 h-1 bg-destructive rounded-full animate-bounce'></div>
                  </div>
                </div>
                <button
                  onClick={() => router.push('/login')}
                  className='inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-3 rounded-lg font-medium transition-all duration-300 hover:scale-105'
                >
                  Go to Login Now <ArrowRight className='w-4 h-4' />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
