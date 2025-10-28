import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { LuEye, LuEyeClosed } from 'react-icons/lu';

export default function InputPassword({
  className,
  ...props
}: React.ComponentProps<'input'>) {
  const [showPassword, setShowPassword] = useState(false);
  return (
    <div className='relative'>
      <Input
        id='password'
        name='password'
        type={showPassword ? 'text' : 'password'}
        placeholder='Password'
        required
        className={cn('pr-10', className)}
        {...props}
      />
      <button
        type='button'
        aria-label='Toggle password visibility'
        className='absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer'
        onClick={() => setShowPassword(!showPassword)}
      >
        {showPassword ? (
          <LuEyeClosed
            data-testid='eye-closed'
            className='h-5 w-5 text-gray-500'
          />
        ) : (
          <LuEye data-testid='eye-open' className='h-5 w-5 text-gray-500' />
        )}
      </button>
    </div>
  );
}
