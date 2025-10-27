'use client';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { UserRound } from 'lucide-react';

interface InputAvatar {
  url?: string;
  defaultChar: string;
  size?: number;
  variente?: 'normal' | 'modifiable';
  onChange?: (url: string) => void;
}

interface IDAvatarProps {
  id: number;
  size?: number;
  className?: string;
}

export function IDAvatar(props: IDAvatarProps) {
  return (
    <Avatar className={`h-${props.size} w-${props.size} ${props.className}`}>
      <AvatarFallback>
        <UserRound className='h-4 w-4 text-gray-700' />
      </AvatarFallback>
    </Avatar>
  );
}

export function InputAvatar(props: InputAvatar) {
  return (
    <Avatar className={`h-${props.size} w-${props.size}`}>
      <AvatarFallback>{props.defaultChar.toUpperCase()}</AvatarFallback>
    </Avatar>
  );
}
