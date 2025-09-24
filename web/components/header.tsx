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
    <nav className='bg-app-surface shadow-sm border-b'>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
        <div className='flex justify-between h-16'>
          {/* Logo */}
          <div className='flex items-center'>
            <Link
              href='/'
              className='flex items-center text-3xl font-heading font-black italic text-area-primary hover:text-area-hover transition-colors'
            >
              <span>AREA</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className='hidden lg:flex space-x-8 items-center'>
            {navItems.map(item => (
              <Link
                key={item.href}
                href={item.href}
                className={`font-heading transition-colors ${
                  pathname === item.href
                    ? 'text-area-primary font-semibold'
                    : 'text-app-text-secondary hover:text-area-primary font-medium'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </div>

          {/* Desktop Login */}
          <div className='hidden lg:flex w-fit pl-8 items-center space-x-4'>
            {isAuthenticated ? (
              <>
                {user?.role === 'admin' && (
                  <button
                    onClick={handleSwitchToAdmin}
                    className='font-heading font-medium text-area-primary hover:text-area-hover transition-colors cursor-pointer'
                  >
                    Admin Area
                  </button>
                )}
                <button
                  onClick={handleSwitchToProfile}
                  className={`font-heading font-bold text-app-text-secondary hover:text-area-hover transition-colors cursor-pointer ${
                    pathname === '/profile' && 'text-area-primary'
                  }`}
                >
                  <IDAvatar id={0} />
                </button>
                <button
                  onClick={handleLogout}
                  className='font-heading font-bold text-app-text-secondary hover:text-app-red-primary transition-colors cursor-pointer'
                >
                  <LogOut />
                </button>
              </>
            ) : (
              <Link
                href='/login'
                className='font-heading font-bold text-app-text-secondary hover:text-area-primary'
              >
                Login
              </Link>
            )}
          </div>

          {/* Mobile menu button */}
          <div className='lg:hidden flex items-center'>
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className='text-app-text-secondary hover:text-area-primary focus:outline-none focus:text-area-primary transition-colors'
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
          <div className='lg:hidden border-t border-app-border-light bg-app-surface'>
            <div className='px-2 pt-2 pb-3 space-y-1'>
              {navItems.map(item => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsMenuOpen(false)}
                  className={`font-heading block px-3 py-2 rounded-md text-base font-medium transition-colors ${
                    pathname === item.href
                      ? 'text-area-primary bg-app-blue-light'
                      : 'text-app-text-secondary hover:text-area-primary hover:bg-app-surface-hover'
                  }`}
                >
                  {item.label}
                </Link>
              ))}
              <div className='border-t border-app-border-light pt-2 space-y-1'>
                {isAuthenticated ? (
                  <>
                    <button
                      onClick={() => {
                        handleSwitchToProfile();
                        setIsMenuOpen(false);
                      }}
                      className='font-heading block w-full text-left px-3 py-2 rounded-md text-base font-bold text-app-text-secondary hover:text-area-primary hover:bg-app-surface-hover transition-colors'
                    >
                      Profile
                    </button>
                    <button
                      onClick={() => {
                        handleLogout();
                        setIsMenuOpen(false);
                      }}
                      className='font-heading block w-full text-left px-3 py-2 rounded-md text-base font-bold text-app-text-secondary hover:text-app-red-primary hover:bg-app-surface-hover transition-colors'
                    >
                      Logout
                    </button>
                  </>
                ) : (
                  <Link
                    href='/login'
                    onClick={() => setIsMenuOpen(false)}
                    className='font-heading block px-3 py-2 rounded-md text-base font-bold text-app-text-secondary hover:text-area-primary hover:bg-app-surface-hover transition-colors'
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
