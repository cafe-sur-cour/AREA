'use client';

import { Button } from '@/components/ui/button';
import Navigation from '@/components/header';
import InfiniteHorizontalCards from '@/components/infinite-horizontal-cards';
import { ArrowRight, Zap, Clock, Shield } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/contexts/I18nContext';
import Link from 'next/link';

export default function Home() {
  const { isAuthenticated } = useAuth();
  const { t } = useI18n();

  return (
    <div className='min-h-screen bg-background'>
      <Navigation />

      {/* Hero Section */}
      <main>
        <section className='relative px-4 sm:px-6 lg:px-8 pt-20 pb-32'>
          <div className='max-w-7xl mx-auto'>
            <div className='text-center max-w-4xl mx-auto'>
              <h1 className='text-5xl sm:text-6xl lg:text-7xl font-heading font-bold text-foreground mb-6 text-balance'>
                {t.home.hero.title}
              </h1>
              <p className='text-lg sm:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto text-pretty'>
                {t.home.hero.description}
              </p>
              <div className='flex flex-col sm:flex-row gap-4 justify-center items-center'>
                {!isAuthenticated ? (
                  <>
                    <Button
                      asChild
                      size='lg'
                      className='text-base px-8 cursor-pointer'
                    >
                      <Link href='/register'>
                        {t.home.hero.getStarted}
                        <ArrowRight className='ml-2 h-5 w-5' />
                      </Link>
                    </Button>
                    <Button
                      asChild
                      variant='outline'
                      size='lg'
                      className='text-base px-8 bg-transparent cursor-pointer'
                    >
                      <Link href='/login'>{t.home.hero.signIn}</Link>
                    </Button>
                  </>
                ) : (
                  <Button
                    asChild
                    size='lg'
                    className='text-base px-8 cursor-pointer'
                  >
                    <Link href='/dashboard'>
                      {t.home.hero.goToDashboard}
                      <ArrowRight className='ml-2 h-5 w-5' />
                    </Link>
                  </Button>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className='border-t border-border'>
          <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16'>
            <div className='grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12'>
              <div className='text-center md:text-left'>
                <h2 className='text-4xl font-heading font-bold text-foreground mb-2'>
                  10M+
                </h2>
                <div className='text-muted-foreground'>
                  {t.home.stats.automations}
                </div>
              </div>
              <div className='text-center md:text-left'>
                <h2 className='text-4xl font-heading font-bold text-foreground mb-2'>
                  500+
                </h2>
                <div className='text-muted-foreground'>
                  {t.home.stats.services}
                </div>
              </div>
              <div className='text-center md:text-left'>
                <h2 className='text-4xl font-heading font-bold text-foreground mb-2'>
                  2M+
                </h2>
                <div className='text-muted-foreground'>
                  {t.home.stats.users}
                </div>
              </div>
            </div>
          </div>
        </section>
        {/* Infinite Horizontal Cards */}
        <section className='px-4 sm:px-6 lg:px-8 py-24 bg-muted/30'>
          <div className='max-w-7xl mx-auto'>
            <div className='text-center mb-16'>
              <h2 className='text-3xl sm:text-4xl lg:text-5xl font-heading font-bold text-foreground mb-4'>
                {t.home.services.title}
              </h2>
              <p className='text-lg text-muted-foreground max-w-2xl mx-auto'>
                {t.home.services.description}
              </p>
            </div>
            <div className='m-5x w-4xl max-w-full mx-auto'>
              <InfiniteHorizontalCards />
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className='px-4 sm:px-6 lg:px-8 py-24 bg-muted/30'>
          <div className='max-w-7xl mx-auto'>
            <div className='text-center mb-16'>
              <h2
                id='how-it-works-heading'
                className='text-3xl sm:text-4xl lg:text-5xl font-heading font-bold text-foreground mb-4'
              >
                {t.home.howItWorks.title}
              </h2>
              <h2
                className='text-lg text-muted-foreground max-w-2xl mx-auto'
                aria-labelledby='how-it-works-heading'
                aria-hidden='false'
              >
                {t.home.howItWorks.subtitle}
              </h2>
            </div>

            <div className='grid grid-cols-1 md:grid-cols-3 gap-8'>
              {/* Step 1 */}
              <div className='bg-card border border-border rounded-lg p-8 text-center'>
                <h3 className='inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary text-primary-foreground mb-6 text-2xl font-heading font-bold'>
                  1
                </h3>
                <h4 className='text-xl font-heading font-semibold text-foreground mb-3'>
                  {t.home.howItWorks.step1.title}
                </h4>
                <p className='text-muted-foreground'>
                  {t.home.howItWorks.step1.description}
                </p>
              </div>

              {/* Step 2 */}
              <div className='bg-card border border-border rounded-lg p-8 text-center'>
                <h3 className='inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary text-primary-foreground mb-6 text-2xl font-heading font-bold'>
                  2
                </h3>
                <h4 className='text-xl font-heading font-semibold text-foreground mb-3'>
                  {t.home.howItWorks.step2.title}
                </h4>
                <p className='text-muted-foreground'>
                  {t.home.howItWorks.step2.description}
                </p>
              </div>

              {/* Step 3 */}
              <div className='bg-card border border-border rounded-lg p-8 text-center'>
                <h3 className='inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary text-primary-foreground mb-6 text-2xl font-heading font-bold'>
                  3
                </h3>
                <h4 className='text-xl font-heading font-semibold text-foreground mb-3'>
                  {t.home.howItWorks.step3.title}
                </h4>
                <p className='text-muted-foreground'>
                  {t.home.howItWorks.step3.description}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Popular Automations */}
        <section className='px-4 sm:px-6 lg:px-8 py-24'>
          <div className='max-w-7xl mx-auto'>
            <div className='text-center mb-16'>
              <h2
                id='popular-automations-heading'
                className='text-3xl sm:text-4xl lg:text-5xl font-heading font-bold text-foreground mb-4'
              >
                {t.home.popularAutomations.title}
              </h2>
              <h2
                className='text-lg text-muted-foreground max-w-2xl mx-auto'
                aria-labelledby='popular-automations-heading'
                aria-hidden='false'
              >
                {t.home.popularAutomations.subtitle}
              </h2>
            </div>

            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
              {[
                {
                  title: t.home.popularAutomations.emailToSlack.title,
                  description:
                    t.home.popularAutomations.emailToSlack.description,
                  icon: '📧',
                },
                {
                  title: t.home.popularAutomations.socialMediaSync.title,
                  description:
                    t.home.popularAutomations.socialMediaSync.description,
                  icon: '📱',
                },
                {
                  title: t.home.popularAutomations.calendarReminders.title,
                  description:
                    t.home.popularAutomations.calendarReminders.description,
                  icon: '📅',
                },
                {
                  title: t.home.popularAutomations.fileBackup.title,
                  description: t.home.popularAutomations.fileBackup.description,
                  icon: '💾',
                },
                {
                  title: t.home.popularAutomations.taskManagement.title,
                  description:
                    t.home.popularAutomations.taskManagement.description,
                  icon: '✅',
                },
                {
                  title: t.home.popularAutomations.dataCollection.title,
                  description:
                    t.home.popularAutomations.dataCollection.description,
                  icon: '📊',
                },
              ].map((automation, index) => (
                <div
                  key={index}
                  className='bg-card border border-border rounded-lg p-6 hover:border-primary/50 transition-colors cursor-pointer group'
                >
                  <span
                    className='text-4xl mb-4 block'
                    role='presentation'
                    aria-hidden='true'
                  >
                    {automation.icon}
                  </span>
                  <h3 className='text-lg font-heading font-semibold text-foreground mb-2 group-hover:text-primary transition-colors'>
                    {automation.title}
                  </h3>
                  <p className='text-muted-foreground text-sm'>
                    {automation.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features */}
        <section className='px-4 sm:px-6 lg:px-8 py-24 bg-muted/30'>
          <div className='max-w-7xl mx-auto'>
            <div className='grid grid-cols-1 lg:grid-cols-3 gap-12'>
              <div className='text-center lg:text-left'>
                <div className='inline-flex items-center justify-center w-12 h-12 rounded-lg bg-chart-1/10 text-chart-1 mb-4'>
                  <Zap className='h-6 w-6' />
                </div>
                <h3 className='text-xl font-heading font-semibold text-foreground mb-3'>
                  {t.home.features.lightningFast.title}
                </h3>
                <p className='text-muted-foreground'>
                  {t.home.features.lightningFast.description}
                </p>
              </div>

              <div className='text-center lg:text-left'>
                <div className='inline-flex items-center justify-center w-12 h-12 rounded-lg bg-chart-2/10 text-chart-2 mb-4'>
                  <Clock className='h-6 w-6' />
                </div>
                <h3 className='text-xl font-heading font-semibold text-foreground mb-3'>
                  {t.home.features.saveTime.title}
                </h3>
                <p className='text-muted-foreground'>
                  {t.home.features.saveTime.description}
                </p>
              </div>

              <div className='text-center lg:text-left'>
                <div className='inline-flex items-center justify-center w-12 h-12 rounded-lg bg-chart-4/10 text-chart-4 mb-4'>
                  <Shield className='h-6 w-6' />
                </div>
                <h3 className='text-xl font-heading font-semibold text-foreground mb-3'>
                  {t.home.features.secureReliable.title}
                </h3>
                <p className='text-muted-foreground'>
                  {t.home.features.secureReliable.description}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className='px-4 sm:px-6 lg:px-8 py-24'>
          <div className='max-w-4xl mx-auto text-center'>
            <h2 className='text-3xl sm:text-4xl lg:text-5xl font-heading font-bold text-foreground mb-6'>
              {t.home.cta.title}
            </h2>
            <p className='text-lg text-muted-foreground mb-10 max-w-2xl mx-auto'>
              {t.home.cta.description}
            </p>
            {isAuthenticated ? (
              <Button
                asChild
                size='lg'
                className='text-base px-8 cursor-pointer'
              >
                <Link href='/my-areas'>
                  {t.home.cta.goToMyAreas}
                  <ArrowRight className='ml-2 h-5 w-5' />
                </Link>
              </Button>
            ) : (
              <Button
                asChild
                size='lg'
                className='text-base px-8 cursor-pointer'
              >
                <Link href='/register'>
                  {t.home.cta.startFree}
                  <ArrowRight className='ml-2 h-5 w-5' />
                </Link>
              </Button>
            )}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className='border-t border-border px-4 sm:px-6 lg:px-8 py-12'>
        <div className='max-w-7xl mx-auto text-center text-muted-foreground text-sm'>
          <p>{t.home.footer.copyright}</p>
        </div>
      </footer>
    </div>
  );
}
