'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { LogOut } from 'lucide-react';
import { IDAvatar } from './ui/InputAvatar';
import Link from 'next/link';
import { TbLoader3 } from 'react-icons/tb';

interface UserActionsProps {
  className?: string;
  isMobile?: boolean;
}

export function UserActions({ className, isMobile }: UserActionsProps) {
  const router = useRouter();
  const { user, isAuthenticated, logout, isLoading } = useAuth();

  const handleLogout = () => logout();
  const handleSwitchToProfile = () => router.push('/profile');
  const handleSwitchToAdmin = () => router.push('/admin');

  if (isLoading) {
    return (
      <div
        className={`flex ${isMobile ? 'flex-col space-y-3' : 'space-x-6'} items-center ${className}`}
      >
        <TbLoader3 className='animate-spin text-app-text-secondary' size={24} />
      </div>
    );
  }

  return (
    <div
      className={`flex ${isMobile ? 'flex-col space-y-3' : 'space-x-6'} items-center ${className}`}
    >
      {isAuthenticated ? (
        <>
          {user?.is_admin && (
            <button
              onClick={handleSwitchToAdmin}
              className={`font-heading font-medium text-area-primary hover:text-area-hover transition-all duration-300 px-4 py-2 rounded-lg hover:bg-area-light/20 ${
                isMobile ? 'w-full text-center text-lg' : ''
              }`}
            >
              Admin Area
            </button>
          )}
          <button
            onClick={handleSwitchToProfile}
            className={`relative flex items-center justify-center font-heading font-bold text-app-text-secondary hover:text-area-hover transition-all duration-300 p-2 rounded-lg hover:bg-area-light/20 ${
              isMobile ? 'w-full  gap-2' : ''
            }`}
          >
            <IDAvatar id={0} />
            {isMobile && (
              <span className='text-app-text-secondary'>Profile</span>
            )}
          </button>
          <button
            onClick={handleLogout}
            className={`font-heading font-bold text-app-red-primary hover:text-red-600 transition-all duration-300 p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center justify-center gap-2 ${
              isMobile ? 'w-full' : ''
            }`}
          >
            <LogOut />
            {isMobile && (
              <span className='text-app-text-secondary'>Logout</span>
            )}
          </button>
        </>
      ) : (
        <Link
          href='/login'
          className={`font-heading font-medium text-app-text-secondary hover:text-area-primary transition-all duration-300 relative group ${
            isMobile ? 'text-center py-2 text-lg' : ''
          }`}
        >
          Login
          <span
            className={`absolute ${isMobile ? 'bottom-0 left-1/2 -translate-x-1/2 w-0 group-hover:w-1/2' : '-bottom-1 left-0 w-0 group-hover:w-full'} h-0.5 bg-gradient-to-r from-area-primary to-area-hover transition-all duration-300`}
          ></span>
        </Link>
      )}
    </div>
  );
}
