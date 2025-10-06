'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Plus,
  Zap,
  Activity,
  Users,
  Settings,
  Play,
  Pause,
  Trash2,
  Edit3,
  ChevronRight,
  Clock,
  CheckCircle2,
  XCircle,
  Github,
  Calendar,
  Mail,
  MessageSquare,
} from 'lucide-react';

import Navigation from '@/components/header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';

interface Automation {
  id: number;
  name: string;
  description: string;
  status: 'active' | 'inactive' | 'error';
  trigger: string;
  action: string;
  lastRun: string;
  runCount: number;
  created_at: string;
}

interface DashboardStats {
  totalAutomations: number;
  activeAutomations: number;
  totalRuns: number;
  successRate: number;
}

export default function DashboardPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuth();
  const [automations, setAutomations] = useState<Automation[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalAutomations: 0,
    activeAutomations: 0,
    totalRuns: 0,
    successRate: 0,
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
      const mockAutomations: Automation[] = [
        {
          id: 1,
          name: 'GitHub to Discord',
          description: 'Send Discord notification when new commit is pushed',
          status: 'active',
          trigger: 'GitHub Push',
          action: 'Discord Message',
          lastRun: '2 minutes ago',
          runCount: 145,
          created_at: '2024-01-15T10:30:00Z',
        },
        {
          id: 2,
          name: 'Email to Calendar',
          description: 'Create calendar event from important emails',
          status: 'active',
          trigger: 'Gmail New Email',
          action: 'Google Calendar Event',
          lastRun: '1 hour ago',
          runCount: 23,
          created_at: '2024-01-10T14:20:00Z',
        },
        {
          id: 3,
          name: 'Tweet Backup',
          description: 'Save tweets to Google Drive',
          status: 'error',
          trigger: 'Twitter New Tweet',
          action: 'Google Drive File',
          lastRun: '2 days ago',
          runCount: 67,
          created_at: '2024-01-05T09:15:00Z',
        },
      ];

      setAutomations(mockAutomations);
      setStats({
        totalAutomations: mockAutomations.length,
        activeAutomations: mockAutomations.filter(a => a.status === 'active')
          .length,
        totalRuns: mockAutomations.reduce((sum, a) => sum + a.runCount, 0),
        successRate: 94.2,
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setIsLoadingData(false);
    }
  };

  const toggleAutomationStatus = async (id: number, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    setAutomations(prev =>
      prev.map(automation =>
        automation.id === id
          ? {
              ...automation,
              status: newStatus as 'active' | 'inactive' | 'error',
            }
          : automation
      )
    );
  };

  const deleteAutomation = async (id: number) => {
    setAutomations(prev => prev.filter(automation => automation.id !== id));
    setStats(prev => ({
      ...prev,
      totalAutomations: prev.totalAutomations - 1,
    }));
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle2 className='h-4 w-4 text-green-500' />;
      case 'inactive':
        return <Pause className='h-4 w-4 text-yellow-500' />;
      case 'error':
        return <XCircle className='h-4 w-4 text-red-500' />;
      default:
        return <Clock className='h-4 w-4 text-gray-500' />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return (
          <Badge className='bg-green-100 text-green-800 hover:bg-green-100'>
            Active
          </Badge>
        );
      case 'inactive':
        return <Badge variant='secondary'>Inactive</Badge>;
      case 'error':
        return <Badge variant='destructive'>Error</Badge>;
      default:
        return <Badge variant='outline'>Unknown</Badge>;
    }
  };

  const getTriggerIcon = (trigger: string) => {
    if (trigger.includes('GitHub')) return <Github className='h-4 w-4' />;
    if (trigger.includes('Gmail')) return <Mail className='h-4 w-4' />;
    if (trigger.includes('Calendar')) return <Calendar className='h-4 w-4' />;
    if (trigger.includes('Discord') || trigger.includes('Twitter'))
      return <MessageSquare className='h-4 w-4' />;
    return <Zap className='h-4 w-4' />;
  };

  if (isLoading || isLoadingData) {
    return (
      <div className='min-h-screen bg-background'>
        <Navigation />
        <div className='flex items-center justify-center h-[calc(100vh-80px)]'>
          <div className='text-center'>
            <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4'></div>
            <p className='text-muted-foreground'>Loading dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-background'>
      <Navigation />

      <main className='container mx-auto px-4 py-8'>
        {/* Header */}
        <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8'>
          <div>
            <h1 className='text-3xl font-heading font-bold text-foreground'>
              Dashboard
            </h1>
            <p className='text-muted-foreground mt-1'>
              Manage your automations and monitor their performance
            </p>
          </div>
          <Button
            onClick={() => router.push('/create-automation')}
            className='bg-primary hover:bg-primary/90'
          >
            <Plus className='h-4 w-4 mr-2' />
            New Automation
          </Button>
        </div>

        {/* Stats Cards */}
        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8'>
          <Card>
            <CardContent className='p-6'>
              <div className='flex items-center justify-between'>
                <div>
                  <p className='text-sm text-muted-foreground'>
                    Total Automations
                  </p>
                  <p className='text-2xl font-bold'>{stats.totalAutomations}</p>
                </div>
                <div className='bg-blue-100 p-3 rounded-lg'>
                  <Zap className='h-6 w-6 text-blue-600' />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className='p-6'>
              <div className='flex items-center justify-between'>
                <div>
                  <p className='text-sm text-muted-foreground'>Active</p>
                  <p className='text-2xl font-bold text-green-600'>
                    {stats.activeAutomations}
                  </p>
                </div>
                <div className='bg-green-100 p-3 rounded-lg'>
                  <Activity className='h-6 w-6 text-green-600' />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className='p-6'>
              <div className='flex items-center justify-between'>
                <div>
                  <p className='text-sm text-muted-foreground'>Total Runs</p>
                  <p className='text-2xl font-bold'>
                    {stats.totalRuns.toLocaleString()}
                  </p>
                </div>
                <div className='bg-purple-100 p-3 rounded-lg'>
                  <Play className='h-6 w-6 text-purple-600' />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className='p-6'>
              <div className='flex items-center justify-between'>
                <div>
                  <p className='text-sm text-muted-foreground'>Success Rate</p>
                  <p className='text-2xl font-bold text-green-600'>
                    {stats.successRate}%
                  </p>
                </div>
                <div className='bg-green-100 p-3 rounded-lg'>
                  <CheckCircle2 className='h-6 w-6 text-green-600' />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className='mb-8'>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <Settings className='h-5 w-5' />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4'>
              <Button
                variant='outline'
                className='justify-start h-auto p-4 flex-col items-start gap-2'
                onClick={() => router.push('/services')}
              >
                <Users className='h-5 w-5 text-blue-600' />
                <div className='text-left'>
                  <div className='font-medium'>Connect Services</div>
                  <div className='text-xs text-muted-foreground'>
                    Link new platforms
                  </div>
                </div>
              </Button>

              <Button
                variant='outline'
                className='justify-start h-auto p-4 flex-col items-start gap-2'
                onClick={() => router.push('/catalogue')}
              >
                <Zap className='h-5 w-5 text-purple-600' />
                <div className='text-left'>
                  <div className='font-medium'>Browse Templates</div>
                  <div className='text-xs text-muted-foreground'>
                    Pre-made automations
                  </div>
                </div>
              </Button>

              <Button
                variant='outline'
                className='justify-start h-auto p-4 flex-col items-start gap-2'
                onClick={() => router.push('/profile')}
              >
                <Settings className='h-5 w-5 text-green-600' />
                <div className='text-left'>
                  <div className='font-medium'>Account Settings</div>
                  <div className='text-xs text-muted-foreground'>
                    Manage your profile
                  </div>
                </div>
              </Button>

              <Button
                variant='outline'
                className='justify-start h-auto p-4 flex-col items-start gap-2'
              >
                <Activity className='h-5 w-5 text-orange-600' />
                <div className='text-left'>
                  <div className='font-medium'>View Analytics</div>
                  <div className='text-xs text-muted-foreground'>
                    Performance insights
                  </div>
                </div>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Automations List */}
        <Card>
          <CardHeader>
            <CardTitle>Your Automations</CardTitle>
          </CardHeader>
          <CardContent>
            {automations.length === 0 ? (
              <div className='text-center py-12'>
                <Zap className='h-12 w-12 text-muted-foreground mx-auto mb-4' />
                <h3 className='text-lg font-semibold mb-2'>
                  No automations yet
                </h3>
                <p className='text-muted-foreground mb-6'>
                  Create your first automation to get started
                </p>
                <Button onClick={() => router.push('/create-automation')}>
                  <Plus className='h-4 w-4 mr-2' />
                  Create Automation
                </Button>
              </div>
            ) : (
              <div className='space-y-4'>
                {automations.map(automation => (
                  <div
                    key={automation.id}
                    className='flex items-center justify-between p-4 border border-border rounded-lg hover:border-primary/50 transition-colors'
                  >
                    <div className='flex items-center gap-4 flex-1'>
                      <div className='flex items-center gap-2'>
                        {getStatusIcon(automation.status)}
                        {getTriggerIcon(automation.trigger)}
                      </div>

                      <div className='flex-1 min-w-0'>
                        <div className='flex items-center gap-2 mb-1'>
                          <h3 className='font-semibold text-foreground truncate'>
                            {automation.name}
                          </h3>
                          {getStatusBadge(automation.status)}
                        </div>
                        <p className='text-sm text-muted-foreground mb-2 line-clamp-1'>
                          {automation.description}
                        </p>
                        <div className='flex items-center gap-4 text-xs text-muted-foreground'>
                          <span>{automation.trigger}</span>
                          <ChevronRight className='h-3 w-3' />
                          <span>{automation.action}</span>
                          <span>•</span>
                          <span>Last run: {automation.lastRun}</span>
                          <span>•</span>
                          <span>{automation.runCount} runs</span>
                        </div>
                      </div>
                    </div>

                    <div className='flex items-center gap-2'>
                      <Button
                        variant='ghost'
                        size='sm'
                        onClick={() =>
                          toggleAutomationStatus(
                            automation.id,
                            automation.status
                          )
                        }
                        disabled={automation.status === 'error'}
                      >
                        {automation.status === 'active' ? (
                          <Pause className='h-4 w-4' />
                        ) : (
                          <Play className='h-4 w-4' />
                        )}
                      </Button>

                      <Button variant='ghost' size='sm'>
                        <Edit3 className='h-4 w-4' />
                      </Button>

                      <Button
                        variant='ghost'
                        size='sm'
                        onClick={() => deleteAutomation(automation.id)}
                        className='text-red-600 hover:text-red-700'
                      >
                        <Trash2 className='h-4 w-4' />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
