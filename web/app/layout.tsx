import type { Metadata } from 'next';
import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getMessages } from 'next-intl/server';
import { AuthProvider } from '@/contexts/AuthContext';
import { I18nProvider } from '@/contexts/I18nContext';
import { Toaster } from '@/components/ui/sonner';
import { Montserrat, Open_Sans } from 'next/font/google';
import DownloadAPPButton from '@/components/download-app-button';
import './globals.css';

const montserrat = Montserrat({
  variable: '--font-montserrat',
  subsets: ['latin'],
});

const openSans = Open_Sans({
  variable: '--font-open-sans',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Area',
  description: 'Area web application TEK3 project',
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html lang={locale}>
      <meta name='apple-mobile-web-app-title' content='Area' />
      <link rel='icon' href='/favicon.ico' sizes='any' />
      <body
        className={`${montserrat.variable} ${openSans.variable} antialiased font-sans`}
      >
        <NextIntlClientProvider messages={messages}>
          <I18nProvider>
            <AuthProvider>{children}</AuthProvider>
          </I18nProvider>
        </NextIntlClientProvider>
        <Toaster />
        <DownloadAPPButton />
      </body>
    </html>
  );
}
