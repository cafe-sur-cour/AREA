'use client';

import { useState } from 'react';
import { Languages } from 'lucide-react';
import { useI18n } from '@/contexts/I18nContext';

interface LanguageSwitcherProps {
  className?: string;
  isMobile?: boolean;
}

export function LanguageSwitcher({
  className,
  isMobile,
}: LanguageSwitcherProps) {
  const { locale, setLocale } = useI18n();
  const [isLoading, setIsLoading] = useState(false);

  const toggleLanguage = async () => {
    const newLang = locale === 'en' ? 'fr' : 'en';
    setIsLoading(true);

    try {
      setLocale(newLang);
      // Optionally sync with backend here if needed
      // await api.post('/language', { language: newLang });
    } catch (error) {
      console.error('Failed to switch language:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={toggleLanguage}
      disabled={isLoading}
      aria-label={`Switch to ${locale === 'en' ? 'French' : 'English'}`}
      className={`relative cursor-pointer flex items-center justify-center font-heading font-bold text-app-text-secondary hover:text-area-hover transition-all duration-300 p-2 rounded-lg hover:bg-area-light/20 disabled:opacity-50 disabled:cursor-not-allowed ${className || ''} ${
        isMobile ? 'w-full gap-2' : ''
      }`}
      title={`Switch to ${locale === 'en' ? 'French' : 'English'}`}
    >
      <Languages
        className={`${isMobile ? 'h-5 w-5' : 'h-5 w-5'} ${isLoading ? 'animate-spin' : ''}`}
      />
      {isMobile && (
        <span className='text-app-text-secondary uppercase text-sm'>
          {locale.toUpperCase()}
        </span>
      )}
      {!isMobile && (
        <span className='ml-1 text-xs font-medium uppercase'>
          {locale.toUpperCase()}
        </span>
      )}
    </button>
  );
}
