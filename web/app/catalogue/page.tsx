'use client';

import Navigation from '@/components/header';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { About, AboutAREA } from '@/types/about';
import { useEffect, useState } from 'react';
import { getBackendUrl } from '@/lib/config';
import { ListFilter } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useI18n } from '@/contexts/I18nContext';
import { useRouter, useSearchParams } from 'next/navigation';

export default function CataloguePage() {
  const { t } = useI18n();
  const [about, setAbout] = useState<About | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<
    'all' | 'actions' | 'reactions'
  >('all');
  const [selectedFilterService, setSelectedFilterService] =
    useState<string>('all');
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const filterService = searchParams.get('filterService');
    const filterType = searchParams.get('filterType');
    if (filterService) {
      setSelectedFilterService(filterService);
    }
    if (filterType) {
      if (filterType === 'actions') {
        setSelectedFilter('actions');
      } else if (filterType === 'reactions') {
        setSelectedFilter('reactions');
      } else {
        setSelectedFilter('all');
      }
    }
  }, [searchParams]);

  const fetchApiAR = async () => {
    const res = await fetch(`${await getBackendUrl()}/about.json`);
    if (!res.ok) {
      throw new Error('Failed to fetch data');
    }
    setAbout(await res.json());
  };

  useEffect(() => {
    fetchApiAR();
  }, []);

  const handleConnect = (service: AboutAREA, id: number, isAction: boolean) => {
    if (service.name && id) {
      window.location.href = `/my-areas?service=${service.id}&id=${id}&isAction=${isAction}`;
    }
  };

  const filterItems = (data: 'all' | 'actions' | 'reactions') => {
    if (data === 'actions') {
      setSelectedFilter('actions');
      router.push(
        `/catalogue?filterType=actions&filterService=${selectedFilterService}`
      );
    } else if (data === 'reactions') {
      setSelectedFilter('reactions');
      router.push(
        `/catalogue?filterType=reactions&filterService=${selectedFilterService}`
      );
    } else if (data === 'all') {
      setSelectedFilter('all');
      router.push(
        `/catalogue?filterType=all&filterService=${selectedFilterService}`
      );
    }
  };

  const filterItemsService = (data: string) => {
    setSelectedFilterService(data);
    router.push(
      `/catalogue?filterType=${selectedFilter}&filterService=${data}`
    );
  };

  return (
    <div className='min-h-screen bg-app-background'>
      <Navigation />

      <main className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
        {/* Services Grid */}
        <h1 className='font-heading text-3xl font-bold text-app-text-primary mb-6'>
          {t.catalogue.title}
        </h1>
        <div className='flex flex-col gap-4 mb-8'>
          <div className='flex items-center justify-between'>
            <h2 className='text-lg font-semibold text-app-text-primary flex items-center gap-2'>
              <ListFilter className='w-5 h-5' />
              {t.catalogue.filter.label}
            </h2>
          </div>
          <div className='flex gap-5'>
            <Select
              onValueChange={value => {
                filterItems(value as 'all' | 'actions' | 'reactions');
              }}
              defaultValue={selectedFilter}
              value={selectedFilter}
            >
              <SelectTrigger className=' md:w-48 bg-app-surface border-app-border-light'>
                <SelectValue placeholder={t.catalogue.filter.placeholder} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>
                  {t.catalogue.filter.all} Types
                </SelectItem>
                <SelectItem value='actions'>
                  {t.catalogue.filter.actionsOnly}
                </SelectItem>
                <SelectItem value='reactions'>
                  {t.catalogue.filter.reactionsOnly}
                </SelectItem>
              </SelectContent>
            </Select>
            <Select
              onValueChange={value => {
                filterItemsService(value as string);
              }}
              defaultValue={selectedFilterService || 'all'}
              value={selectedFilterService || 'all'}
            >
              <SelectTrigger className=' md:w-48 bg-app-surface border-app-border-light'>
                <SelectValue
                  placeholder={t.catalogue.filterServices.placeholder}
                />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>
                  {t.catalogue.filterServices.all}
                </SelectItem>
                {about &&
                  about.server.services.map(
                    (service: AboutAREA, index: number) => (
                      <SelectItem key={index} value={service.id}>
                        {service.name}
                      </SelectItem>
                    )
                  )}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
          {about &&
            about.server.services.map((service: AboutAREA, index: number) => (
              <>
                {(selectedFilterService === 'all' ||
                  selectedFilterService === service.id) &&
                  service.actions.length > 0 &&
                  (selectedFilter === 'actions' || selectedFilter === 'all') &&
                  service.actions.map(action => (
                    <>
                      <Card
                        key={index}
                        className='bg-app-surface border-app-border-light hover:border-area-primary transition-all duration-300 hover:shadow-lg group'
                      >
                        <CardContent className='p-6'>
                          <div className='flex items-center justify-between mb-4'>
                            <div className='flex flex-col gap-2'>
                              <h3 className='font-heading text-xl font-bold text-app-text-primary leading-none'>
                                {service.name}
                              </h3>
                              <Badge className='bg-transparent outline outline-app-border-light text-primary w-fit'>
                                {t.catalogue.badges.action}
                              </Badge>
                            </div>
                            <div
                              className='bg-app-background rounded-lg w-14 h-14 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300'
                              dangerouslySetInnerHTML={{
                                __html: service.icon.replaceAll('1em', '2.5em'),
                              }}
                            ></div>
                          </div>

                          <p className='text-app-text-secondary text-sm mb-6 items-center flex line-clamp-3 min-h-[60px]'>
                            {action.description}
                          </p>

                          <Button
                            onClick={() =>
                              handleConnect(service, action.id, true)
                            }
                            variant='outline'
                            className='w-full border-app-red-primary text-app-red-primary hover:bg-app-red-primary hover:text-blue-400 transition-all duration-300 cursor-pointer'
                          >
                            {t.catalogue.buttons.addAction}
                          </Button>
                        </CardContent>
                      </Card>
                    </>
                  ))}
                {(selectedFilterService === 'all' ||
                  selectedFilterService === service.id) &&
                  service.reactions.length > 0 &&
                  (selectedFilter === 'reactions' ||
                    selectedFilter === 'all') &&
                  service.reactions.map(reaction => (
                    <>
                      <Card
                        key={index}
                        className='bg-app-surface border-app-border-light hover:border-area-primary transition-all duration-300 hover:shadow-lg group'
                      >
                        <CardContent className='p-6'>
                          <div className='flex items-center justify-between mb-4'>
                            <div className='flex flex-col gap-2'>
                              <h3 className='font-heading text-xl font-bold text-app-text-primary leading-none'>
                                {service.name}
                              </h3>
                              <Badge className='bg-transparent outline outline-app-border-light text-primary w-fit'>
                                {t.catalogue.badges.reaction}
                              </Badge>
                            </div>
                            <div
                              className='bg-app-background rounded-lg w-14 h-14 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300'
                              dangerouslySetInnerHTML={{
                                __html: service.icon.replaceAll('1em', '2.5em'),
                              }}
                            ></div>
                          </div>

                          <p className='text-app-text-secondary items-center flex text-sm mb-6 line-clamp-3 min-h-[60px]'>
                            {reaction.description}
                          </p>

                          <Button
                            onClick={() =>
                              handleConnect(service, reaction.id, false)
                            }
                            variant='outline'
                            className='w-full border-app-red-primary text-app-red-primary hover:bg-app-red-primary hover:text-blue-400 transition-all duration-300 cursor-pointer'
                          >
                            {t.catalogue.buttons.addReaction}
                          </Button>
                        </CardContent>
                      </Card>
                    </>
                  ))}
              </>
            ))}
        </div>
      </main>
    </div>
  );
}
