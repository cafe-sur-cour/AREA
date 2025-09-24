'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useState } from 'react';
import { LogOut, Menu, X } from 'lucide-react';
import { IDAvatar } from './ui/InputAvatar';

export default function Navigation() {
  const pathname = usePathname();
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, isAuthenticated, logout } = useAuth();

  const navItems = [
    { href: '/', label: 'Home' },
    { href: '/catalogue', label: 'Catalogue' },
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/about', label: 'About' },
  ];

  const handleLogout = () => {
    logout();
  };

  const handleSwitchToProfile = () => {
    router.push('/profile');
  };

  const handleSwitchToAdmin = () => {
    router.push('/admin');
  };

  return (
    <nav className='bg-app-surface/80 backdrop-blur-md shadow-lg border-b border-app-border-light/50 sticky top-0 z-50'>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
        <div className='flex justify-between h-16'>
          {/* Logo */}
          <div className='flex items-center'>
            <Link
              href='/'
              className='flex items-center text-3xl font-heading font-black italic text-area-primary hover:text-area-hover transition-all duration-300 hover:scale-105'
            >
              <span className='bg-gradient-to-r from-area-primary to-area-hover bg-clip-text text-transparent'>
                AREA
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className='hidden lg:flex space-x-8 items-center'>
            {navItems.map(item => (
              <Link
                key={item.href}
                href={item.href}
                className={`font-heading transition-all duration-300 relative group ${
                  pathname === item.href
                    ? 'text-area-primary font-semibold'
                    : 'text-app-text-secondary hover:text-area-primary font-medium'
                }`}
              >
                {item.label}
                <span
                  className={`absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-area-primary to-area-hover transition-all duration-300 group-hover:w-full ${
                    pathname === item.href ? 'w-full' : ''
                  }`}
                ></span>
              </Link>
            ))}
          </div>

          {/* Desktop Login */}
          <div className='hidden lg:flex w-fit pl-8 items-center space-x-4'>
            {isAuthenticated ? (
              <>
                {user?.is_admin && (
                  <button
                    onClick={handleSwitchToAdmin}
                    className='font-heading font-medium text-area-primary hover:text-area-hover transition-all duration-300 px-3 py-1.5 rounded-lg hover:bg-area-light/20'
                  >
                    Admin Area
                  </button>
                )}
                <button
                  onClick={handleSwitchToProfile}
                  className={`font-heading font-bold text-app-text-secondary hover:text-area-hover transition-all duration-300 cursor-pointer p-1.5 rounded-lg hover:bg-area-light/20 ${
                    pathname === '/profile' &&
                    'text-area-primary bg-area-light/30'
                  }`}
                >
                  <IDAvatar id={0} />
                </button>
                <button
                  onClick={handleLogout}
                  className='font-heading font-bold text-app-text-secondary hover:text-app-red-primary transition-all duration-300 cursor-pointer p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20'
                >
                  <LogOut />
                </button>
              </>
            ) : (
              <Link
                href='/login'
                className='font-heading font-medium text-app-text-secondary hover:text-area-primary transition-all duration-300 relative group'
              >
                Login
                <span className='absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-area-primary to-area-hover transition-all duration-300 group-hover:w-full'></span>
              </Link>
            )}
          </div>

          {/* Mobile menu button */}
          <div className='lg:hidden flex items-center'>
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className='text-app-text-secondary hover:text-area-primary focus:outline-none focus:text-area-primary transition-all duration-300 p-2 rounded-lg hover:bg-area-light/20'
            >
              {isMenuOpen ? (
                <X className='h-6 w-6' />
              ) : (
                <Menu className='h-6 w-6' />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {isMenuOpen && (
          <div className='lg:hidden border-t border-app-border-light/50 bg-app-surface/95 backdrop-blur-sm'>
            <div className='px-2 pt-2 pb-3 space-y-1'>
              {navItems.map(item => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsMenuOpen(false)}
                  className={`font-heading block px-3 py-2 rounded-lg text-base font-medium transition-all duration-300 ${
                    pathname === item.href
                      ? 'text-area-primary bg-area-light/30 border-l-4 border-area-primary'
                      : 'text-app-text-secondary hover:text-area-primary hover:bg-area-light/20'
                  }`}
                >
                  {item.label}
                </Link>
              ))}
              <div className='border-t border-app-border-light/50 pt-2 space-y-1'>
                {isAuthenticated ? (
                  <>
                    <button
                      onClick={() => {
                        handleSwitchToProfile();
                        setIsMenuOpen(false);
                      }}
                      className='font-heading block w-full text-left px-3 py-2 rounded-lg text-base font-bold text-app-text-secondary hover:text-area-primary hover:bg-area-light/20 transition-all duration-300'
                    >
                      Profile
                    </button>
                    <button
                      onClick={() => {
                        handleLogout();
                        setIsMenuOpen(false);
                      }}
                      className='font-heading block w-full text-left px-3 py-2 rounded-lg text-base font-bold text-app-text-secondary hover:text-app-red-primary hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-300'
                    >
                      Logout
                    </button>
                  </>
                ) : (
                  <Link
                    href='/login'
                    onClick={() => setIsMenuOpen(false)}
                    className='font-heading block px-3 py-2 rounded-lg text-base font-bold text-app-text-secondary hover:text-area-primary hover:bg-area-light/20 transition-all duration-300'
                  >
                    Login
                  </Link>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
