'use client';

import { useState, useEffect } from 'react';
import { Languages } from 'lucide-react';

interface LanguageSwitcherProps {
  className?: string;
  isMobile?: boolean;
}

export function LanguageSwitcher({
  className,
  isMobile,
}: LanguageSwitcherProps) {
  const [currentLang, setCurrentLang] = useState<'en' | 'fr'>('en');

  useEffect(() => {
    const savedLang = localStorage.getItem('area-language') as
      | 'en'
      | 'fr'
      | null;
    if (savedLang) {
      setCurrentLang(savedLang);
    }
  }, []);

  const toggleLanguage = () => {
    const newLang = currentLang === 'en' ? 'fr' : 'en';

    localStorage.setItem('area-language', newLang);
    setCurrentLang(newLang);

    const currentUrl = new URL(window.location.href);
    currentUrl.searchParams.set('lang', newLang);
    window.location.href = currentUrl.toString();
  };

  return (
    <button
      onClick={toggleLanguage}
      aria-label={`Switch to ${currentLang === 'en' ? 'French' : 'English'}`}
      className={`relative cursor-pointer flex items-center justify-center font-heading font-bold text-app-text-secondary hover:text-area-hover transition-all duration-300 p-2 rounded-lg hover:bg-area-light/20 ${className || ''} ${
        isMobile ? 'w-full gap-2' : ''
      }`}
      title={`Switch to ${currentLang === 'en' ? 'French' : 'English'}`}
    >
      <Languages className={`${isMobile ? 'h-5 w-5' : 'h-5 w-5'}`} />
      {isMobile && (
        <span className='text-app-text-secondary uppercase text-sm'>
          {currentLang === 'en' ? 'FR' : 'EN'}
        </span>
      )}
      {!isMobile && (
        <span className='ml-1 text-xs font-medium uppercase'>
          {currentLang === 'en' ? 'FR' : 'EN'}
        </span>
      )}
    </button>
  );
}
