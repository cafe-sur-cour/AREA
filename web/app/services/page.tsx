'use client';

import type React from 'react';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navigation from '@/components/header';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2 } from 'lucide-react';
import {
  FaTwitch,
  FaGithub,
  FaGoogle,
  FaMeta,
  FaMicrosoft,
  FaSpotify,
} from 'react-icons/fa6';
import { FaDeezer } from 'react-icons/fa';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';
import { getAPIUrl } from '@/lib/config';
import { TbLoader3 } from 'react-icons/tb';

interface Service {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  isConnected: boolean;
  authEndpoint: string;
  statusEndpoint: string;
}

export default function ServicesPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [services, setServices] = useState<Service[]>([
    {
      id: 'twitch',
      name: 'Twitch',
      description:
        'Connect your Twitch account to automate streaming workflows',
      icon: <FaTwitch className='w-8 h-8 text-purple-500' />,
      isConnected: false,
      authEndpoint: '/auth/twitch/subscribe',
      statusEndpoint: '/twitch/oauth/status',
    },
    {
      id: 'meta',
      name: 'Meta',
      description:
        'Integrate with Facebook and Instagram for social automation',
      icon: <FaMeta className='w-8 h-8 text-blue-600' />,
      isConnected: false,
      authEndpoint: '/auth/meta/subscribe',
      statusEndpoint: '/meta/oauth/status',
    },
    {
      id: 'google',
      name: 'Google',
      description: 'Access Gmail, Drive, Calendar and other Google services',
      icon: <FaGoogle className='w-8 h-8 text-red-500' />,
      isConnected: false,
      authEndpoint: '/auth/google/subscribe',
      statusEndpoint: '/google/oauth/status',
    },
    {
      id: 'microsoft',
      name: 'Microsoft 365',
      description: 'Connect to Outlook, OneDrive, Teams and Office apps',
      icon: <FaMicrosoft className='w-8 h-8 text-blue-500' />,
      isConnected: false,
      authEndpoint: '/auth/microsoft/subscribe',
      statusEndpoint: '/microsoft/oauth/status',
    },
    {
      id: 'github',
      name: 'GitHub',
      description: 'Automate your development workflow with GitHub integration',
      icon: <FaGithub className='w-8 h-8 text-gray-800 dark:text-white' />,
      isConnected: false,
      authEndpoint: '/auth/auth/github/subscribe',
      statusEndpoint: '/github/oauth/status/',
    },
    {
      id: 'deezer',
      name: 'Deezer',
      description: 'Control your music and playlists on Deezer',
      icon: <FaDeezer className='w-8 h-8 text-orange-500' />,
      isConnected: false,
      authEndpoint: '/auth/deezer',
      statusEndpoint: '/deezer/oauth/status',
    },
    {
      id: 'spotify',
      name: 'Spotify',
      description: 'Manage your Spotify playlists and listening activity',
      icon: <FaSpotify className='w-8 h-8 text-green-500' />,
      isConnected: false,
      authEndpoint: '/auth/spotify/subscribe',
      statusEndpoint: '/spotify/oauth/status',
    },
  ]);

  useEffect(() => {
    if (!user && !authLoading) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    const checkServiceStatus = async () => {
      if (!user) return;

      setIsLoading(true);
      const updatedServices = await Promise.all(
        services.map(async service => {
          try {
            const response = await api.get<{
              connected?: boolean;
              msg?: string;
              message?: string;
            }>({
              endpoint: service.statusEndpoint,
            });
            return {
              ...service,
              isConnected: response.data?.connected || false,
            };
          } catch (error) {
            console.error(`Error checking ${service.name} status:`, error);
            return service;
          }
        })
      );
      setServices(updatedServices);
      setIsLoading(false);
    };

    if (user) {
      checkServiceStatus();
    }
  }, [user, services]);

  const handleConnect = async (service: Service) => {
    const apiUrl = await getAPIUrl();
    window.location.href = `${apiUrl}${service.authEndpoint}`;
  };

  const handleDisconnect = async (service: Service) => {
    try {
      await api.delete(`${service.statusEndpoint}`);
      setServices(
        services.map(s =>
          s.id === service.id ? { ...s, isConnected: false } : s
        )
      );
    } catch (error) {
      console.error(`Error disconnecting ${service.name}:`, error);
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className='min-h-screen flex items-center justify-center'>
        <div className='text-center'>
          <TbLoader3 className='size-12 animate-spin text-jeb-primary mb-4' />
          <p className='mt-4 text-gray-600'>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-app-background'>
      <Navigation />

      <main className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
        {/* Services Grid */}
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
          {services.map(service => (
            <Card
              key={service.id}
              className='bg-app-surface border-app-border-light hover:border-area-primary transition-all duration-300 hover:shadow-lg'
            >
              <CardContent className='p-6'>
                <div className='flex items-start justify-between mb-4'>
                  <div className='p-3 bg-app-background rounded-lg'>
                    {service.icon}
                  </div>
                  {service.isConnected ? (
                    <Badge className='bg-app-green-light text-app-green-primary border-app-green-primary'>
                      <CheckCircle2 className='w-3 h-3 mr-1' />
                      Connected
                    </Badge>
                  ) : (
                    <Badge
                      variant='outline'
                      className='border-app-border-light text-app-text-secondary'
                    >
                      Not Connected
                    </Badge>
                  )}
                </div>

                <h3 className='font-heading text-xl font-bold text-app-text-primary mb-2'>
                  {service.name}
                </h3>

                <p className='text-app-text-secondary text-sm mb-4 line-clamp-2'>
                  {service.description}
                </p>

                <div className='grid gap-2'>
                  {service.isConnected ? (
                    <Button
                      onClick={() => handleDisconnect(service)}
                      variant='outline'
                      className='w-full border-app-red-primary text-app-red-primary hover:bg-app-red-primary hover:text-red-700'
                    >
                      Disconnect
                    </Button>
                  ) : (
                    <Button
                      onClick={() => handleConnect(service)}
                      className='w-full bg-area-primary hover:bg-area-hover text-white'
                    >
                      Connect
                    </Button>
                  )}
                  <Button
                    onClick={() => handleConnect(service)}
                    variant='outline'
                    className='w-full border-app-red-primary text-app-red-primary hover:bg-app-red-primary hover:text-blue-500'
                  >
                    More details
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
}
