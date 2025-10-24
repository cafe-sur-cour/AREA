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

export default function AboutPage() {
  const { isAuthenticated } = useAuth();

  return (
    <div className='min-h-screen bg-background'>
      <Navigation />

      <main>
        <section className='relative px-4 sm:px-6 lg:px-8 pt-20 pb-24'>
          <div className='max-w-7xl mx-auto'>
            <div className='text-center max-w-4xl mx-auto'>
              <h1 className='text-5xl sm:text-6xl lg:text-7xl font-heading font-bold text-foreground mb-6 text-balance'>
                About <span className='text-primary'>AREA</span>
              </h1>
              <p className='text-lg sm:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto text-pretty'>
                We're building the future of automation by connecting the apps
                and services you love, making your digital life seamless and
                efficient.
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
                  Our Mission
                </h2>
                <p className='text-lg text-muted-foreground mb-4'>
                  At AREA, we believe that technology should work for you, not
                  the other way around. Our mission is to empower individuals
                  and teams to automate repetitive tasks and create powerful
                  connections between their favorite apps.
                </p>
                <p className='text-lg text-muted-foreground'>
                  We're democratizing automation by making it accessible to
                  everyone, regardless of technical expertise. Whether you're a
                  developer, a business professional, or just someone looking to
                  save time, AREA is here to help you work smarter.
                </p>
              </div>
              <div className='grid grid-cols-2 gap-4'>
                <Card className='bg-card border-border'>
                  <CardContent className='p-6'>
                    <div className='text-4xl font-heading font-bold text-primary mb-2'>
                      2M+
                    </div>
                    <div className='text-muted-foreground'>Active Users</div>
                  </CardContent>
                </Card>
                <Card className='bg-card border-border'>
                  <CardContent className='p-6'>
                    <div className='text-4xl font-heading font-bold text-primary mb-2'>
                      10M+
                    </div>
                    <div className='text-muted-foreground'>Automations</div>
                  </CardContent>
                </Card>
                <Card className='bg-card border-border'>
                  <CardContent className='p-6'>
                    <div className='text-4xl font-heading font-bold text-primary mb-2'>
                      500+
                    </div>
                    <div className='text-muted-foreground'>Integrations</div>
                  </CardContent>
                </Card>
                <Card className='bg-card border-border'>
                  <CardContent className='p-6'>
                    <div className='text-4xl font-heading font-bold text-primary mb-2'>
                      99.9%
                    </div>
                    <div className='text-muted-foreground'>Uptime</div>
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
                Our Values
              </h2>
              <p className='text-lg text-muted-foreground max-w-2xl mx-auto'>
                These core principles guide everything we do
              </p>
            </div>

            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8'>
              <Card className='bg-card border-border hover:border-primary/50 transition-colors'>
                <CardContent className='p-6'>
                  <div className='inline-flex items-center justify-center w-12 h-12 rounded-lg bg-chart-1/10 text-chart-1 mb-4'>
                    <Users className='h-6 w-6' />
                  </div>
                  <h3 className='text-xl font-heading font-semibold text-foreground mb-3'>
                    User-Centric
                  </h3>
                  <p className='text-muted-foreground'>
                    We put our users first in every decision we make. Your
                    feedback drives our product evolution and helps us build
                    features that truly matter.
                  </p>
                </CardContent>
              </Card>

              <Card className='bg-card border-border hover:border-primary/50 transition-colors'>
                <CardContent className='p-6'>
                  <div className='inline-flex items-center justify-center w-12 h-12 rounded-lg bg-chart-2/10 text-chart-2 mb-4'>
                    <Zap className='h-6 w-6' />
                  </div>
                  <h3 className='text-xl font-heading font-semibold text-foreground mb-3'>
                    Innovation
                  </h3>
                  <p className='text-muted-foreground'>
                    We constantly push boundaries to bring you the latest
                    automation capabilities. Our team stays ahead of technology
                    trends to deliver cutting-edge solutions.
                  </p>
                </CardContent>
              </Card>

              <Card className='bg-card border-border hover:border-primary/50 transition-colors'>
                <CardContent className='p-6'>
                  <div className='inline-flex items-center justify-center w-12 h-12 rounded-lg bg-chart-3/10 text-chart-3 mb-4'>
                    <Shield className='h-6 w-6' />
                  </div>
                  <h3 className='text-xl font-heading font-semibold text-foreground mb-3'>
                    Security First
                  </h3>
                  <p className='text-muted-foreground'>
                    Your data security is our top priority. We implement
                    industry-leading security practices and maintain the highest
                    standards of data protection.
                  </p>
                </CardContent>
              </Card>

              <Card className='bg-card border-border hover:border-primary/50 transition-colors'>
                <CardContent className='p-6'>
                  <div className='inline-flex items-center justify-center w-12 h-12 rounded-lg bg-chart-4/10 text-chart-4 mb-4'>
                    <Globe className='h-6 w-6' />
                  </div>
                  <h3 className='text-xl font-heading font-semibold text-foreground mb-3'>
                    Global Reach
                  </h3>
                  <p className='text-muted-foreground'>
                    We serve users worldwide with support for multiple languages
                    and integrations with global services. Automation knows no
                    boundaries.
                  </p>
                </CardContent>
              </Card>

              <Card className='bg-card border-border hover:border-primary/50 transition-colors'>
                <CardContent className='p-6'>
                  <div className='inline-flex items-center justify-center w-12 h-12 rounded-lg bg-chart-5/10 text-chart-5 mb-4'>
                    <Code className='h-6 w-6' />
                  </div>
                  <h3 className='text-xl font-heading font-semibold text-foreground mb-3'>
                    Open Source
                  </h3>
                  <p className='text-muted-foreground'>
                    We believe in the power of community. Our platform embraces
                    open-source principles, encouraging developers to contribute
                    and extend our ecosystem.
                  </p>
                </CardContent>
              </Card>

              <Card className='bg-card border-border hover:border-primary/50 transition-colors'>
                <CardContent className='p-6'>
                  <div className='inline-flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10 text-primary mb-4'>
                    <Heart className='h-6 w-6' />
                  </div>
                  <h3 className='text-xl font-heading font-semibold text-foreground mb-3'>
                    Passion Driven
                  </h3>
                  <p className='text-muted-foreground'>
                    We're passionate about automation and helping people achieve
                    more with less effort. This passion fuels our commitment to
                    excellence.
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
                Our Story
              </h2>
            </div>
            <div className='prose prose-lg max-w-none text-muted-foreground'>
              <p className='text-lg mb-4'>
                AREA was born from a simple observation: people were spending
                countless hours on repetitive tasks that could be automated. We
                saw developers writing custom scripts, businesses struggling
                with disconnected tools, and individuals losing precious time on
                manual data entry.
              </p>
              <p className='text-lg mb-4'>
                In 2024, our team of passionate developers and automation
                enthusiasts came together with a vision: to create a platform
                that makes automation accessible to everyone. We started with a
                handful of integrations and a commitment to user-friendly
                design.
              </p>
              <p className='text-lg mb-4'>
                Today, AREA has grown into a robust automation platform trusted
                by millions. We've expanded our integration library, improved
                our infrastructure, and built a thriving community of users who
                share their automation workflows with others.
              </p>
              <p className='text-lg'>
                But we're just getting started. Every day, we work on new
                features, add more integrations, and refine our platform based
                on your feedback. The future of automation is bright, and we're
                excited to build it together with you.
              </p>
            </div>
          </div>
        </section>

        <section className='px-4 sm:px-6 lg:px-8 py-24'>
          <div className='max-w-7xl mx-auto'>
            <div className='text-center mb-16'>
              <h2 className='text-3xl sm:text-4xl lg:text-5xl font-heading font-bold text-foreground mb-4'>
                Built with Modern Technology
              </h2>
              <p className='text-lg text-muted-foreground max-w-2xl mx-auto'>
                We use cutting-edge technologies to deliver a fast, reliable,
                and scalable automation platform
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
                Why Choose AREA?
              </h2>
              <p className='text-lg text-muted-foreground max-w-2xl mx-auto'>
                Here's what sets us apart from other automation platforms
              </p>
            </div>

            <div className='grid grid-cols-1 md:grid-cols-2 gap-8'>
              <Card className='bg-card border-border'>
                <CardContent className='p-8'>
                  <div className='inline-flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10 text-primary mb-4'>
                    <Award className='h-6 w-6' />
                  </div>
                  <h3 className='text-xl font-heading font-semibold text-foreground mb-3'>
                    Easy to Use
                  </h3>
                  <p className='text-muted-foreground'>
                    No coding required. Our intuitive interface makes it simple
                    to create complex automations with just a few clicks.
                    Whether you're a beginner or an expert, you'll feel right at
                    home.
                  </p>
                </CardContent>
              </Card>

              <Card className='bg-card border-border'>
                <CardContent className='p-8'>
                  <div className='inline-flex items-center justify-center w-12 h-12 rounded-lg bg-chart-2/10 text-chart-2 mb-4'>
                    <Zap className='h-6 w-6' />
                  </div>
                  <h3 className='text-xl font-heading font-semibold text-foreground mb-3'>
                    Lightning Fast
                  </h3>
                  <p className='text-muted-foreground'>
                    Our infrastructure is optimized for speed. Your automations
                    run instantly when triggered, ensuring you never miss a beat
                    in your workflow.
                  </p>
                </CardContent>
              </Card>

              <Card className='bg-card border-border'>
                <CardContent className='p-8'>
                  <div className='inline-flex items-center justify-center w-12 h-12 rounded-lg bg-chart-3/10 text-chart-3 mb-4'>
                    <Shield className='h-6 w-6' />
                  </div>
                  <h3 className='text-xl font-heading font-semibold text-foreground mb-3'>
                    Enterprise Security
                  </h3>
                  <p className='text-muted-foreground'>
                    Bank-level encryption, SOC 2 compliance, and regular
                    security audits ensure your data is always protected. We
                    take security seriously so you don't have to worry.
                  </p>
                </CardContent>
              </Card>

              <Card className='bg-card border-border'>
                <CardContent className='p-8'>
                  <div className='inline-flex items-center justify-center w-12 h-12 rounded-lg bg-chart-4/10 text-chart-4 mb-4'>
                    <Users className='h-6 w-6' />
                  </div>
                  <h3 className='text-xl font-heading font-semibold text-foreground mb-3'>
                    Amazing Support
                  </h3>
                  <p className='text-muted-foreground'>
                    Our dedicated support team is here to help you succeed. From
                    onboarding to troubleshooting, we're with you every step of
                    the way.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        <section className='px-4 sm:px-6 lg:px-8 py-24'>
          <div className='max-w-4xl mx-auto text-center'>
            <h2 className='text-3xl sm:text-4xl lg:text-5xl font-heading font-bold text-foreground mb-6'>
              Ready to get started?
            </h2>
            <p className='text-lg text-muted-foreground mb-10 max-w-2xl mx-auto'>
              Join millions of users who have already automated their workflows
              with AREA. Start building your first automation today.
            </p>
            {isAuthenticated ? (
              <Button
                asChild
                size='lg'
                className='text-base px-8 cursor-pointer'
              >
                <Link href='/dashboard'>
                  Go to Dashboard
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
                    Start for free
                    <ArrowRight className='ml-2 h-5 w-5' />
                  </Link>
                </Button>
                <Button
                  asChild
                  variant='outline'
                  size='lg'
                  className='text-base px-8 cursor-pointer'
                >
                  <Link href='/services'>Explore Services</Link>
                </Button>
              </div>
            )}
          </div>
        </section>
      </main>

      <footer className='border-t border-border px-4 sm:px-6 lg:px-8 py-12'>
        <div className='max-w-7xl mx-auto text-center text-muted-foreground text-sm'>
          <p>&copy; 2025 AREA. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
