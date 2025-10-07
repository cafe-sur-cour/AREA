'use client';

import { NavLinks } from './NavLinks';
import { UserActions } from './UserActions';
import { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';
import Image from 'next/image';

export default function Navigation() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav
      className={`sticky top-0 left-0 w-full z-50 transition-all duration-300 ${
        scrolled ? 'bg-card border-b border-border shadow-md' : 'bg-transparent'
      }`}
    >
      <div className='flex h-20 items-center justify-between px-6 sm:px-8 max-w-7xl mx-auto'>
        {/* Desktop */}
        <div className='hidden lg:flex items-center justify-between w-full'>
          <Image
            src='/base-logo-transparent.png'
            width={90}
            height={90}
            alt='Logo'
          />
          <NavLinks className='flex gap-6' />
          <UserActions className='flex gap-4' />
        </div>

        {/* Mobile burger */}
        <h1 className='lg:hidden flex items-center justify-start w-full text-primary font-bold text-xl font-heading'>
          Area
        </h1>
        <div className='lg:hidden w-full flex items-center justify-end'>
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label='Toggle Menu'
            className='text-foreground hover:text-primary focus:outline-none focus:text-primary transition-all duration-300 p-3 rounded-lg hover:bg-muted cursor-pointer flex items-center gap-2'
          >
            {isMenuOpen ? (
              <X className='h-7 w-7' />
            ) : (
              <Menu className='h-7 w-7' />
            )}
            <span className='text-xs font-medium'>Menu</span>
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className='lg:hidden pt-6 pb-6 space-y-6 border-t border-border mt-2 bg-card rounded-lg shadow-lg border'>
          <NavLinks className='flex flex-col space-y-3' isMobile />
          <div className='border-t border-border mx-8'></div>
          <UserActions className='flex flex-col space-y-3' isMobile />
        </div>
      )}
    </nav>
  );
}
