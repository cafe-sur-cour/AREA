import { Button } from '@/components/ui/button';
import Navigation from '@/components/header';
import { ArrowRight, Zap, Clock, Shield } from 'lucide-react';
import Link from 'next/link';

export default function Home() {
  return (
    <div className='min-h-screen bg-background'>
      <Navigation />

      {/* Hero Section */}
      <section className='relative px-4 sm:px-6 lg:px-8 pt-20 pb-32'>
        <div className='max-w-7xl mx-auto'>
          <div className='text-center max-w-4xl mx-auto'>
            <h1 className='text-5xl sm:text-6xl lg:text-7xl font-heading font-bold text-foreground mb-6 text-balance'>
              Automate your life with powerful connections
            </h1>
            <p className='text-lg sm:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto text-pretty'>
              Connect your favorite apps and services to create powerful
              automations. Save time and focus on what matters most.
            </p>
            <div className='flex flex-col sm:flex-row gap-4 justify-center items-center'>
              <Button asChild size='lg' className='text-base px-8'>
                <Link href='/register'>
                  Get started free
                  <ArrowRight className='ml-2 h-5 w-5' />
                </Link>
              </Button>
              <Button
                asChild
                variant='outline'
                size='lg'
                className='text-base px-8 bg-transparent'
              >
                <Link href='/login'>Sign in</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className='border-t border-border'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16'>
          <div className='grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12'>
            <div className='text-center md:text-left'>
              <div className='text-4xl font-heading font-bold text-foreground mb-2'>
                10M+
              </div>
              <div className='text-muted-foreground'>Active automations</div>
            </div>
            <div className='text-center md:text-left'>
              <div className='text-4xl font-heading font-bold text-foreground mb-2'>
                500+
              </div>
              <div className='text-muted-foreground'>Connected services</div>
            </div>
            <div className='text-center md:text-left'>
              <div className='text-4xl font-heading font-bold text-foreground mb-2'>
                2M+
              </div>
              <div className='text-muted-foreground'>Happy users</div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className='px-4 sm:px-6 lg:px-8 py-24 bg-muted/30'>
        <div className='max-w-7xl mx-auto'>
          <div className='text-center mb-16'>
            <h2 className='text-3xl sm:text-4xl lg:text-5xl font-heading font-bold text-foreground mb-4'>
              How it works
            </h2>
            <p className='text-lg text-muted-foreground max-w-2xl mx-auto'>
              Create powerful automations in three simple steps
            </p>
          </div>

          <div className='grid grid-cols-1 md:grid-cols-3 gap-8'>
            {/* Step 1 */}
            <div className='bg-card border border-border rounded-lg p-8 text-center'>
              <div className='inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary text-primary-foreground mb-6 text-2xl font-heading font-bold'>
                1
              </div>
              <h3 className='text-xl font-heading font-semibold text-foreground mb-3'>
                Choose a trigger
              </h3>
              <p className='text-muted-foreground'>
                Select an app and event that starts your automation
              </p>
            </div>

            {/* Step 2 */}
            <div className='bg-card border border-border rounded-lg p-8 text-center'>
              <div className='inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary text-primary-foreground mb-6 text-2xl font-heading font-bold'>
                2
              </div>
              <h3 className='text-xl font-heading font-semibold text-foreground mb-3'>
                Add an action
              </h3>
              <p className='text-muted-foreground'>
                Choose what happens when your trigger fires
              </p>
            </div>

            {/* Step 3 */}
            <div className='bg-card border border-border rounded-lg p-8 text-center'>
              <div className='inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary text-primary-foreground mb-6 text-2xl font-heading font-bold'>
                3
              </div>
              <h3 className='text-xl font-heading font-semibold text-foreground mb-3'>
                Activate & relax
              </h3>
              <p className='text-muted-foreground'>
                Your automation runs automatically in the background
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Popular Automations */}
      <section className='px-4 sm:px-6 lg:px-8 py-24'>
        <div className='max-w-7xl mx-auto'>
          <div className='text-center mb-16'>
            <h2 className='text-3xl sm:text-4xl lg:text-5xl font-heading font-bold text-foreground mb-4'>
              Popular automations
            </h2>
            <p className='text-lg text-muted-foreground max-w-2xl mx-auto'>
              Get inspired by what others are building
            </p>
          </div>

          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
            {[
              {
                title: 'Email to Slack',
                description:
                  'Get notified in Slack when you receive important emails',
                icon: '📧',
              },
              {
                title: 'Social Media Sync',
                description: 'Post to multiple social networks at once',
                icon: '📱',
              },
              {
                title: 'Calendar Reminders',
                description: 'Send SMS reminders before calendar events',
                icon: '📅',
              },
              {
                title: 'File Backup',
                description: 'Automatically backup files to cloud storage',
                icon: '💾',
              },
              {
                title: 'Task Management',
                description: 'Create tasks from emails or messages',
                icon: '✅',
              },
              {
                title: 'Data Collection',
                description: 'Save form responses to spreadsheets',
                icon: '📊',
              },
            ].map((automation, index) => (
              <div
                key={index}
                className='bg-card border border-border rounded-lg p-6 hover:border-primary/50 transition-colors cursor-pointer group'
              >
                <div className='text-4xl mb-4'>{automation.icon}</div>
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
                Lightning fast
              </h3>
              <p className='text-muted-foreground'>
                Your automations run instantly when triggered, with no delays or
                waiting.
              </p>
            </div>

            <div className='text-center lg:text-left'>
              <div className='inline-flex items-center justify-center w-12 h-12 rounded-lg bg-chart-2/10 text-chart-2 mb-4'>
                <Clock className='h-6 w-6' />
              </div>
              <h3 className='text-xl font-heading font-semibold text-foreground mb-3'>
                Save time
              </h3>
              <p className='text-muted-foreground'>
                Automate repetitive tasks and focus on what really matters to
                you.
              </p>
            </div>

            <div className='text-center lg:text-left'>
              <div className='inline-flex items-center justify-center w-12 h-12 rounded-lg bg-chart-4/10 text-chart-4 mb-4'>
                <Shield className='h-6 w-6' />
              </div>
              <h3 className='text-xl font-heading font-semibold text-foreground mb-3'>
                Secure & reliable
              </h3>
              <p className='text-muted-foreground'>
                Enterprise-grade security with 99.9% uptime guarantee for your
                peace of mind.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className='px-4 sm:px-6 lg:px-8 py-24'>
        <div className='max-w-4xl mx-auto text-center'>
          <h2 className='text-3xl sm:text-4xl lg:text-5xl font-heading font-bold text-foreground mb-6'>
            Ready to automate your workflow?
          </h2>
          <p className='text-lg text-muted-foreground mb-10 max-w-2xl mx-auto'>
            Join millions of users who are already saving time with powerful
            automations.
          </p>
          <Button asChild size='lg' className='text-base px-8'>
            <Link href='/register'>
              Start for free
              <ArrowRight className='ml-2 h-5 w-5' />
            </Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className='border-t border-border px-4 sm:px-6 lg:px-8 py-12'>
        <div className='max-w-7xl mx-auto text-center text-muted-foreground text-sm'>
          <p>&copy; 2025 Area. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
