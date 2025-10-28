'use client';

import { useState, useEffect } from 'react';
import { Languages } from 'lucide-react';
import { useI18n } from '@/contexts/I18nContext';
import { api } from '@/lib/api';

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

  useEffect(() => {
    const fetchCurrentLanguage = async () => {
      try {
        const response = await api.get<{ language: string }>({
          endpoint: '/language',
        });
        if (
          response.data?.language &&
          (response.data.language === 'en' || response.data.language === 'fr')
        ) {
          setLocale(response.data.language);
        }
      } catch (error) {
        console.error('Failed to fetch language:', error);
        const savedLocale = localStorage.getItem('area-language') as
          | 'en'
          | 'fr';
        if (savedLocale && (savedLocale === 'en' || savedLocale === 'fr')) {
          setLocale(savedLocale);
        }
      }
    };

    fetchCurrentLanguage();
  }, [setLocale]);

  const toggleLanguage = async () => {
    const newLang = locale === 'en' ? 'fr' : 'en';
    setIsLoading(true);

    try {
      await api.post('/language', { language: newLang });
      setLocale(newLang);
      localStorage.setItem('area-language', newLang);
    } catch (error) {
      console.error('Failed to switch language:', error);
      setLocale(newLang);
      localStorage.setItem('area-language', newLang);
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
