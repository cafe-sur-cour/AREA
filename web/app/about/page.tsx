'use client';

import Navigation from '@/components/header';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  ArrowRight,
  Users,
  Target,
  Zap,
  Shield,
  Globe,
  Heart,
  Code,
  Rocket,
  Award,
} from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/contexts/I18nContext';

export default function AboutPage() {
  const { isAuthenticated } = useAuth();
  const { t } = useI18n();

  return (
    <div className='min-h-screen bg-background'>
      <Navigation />

      <main>
        <section className='relative px-4 sm:px-6 lg:px-8 pt-20 pb-24'>
          <div className='max-w-7xl mx-auto'>
            <div className='text-center max-w-4xl mx-auto'>
              <h1 className='text-5xl sm:text-6xl lg:text-7xl font-heading font-bold text-foreground mb-6 text-balance'>
                {t.about.hero.title} <span className='text-primary'>{t.about.hero.titleHighlight}</span>
              </h1>
              <p className='text-lg sm:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto text-pretty'>
                {t.about.hero.description}
              </p>
            </div>
          </div>
        </section>

        <section className='px-4 sm:px-6 lg:px-8 py-16 bg-muted/30'>
          <div className='max-w-7xl mx-auto'>
            <div className='grid grid-cols-1 lg:grid-cols-2 gap-12 items-center'>
              <div>
                <div className='inline-flex items-center justify-center w-16 h-16 rounded-lg bg-primary/10 text-primary mb-6'>
                  <Target className='h-8 w-8' />
                </div>
                <h2 className='text-3xl sm:text-4xl font-heading font-bold text-foreground mb-4'>
                  {t.about.mission.title}
                </h2>
                <p className='text-lg text-muted-foreground mb-4'>
                  {t.about.mission.description1}
                </p>
                <p className='text-lg text-muted-foreground'>
                  {t.about.mission.description2}
                </p>
              </div>
              <div className='grid grid-cols-2 gap-4'>
                <Card className='bg-card border-border'>
                  <CardContent className='p-6'>
                    <div className='text-4xl font-heading font-bold text-primary mb-2'>
                      2M+
                    </div>
                    <div className='text-muted-foreground'>{t.about.mission.stats.users}</div>
                  </CardContent>
                </Card>
                <Card className='bg-card border-border'>
                  <CardContent className='p-6'>
                    <div className='text-4xl font-heading font-bold text-primary mb-2'>
                      10M+
                    </div>
                    <div className='text-muted-foreground'>{t.about.mission.stats.automations}</div>
                  </CardContent>
                </Card>
                <Card className='bg-card border-border'>
                  <CardContent className='p-6'>
                    <div className='text-4xl font-heading font-bold text-primary mb-2'>
                      500+
                    </div>
                    <div className='text-muted-foreground'>{t.about.mission.stats.integrations}</div>
                  </CardContent>
                </Card>
                <Card className='bg-card border-border'>
                  <CardContent className='p-6'>
                    <div className='text-4xl font-heading font-bold text-primary mb-2'>
                      99.9%
                    </div>
                    <div className='text-muted-foreground'>{t.about.mission.stats.uptime}</div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>

        <section className='px-4 sm:px-6 lg:px-8 py-24'>
          <div className='max-w-7xl mx-auto'>
            <div className='text-center mb-16'>
              <h2 className='text-3xl sm:text-4xl lg:text-5xl font-heading font-bold text-foreground mb-4'>
                {t.about.values.title}
              </h2>
              <p className='text-lg text-muted-foreground max-w-2xl mx-auto'>
                {t.about.values.subtitle}
              </p>
            </div>

            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8'>
              <Card className='bg-card border-border hover:border-primary/50 transition-colors'>
                <CardContent className='p-6'>
                  <div className='inline-flex items-center justify-center w-12 h-12 rounded-lg bg-chart-1/10 text-chart-1 mb-4'>
                    <Users className='h-6 w-6' />
                  </div>
                  <h3 className='text-xl font-heading font-semibold text-foreground mb-3'>
                    {t.about.values.userCentric.title}
                  </h3>
                  <p className='text-muted-foreground'>
                    {t.about.values.userCentric.description}
                  </p>
                </CardContent>
              </Card>

              <Card className='bg-card border-border hover:border-primary/50 transition-colors'>
                <CardContent className='p-6'>
                  <div className='inline-flex items-center justify-center w-12 h-12 rounded-lg bg-chart-2/10 text-chart-2 mb-4'>
                    <Zap className='h-6 w-6' />
                  </div>
                  <h3 className='text-xl font-heading font-semibold text-foreground mb-3'>
                    {t.about.values.innovation.title}
                  </h3>
                  <p className='text-muted-foreground'>
                    {t.about.values.innovation.description}
                  </p>
                </CardContent>
              </Card>

              <Card className='bg-card border-border hover:border-primary/50 transition-colors'>
                <CardContent className='p-6'>
                  <div className='inline-flex items-center justify-center w-12 h-12 rounded-lg bg-chart-3/10 text-chart-3 mb-4'>
                    <Shield className='h-6 w-6' />
                  </div>
                  <h3 className='text-xl font-heading font-semibold text-foreground mb-3'>
                    {t.about.values.security.title}
                  </h3>
                  <p className='text-muted-foreground'>
                    {t.about.values.security.description}
                  </p>
                </CardContent>
              </Card>

              <Card className='bg-card border-border hover:border-primary/50 transition-colors'>
                <CardContent className='p-6'>
                  <div className='inline-flex items-center justify-center w-12 h-12 rounded-lg bg-chart-4/10 text-chart-4 mb-4'>
                    <Globe className='h-6 w-6' />
                  </div>
                  <h3 className='text-xl font-heading font-semibold text-foreground mb-3'>
                    {t.about.values.global.title}
                  </h3>
                  <p className='text-muted-foreground'>
                    {t.about.values.global.description}
                  </p>
                </CardContent>
              </Card>

              <Card className='bg-card border-border hover:border-primary/50 transition-colors'>
                <CardContent className='p-6'>
                  <div className='inline-flex items-center justify-center w-12 h-12 rounded-lg bg-chart-5/10 text-chart-5 mb-4'>
                    <Code className='h-6 w-6' />
                  </div>
                  <h3 className='text-xl font-heading font-semibold text-foreground mb-3'>
                    {t.about.values.openSource.title}
                  </h3>
                  <p className='text-muted-foreground'>
                    {t.about.values.openSource.description}
                  </p>
                </CardContent>
              </Card>

              <Card className='bg-card border-border hover:border-primary/50 transition-colors'>
                <CardContent className='p-6'>
                  <div className='inline-flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10 text-primary mb-4'>
                    <Heart className='h-6 w-6' />
                  </div>
                  <h3 className='text-xl font-heading font-semibold text-foreground mb-3'>
                    {t.about.values.passion.title}
                  </h3>
                  <p className='text-muted-foreground'>
                    {t.about.values.passion.description}
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        <section className='px-4 sm:px-6 lg:px-8 py-24 bg-muted/30'>
          <div className='max-w-4xl mx-auto'>
            <div className='text-center mb-12'>
              <div className='inline-flex items-center justify-center w-16 h-16 rounded-lg bg-primary/10 text-primary mb-6'>
                <Rocket className='h-8 w-8' />
              </div>
              <h2 className='text-3xl sm:text-4xl font-heading font-bold text-foreground mb-4'>
                {t.about.story.title}
              </h2>
            </div>
            <div className='prose prose-lg max-w-none text-muted-foreground'>
              <p className='text-lg mb-4'>
                {t.about.story.paragraph1}
              </p>
              <p className='text-lg mb-4'>
                {t.about.story.paragraph2}
              </p>
              <p className='text-lg mb-4'>
                {t.about.story.paragraph3}
              </p>
              <p className='text-lg'>
                {t.about.story.paragraph4}
              </p>
            </div>
          </div>
        </section>

        <section className='px-4 sm:px-6 lg:px-8 py-24'>
          <div className='max-w-7xl mx-auto'>
            <div className='text-center mb-16'>
              <h2 className='text-3xl sm:text-4xl lg:text-5xl font-heading font-bold text-foreground mb-4'>
                {t.about.technology.title}
              </h2>
              <p className='text-lg text-muted-foreground max-w-2xl mx-auto'>
                {t.about.technology.subtitle}
              </p>
            </div>

            <div className='grid grid-cols-2 md:grid-cols-4 gap-6'>
              {[
                { name: 'Next.js', icon: '⚡' },
                { name: 'TypeScript', icon: '📘' },
                { name: 'Flutter', icon: '📱' },
                { name: 'Express', icon: '🚂' },
                { name: 'PostgreSQL', icon: '🐘' },
                { name: 'Docker', icon: '🐳' },
                { name: 'GitHub Actions', icon: '🔄' },
                { name: 'Tailwind CSS', icon: '🎨' },
              ].map((tech, index) => (
                <Card
                  key={index}
                  className='bg-card border-border hover:border-primary/50 transition-colors'
                >
                  <CardContent className='p-6 text-center'>
                    <div
                      className='text-4xl mb-3'
                      role='presentation'
                      aria-hidden='true'
                    >
                      {tech.icon}
                    </div>
                    <h3 className='font-heading font-semibold text-foreground'>
                      {tech.name}
                    </h3>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className='px-4 sm:px-6 lg:px-8 py-24 bg-muted/30'>
          <div className='max-w-7xl mx-auto'>
            <div className='text-center mb-16'>
              <h2 className='text-3xl sm:text-4xl lg:text-5xl font-heading font-bold text-foreground mb-4'>
                {t.about.whyChoose.title}
              </h2>
              <p className='text-lg text-muted-foreground max-w-2xl mx-auto'>
                {t.about.whyChoose.subtitle}
              </p>
            </div>

            <div className='grid grid-cols-1 md:grid-cols-2 gap-8'>
              <Card className='bg-card border-border'>
                <CardContent className='p-8'>
                  <div className='inline-flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10 text-primary mb-4'>
                    <Award className='h-6 w-6' />
                  </div>
                  <h3 className='text-xl font-heading font-semibold text-foreground mb-3'>
                    {t.about.whyChoose.easyToUse.title}
                  </h3>
                  <p className='text-muted-foreground'>
                    {t.about.whyChoose.easyToUse.description}
                  </p>
                </CardContent>
              </Card>

              <Card className='bg-card border-border'>
                <CardContent className='p-8'>
                  <div className='inline-flex items-center justify-center w-12 h-12 rounded-lg bg-chart-2/10 text-chart-2 mb-4'>
                    <Zap className='h-6 w-6' />
                  </div>
                  <h3 className='text-xl font-heading font-semibold text-foreground mb-3'>
                    {t.about.whyChoose.lightningFast.title}
                  </h3>
                  <p className='text-muted-foreground'>
                    {t.about.whyChoose.lightningFast.description}
                  </p>
                </CardContent>
              </Card>

              <Card className='bg-card border-border'>
                <CardContent className='p-8'>
                  <div className='inline-flex items-center justify-center w-12 h-12 rounded-lg bg-chart-3/10 text-chart-3 mb-4'>
                    <Shield className='h-6 w-6' />
                  </div>
                  <h3 className='text-xl font-heading font-semibold text-foreground mb-3'>
                    {t.about.whyChoose.enterpriseSecurity.title}
                  </h3>
                  <p className='text-muted-foreground'>
                    {t.about.whyChoose.enterpriseSecurity.description}
                  </p>
                </CardContent>
              </Card>

              <Card className='bg-card border-border'>
                <CardContent className='p-8'>
                  <div className='inline-flex items-center justify-center w-12 h-12 rounded-lg bg-chart-4/10 text-chart-4 mb-4'>
                    <Users className='h-6 w-6' />
                  </div>
                  <h3 className='text-xl font-heading font-semibold text-foreground mb-3'>
                    {t.about.whyChoose.amazingSupport.title}
                  </h3>
                  <p className='text-muted-foreground'>
                    {t.about.whyChoose.amazingSupport.description}
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        <section className='px-4 sm:px-6 lg:px-8 py-24'>
          <div className='max-w-4xl mx-auto text-center'>
            <h2 className='text-3xl sm:text-4xl lg:text-5xl font-heading font-bold text-foreground mb-6'>
                {t.about.cta.title}
            </h2>
            <p className='text-lg text-muted-foreground mb-10 max-w-2xl mx-auto'>
              {t.about.cta.description}
            </p>
            {isAuthenticated ? (
              <Button
                asChild
                size='lg'
                className='text-base px-8 cursor-pointer'
              >
                <Link href='/dashboard'>
                  {t.about.cta.buttonDashboard}
                  <ArrowRight className='ml-2 h-5 w-5' />
                </Link>
              </Button>
            ) : (
              <div className='flex flex-col sm:flex-row gap-4 justify-center'>
                <Button
                  asChild
                  size='lg'
                  className='text-base px-8 cursor-pointer'
                >
                  <Link href='/register'>
                    {t.about.cta.buttonStart}
                    <ArrowRight className='ml-2 h-5 w-5' />
                  </Link>
                </Button>
                <Button
                  asChild
                  variant='outline'
                  size='lg'
                  className='text-base px-8 cursor-pointer'
                >
                  <Link href='/services'>{t.about.cta.buttonExplore}</Link>
                </Button>
              </div>
            )}
          </div>
        </section>
      </main>

      <footer className='border-t border-border px-4 sm:px-6 lg:px-8 py-12'>
        <div className='max-w-7xl mx-auto text-center text-muted-foreground text-sm'>
          <p>&copy; {t.about.footer.copyright}</p>
        </div>
      </footer>
    </div>
  );
}
