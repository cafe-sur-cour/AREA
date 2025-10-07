'use client';
import { Button } from '@/components/ui/button';
import { TbLoader3 } from 'react-icons/tb';
import { useState } from 'react';

interface ButtonWithLoadingProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
}

export default function ButtonWithLoading({
  children,
  onClick,
  ...props
}: ButtonWithLoadingProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
    try {
      setIsLoading(true);
      if (onClick) {
        await onClick(e);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button variant='outline' {...props} onClick={handleClick} type='button'>
      {isLoading ? <TbLoader3 className='animate-spin' /> : children}
    </Button>
  );
}
