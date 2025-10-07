'use client';

import type React from 'react';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navigation from '@/components/header';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2 } from 'lucide-react';
import { Service } from '@/types/service';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';
import { getAPIUrl } from '@/lib/config';
import { TbLoader3 } from 'react-icons/tb';

export default function ServicesPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [services, setServices] = useState<Service[]>();

  const fetchApiServices = async () => {
    const res = (
      await api.get<{ services: Service[] }>({ endpoint: '/services' })
    ).data?.services;

    if (!res || res === undefined) return;

    console.log(res);
    setServices(res);
  };

  useEffect(() => {
    if (!user && !authLoading) {
      router.push('/login');
    }
    fetchApiServices();
  }, [user, authLoading, router]);

  useEffect(() => {
    const checkServiceStatus = async () => {
      if (!user) return;

      setIsLoading(true);
      try {
        if (services === undefined) return;
        const updatedServices = await Promise.all(
          services.map(async service => {
            try {
              const [oauthResponse, subscribeResponse] =
                await Promise.allSettled([
                  api.get<{ connected?: boolean }>({
                    endpoint: service.endpoints.auth!,
                  }),
                  api.get<{ subscribed?: boolean; oauth_connected?: boolean }>({
                    endpoint: service.endpoints.status,
                  }),
                ]);

              const oauthConnected =
                (oauthResponse.status === 'fulfilled' &&
                  oauthResponse.value.data?.connected) ||
                false;
              const subscribed =
                (subscribeResponse.status === 'fulfilled' &&
                  subscribeResponse.value.data?.subscribed) ||
                false;

              if (
                oauthResponse.status === 'rejected' ||
                subscribeResponse.status === 'rejected'
              ) {
                console.log(`User not connected to ${service.name}`);
              }

              return {
                ...service,
                isConnected: subscribed,
                oauthConnected,
                subscribed,
              };
            } catch (error) {
              console.log(`User not connected to ${service.name}, `, error);
              return service;
            }
          })
        );
        setServices(updatedServices);
      } catch (error) {
        console.log('Error updating services: ', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (user) {
      checkServiceStatus();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const handleConnect = async (service: Service) => {
    const apiUrl = await getAPIUrl();

    if (service.id === 'timer') {
      try {
        await api.get({ endpoint: service.endpoints.subscribe! });
        setServices(
          services?.map(s =>
            s.id === service.id
              ? {
                  ...s,
                  isConnected: true,
                  subscribed: true,
                }
              : s
          )
        );
      } catch (error) {
        console.error(`Error subscribing to ${service.name}:`, error);
      }
      return;
    }

    if (service.id === 'spotify') {
      window.location.href = `${apiUrl}${service.endpoints.auth}`;
      return;
    }

    if (!service.oauthConnected) {
      window.location.href = `${apiUrl}${service.endpoints.auth}`;
    } else if (service.oauthConnected && !service.isSubscribed) {
      try {
        await api.post(service.endpoints.subscribe!, {});
        setServices(
          services?.map(s =>
            s.id === service.id
              ? {
                  ...s,
                  isConnected: true,
                  subscribed: true,
                }
              : s
          )
        );
      } catch (error) {
        console.log(`User not connected to ${service.name}, `, error);
      }
    }
  };

  const handleDisconnect = async (service: Service) => {
    try {
      await api.post(service.endpoints.unsubscribe!, {});
      setServices(
        services?.map(s =>
          s.id === service.id
            ? {
                ...s,
                isConnected: false,
                subscribed: false,
              }
            : s
        )
      );
      window.location.reload();
    } catch (error) {
      console.log(`User not connected to ${service.name}, `, error);
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
          {services?.map(service => (
            <Card
              key={service.id}
              className='bg-app-surface border-app-border-light hover:border-area-primary transition-all duration-300 hover:shadow-lg'
            >
              <CardContent className='p-6'>
                <div className='flex items-start justify-between mb-4'>
                  <div
                    className='p-3 bg-app-background rounded-lg'
                    dangerouslySetInnerHTML={{ __html: service.icon }}
                  ></div>
                  {service.isSubscribed ? (
                    <Badge className='bg-app-green-light text-app-green-primary border-app-green-primary'>
                      <CheckCircle2 className='w-3 h-3 mr-1' />
                      Subscribed
                    </Badge>
                  ) : (
                    <Badge
                      variant='outline'
                      className='border-app-border-light text-app-text-secondary'
                    >
                      Not Subscribed
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
                  <>
                    {service.isSubscribed ? (
                      <Button
                        onClick={() => handleDisconnect(service)}
                        variant='outline'
                        className='w-full border-app-red-primary text-app-red-primary hover:bg-app-red-primary hover:text-red-700 cursor-pointer'
                      >
                        Unsubscribe
                      </Button>
                    ) : (
                      <Button
                        onClick={() => handleConnect(service)}
                        className='w-full bg-area-primary hover:bg-area-hover text-white cursor-pointer'
                      >
                        Subscribe
                      </Button>
                    )}
                    <Button
                      onClick={() => handleConnect(service)}
                      variant='outline'
                      className='w-full border-app-red-primary text-app-red-primary hover:bg-app-red-primary hover:text-blue-500 cursor-pointer'
                    >
                      More details
                    </Button>
                  </>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
}
