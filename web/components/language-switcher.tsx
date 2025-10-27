'use client';

import { useI18n } from '@/contexts/I18nContext';
import { Globe } from 'lucide-react';

const languages = [
  { code: 'en' as const, name: 'English', flag: '🇬🇧' },
  { code: 'fr' as const, name: 'Français', flag: '🇫🇷' },
];

export default function LanguageSwitcher() {
  const { locale, setLocale } = useI18n();

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newLocale = e.target.value as 'en' | 'fr';
    setLocale(newLocale);
  };

  return (
    <div className='flex items-center gap-2'>
      <Globe className='h-4 w-4 text-muted-foreground' />
      <select
        value={locale}
        onChange={handleLanguageChange}
        className='bg-transparent border border-border rounded-md px-2 py-1 text-sm cursor-pointer hover:bg-accent transition-colors'
      >
        {languages.map(language => (
          <option key={language.code} value={language.code}>
            {language.flag} {language.name}
          </option>
        ))}
      </select>
    </div>
  );
}
