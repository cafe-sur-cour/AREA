'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Plus,
  Zap,
  Users,
  Settings,
  ChevronRight,
  Github,
  Calendar,
  Mail,
  MessageSquare,
  Power,
  PowerOff,
  Timer,
  HandPlatter,
} from 'lucide-react';

import Navigation from '@/components/header';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/contexts/I18nContext';
import api from '@/lib/api';
import { Mapping } from '@/types/mapping';

interface Automation {
  id: number;
  name: string;
  description: string;
  isActive: boolean;
  trigger: string;
  action: string[];
  created_at: string;
}

interface DashboardStats {
  totalAutomations: number;
  activeAutomations: number;
  inactiveAutomations: number;
  totalServices: number;
}

export default function DashboardPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();
  const { t } = useI18n();
  const [automations, setAutomations] = useState<Automation[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalAutomations: 0,
    activeAutomations: 0,
    inactiveAutomations: 0,
    totalServices: 0,
  });
  const [isLoadingData, setIsLoadingData] = useState(true);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
      return;
    }

    if (isAuthenticated) {
      fetchDashboardData();
    }
  }, [isAuthenticated, isLoading, router]);

  const fetchDashboardData = async () => {
    try {
      setIsLoadingData(true);
      try {
        const response = await api.get<{ mappings: Mapping[] }>({
          endpoint: '/mappings',
        });
        const resService = (
          await api.get<{
            services: { id: string; name: string; description: boolean }[];
          }>({ endpoint: '/services/subscribed' })
        ).data?.services;
        const rawMapping: Mapping[] | undefined = response.data?.mappings;
        if (
          !rawMapping ||
          rawMapping === undefined ||
          !resService ||
          resService === undefined
        )
          return;
        console.log(resService);
        setAutomations(
          rawMapping.map(mapping => ({
            id: mapping.id,
            name: mapping.name,
            description: mapping.description,
            isActive: mapping.is_active,
            trigger: mapping.action.type,
            action: mapping.reactions.map(r => r.type),
            created_at: mapping.created_at,
          }))
        );
        setStats({
          totalAutomations: rawMapping.length,
          activeAutomations: rawMapping.filter(a => a.is_active).length,
          inactiveAutomations: rawMapping.filter(a => !a.is_active).length,
          totalServices: resService.length,
        });
      } catch (error) {
        console.error(error);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setIsLoadingData(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return (
          <Badge className='bg-green-100 text-green-800 hover:bg-green-100'>
            {t.dashboard.yourAreas.active}
          </Badge>
        );
      case 'inactive':
        return <Badge variant='secondary'>{t.dashboard.yourAreas.inactive}</Badge>;
      case 'error':
        return <Badge variant='destructive'>{t.dashboard.yourAreas.error}</Badge>;
      default:
        return <Badge variant='outline'>{t.dashboard.yourAreas.unknown}</Badge>;
    }
  };

  const getTriggerIcon = (trigger: string) => {
    if (trigger.startsWith('github')) return <Github className='h-4 w-4' />;
    if (trigger.startsWith('gmail')) return <Mail className='h-4 w-4' />;
    if (trigger.startsWith('calendar')) return <Calendar className='h-4 w-4' />;
    if (trigger.startsWith('discord') || trigger.startsWith('twitter'))
      return <MessageSquare className='h-4 w-4' />;
    if (trigger.startsWith('timer')) return <Timer className='h-4 w-4' />;
    return <Zap className='h-4 w-4' />;
  };

  if (isLoading || isLoadingData) {
    return (
      <div className='min-h-screen bg-background'>
        <Navigation />
        <div className='flex items-center justify-center h-[calc(100vh-80px)]'>
          <div className='text-center'>
            <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4'></div>
            <p className='text-muted-foreground'>{t.dashboard.loading}</p>
          </div>
        </div>
      </div>
    );
  }

  const AreaGridCols = automations.length >= 3 ? 3 : automations.length;

  return (
    <div className='min-h-screen bg-background'>
      <Navigation />

      <main className='container mx-auto px-4 py-8'>
        {/* Header */}
        <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8'>
          <div>
            <h1 className='text-3xl font-heading font-bold text-foreground'>
              {t.dashboard.title}
            </h1>
            <p className='text-muted-foreground mt-1'>
              {t.dashboard.subtitle}
            </p>
          </div>
          <Button
            onClick={() => router.push('/my-areas')}
            className='bg-primary hover:bg-primary/90 cursor-pointer'
          >
            <Plus className='h-4 w-4 mr-2' />
            {t.dashboard.newAreaButton}
          </Button>
        </div>

        {/* Stats Cards */}
        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8'>
          <Card>
            <CardContent className='p-6'>
              <div className='flex items-center justify-between'>
                <div>
                  <p className='text-sm text-muted-foreground'>{t.dashboard.stats.totalAreas}</p>
                  <p className='text-2xl font-bold'>{stats.totalAutomations}</p>
                </div>
                <div className='p-3 rounded-lg'>
                  <Zap className='h-6 w-6 text-blue-600' />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className='p-6'>
              <div className='flex items-center justify-between'>
                <div>
                  <p className='text-sm text-muted-foreground'>
                    {t.dashboard.stats.connectedServices}
                  </p>
                  <p className='text-2xl font-bold'>{stats.totalServices}</p>
                </div>
                <div className='p-3 rounded-lg'>
                  <HandPlatter className='h-6 w-6 text-blue-600' />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className='p-6'>
              <div className='flex items-center justify-between'>
                <div>
                  <p className='text-sm text-muted-foreground'>{t.dashboard.stats.active}</p>
                  <p className='text-2xl font-bold text-green-600'>
                    {stats.activeAutomations}
                  </p>
                </div>
                <div className='p-3 rounded-lg'>
                  <Power className='h-6 w-6 text-green-600' />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className='p-6'>
              <div className='flex items-center justify-between'>
                <div>
                  <p className='text-sm text-muted-foreground'>{t.dashboard.stats.inactive}</p>
                  <p className='text-2xl font-bold text-red-600'>
                    {stats.inactiveAutomations}
                  </p>
                </div>
                <div className='p-3 rounded-lg'>
                  <PowerOff className='h-6 w-6 text-red-600' />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <section className='mt-10 mb-8'>
          <h1 className='text-2xl font-semibold mb-4'>{t.dashboard.quickActions.title}</h1>
          <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'>
            <Button
              variant='outline'
              className='justify-start h-auto p-4 flex-col items-start gap-2 cursor-pointer'
              onClick={() => router.push('/services')}
            >
              <Users className='h-5 w-5 text-blue-600' />
              <div className='text-left'>
                <div className='font-medium'>{t.dashboard.quickActions.connectServices.title}</div>
                <div className='text-xs text-muted-foreground'>
                  {t.dashboard.quickActions.connectServices.description}
                </div>
              </div>
            </Button>

            <Button
              variant='outline'
              className='justify-start h-auto p-4 flex-col items-start gap-2 cursor-pointer'
              onClick={() => router.push('/catalogue')}
            >
              <Zap className='h-5 w-5 text-purple-600' />
              <div className='text-left'>
                <div className='font-medium'>{t.dashboard.quickActions.browseTemplates.title}</div>
                <div className='text-xs text-muted-foreground'>
                  {t.dashboard.quickActions.browseTemplates.description}
                </div>
              </div>
            </Button>

            <Button
              variant='outline'
              className='justify-start h-auto p-4 flex-col items-start gap-2 cursor-pointer'
              onClick={() => router.push('/profile')}
            >
              <Settings className='h-5 w-5 text-green-600' />
              <div className='text-left'>
                <div className='font-medium'>{t.dashboard.quickActions.accountSettings.title}</div>
                <div className='text-xs text-muted-foreground'>
                  {t.dashboard.quickActions.accountSettings.description}
                </div>
              </div>
            </Button>
          </div>
        </section>

        {/* Automations List */}
        <section className='mt-12 mb-8'>
          <h1 className='text-2xl font-semibold mb-6'>{t.dashboard.yourAreas.title}</h1>
          {automations.length === 0 ? (
            <div className='text-center py-12'>
              <Zap className='h-12 w-12 text-muted-foreground mx-auto mb-4' />
              <h3 className='text-lg font-semibold mb-2'>{t.dashboard.yourAreas.noAreas}</h3>
              <p className='text-muted-foreground mb-6'>
                {t.dashboard.yourAreas.noAreasDescription}
              </p>
              <Button
                className='cursor-pointer'
                onClick={() => router.push('/my-areas')}
              >
                <Plus className='h-4 w-4 mr-2' />
                {t.dashboard.yourAreas.createArea}
              </Button>
            </div>
          ) : (
            <div
              className={`grid gap-4 ${AreaGridCols >= 3 ? 'lg:grid-cols-3' : 'lg:grid-cols-' + AreaGridCols}`}
            >
              {automations.map(automation => (
                <div
                  key={automation.id}
                  className='items-center justify-between p-4 border border-border rounded-lg hover:border-primary/50 transition-colors'
                >
                  <div className='flex items-center gap-4 flex-1'>
                    <div className='flex items-center gap-2'>
                      {getTriggerIcon(automation.trigger)}
                    </div>

                    <div className='flex-1 min-w-0'>
                      <div className='flex items-center gap-2 mb-1'>
                        <h3 className='font-semibold text-foreground truncate'>
                          {automation.name}
                        </h3>
                        {getStatusBadge(
                          automation.isActive ? 'active' : 'inactive'
                        )}
                      </div>
                      <p className='text-sm text-muted-foreground mb-2 line-clamp-1'>
                        {automation.description}
                      </p>
                      <div className='flex items-center gap-4 text-xs text-muted-foreground'>
                        <span>{t.dashboard.yourAreas.action}: {automation.trigger}</span>
                        <ChevronRight className='h-3 w-3' />
                        {automation.action.map((action, index) => (
                          <span key={index}>{action}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
