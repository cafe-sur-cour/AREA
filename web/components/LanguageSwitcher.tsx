'use client';

import { useState, useEffect } from 'react';
import { Languages } from 'lucide-react';
import { api } from '@/lib/api';

interface LanguageSwitcherProps {
  className?: string;
  isMobile?: boolean;
}

export function LanguageSwitcher({
  className,
  isMobile,
}: LanguageSwitcherProps) {
  const [currentLang, setCurrentLang] = useState<string>('en');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchCurrentLanguage = async () => {
      try {
        const response = await api.get<{ language: string }>({
          endpoint: '/language',
        });
        if (
          response.data?.language &&
          ['en', 'fr'].includes(response.data.language)
        ) {
          const backendLang = response.data.language as 'en' | 'fr';
          setCurrentLang(backendLang);
          document.cookie = `i18next=${backendLang}; path=/; max-age=31536000, SameSite=Strict`;
        }
      } catch (error) {
        console.warn(
          'Failed to fetch language from backend, using cookie:',
          error
        );

        let savedLang = document.cookie.split('; ').find(row => row.startsWith('i18next='));
        savedLang = savedLang ? savedLang.split('=')[1] : undefined;
        if (savedLang === undefined) {
          savedLang = 'en';
          document.cookie = `i18next=${savedLang}; path=/; max-age=31536000, SameSite=Strict`;
        }
        setCurrentLang(savedLang);
      }
    };

    fetchCurrentLanguage();
  }, []);

  const toggleLanguage = async () => {
    const newLang = currentLang === 'en' ? 'fr' : 'en';
    setIsLoading(true);

    try {
      await api.post('/language', { language: newLang });

      document.cookie = `i18next=${newLang}; path=/; max-age=31536000, SameSite=Strict`;
      setCurrentLang(newLang);

      window.location.reload();
    } catch (error) {
      console.error('Failed to switch language:', error);

      document.cookie = `i18next=${newLang}; path=/; max-age=31536000, SameSite=Strict`;
      setCurrentLang(newLang);
      window.location.reload();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={toggleLanguage}
      disabled={isLoading}
      aria-label={`Switch to ${currentLang === 'en' ? 'French' : 'English'}`}
      className={`relative cursor-pointer flex items-center justify-center font-heading font-bold text-app-text-secondary hover:text-area-hover transition-all duration-300 p-2 rounded-lg hover:bg-area-light/20 disabled:opacity-50 disabled:cursor-not-allowed ${className || ''} ${
        isMobile ? 'w-full gap-2' : ''
      }`}
      title={`Switch to ${currentLang === 'en' ? 'French' : 'English'}`}
    >
      <Languages
        className={`${isMobile ? 'h-5 w-5' : 'h-5 w-5'} ${isLoading ? 'animate-spin' : ''}`}
      />
      {isMobile && (
        <span className='text-app-text-secondary uppercase text-sm'>
          {currentLang.toUpperCase()}
        </span>
      )}
      {!isMobile && (
        <span className='ml-1 text-xs font-medium uppercase'>
          {currentLang.toUpperCase()}
        </span>
      )}
    </button>
  );
}
