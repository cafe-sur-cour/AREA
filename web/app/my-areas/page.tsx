'use client';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/contexts/I18nContext';
import { useRouter } from 'next/navigation';
import Navigation from '@/components/header';
import { useEffect, useState } from 'react';
import type { Mapping, formMapping } from '@/types/mapping';
import type { Action } from '@/types/action';
import type { Reaction } from '@/types/reaction';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Trash2, Plus, Power, PowerOff } from 'lucide-react';
import ActionForm from '@/components/action-form';
import ReactionForm from '@/components/reaction-form';
import { TbLoader3 } from 'react-icons/tb';
import { toast } from 'sonner';
import { useSearchParams } from 'next/navigation';

export default function MyAreasPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();
  const { t } = useI18n();
  const [loadingData, setLoadingData] = useState(true);
  const [data, setData] = useState<Mapping[]>([]);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const searchParams = useSearchParams();

  const [selectedAction, setSelectedAction] = useState<Action | null>(null);
  const [actionConfig, setActionConfig] = useState<Record<string, unknown>>({});

  const [selectedReactions, setSelectedReactions] = useState<Reaction[]>([]);
  const [reactionsConfig, setReactionsConfig] = useState<
    Record<string, unknown>[]
  >([]);

  const [formData, setFormData] = useState<formMapping>({
    name: '',
    description: '',
    action: undefined,
    reaction: [],
    is_active: true,
  });

  const selectActionUsingFetch = async (name: string, id: string) => {
    try {
      const res = (
        await api.get<Action>({ endpoint: `/services/${name}/actions/${id}` })
      ).data;
      console.log(res);
      if (res) setSelectedAction(res);
    } catch (err: unknown) {
      console.error(err);
    }
  };

  const selectReactionUsingFetch = async (name: string, id: string) => {
    try {
      const res = (
        await api.get<Reaction>({
          endpoint: `/services/${name}/reactions/${id}`,
        })
      ).data;
      console.log(res);
      if (res) setSelectedReactions([res]);
    } catch (err: unknown) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (
      searchParams.get('service') &&
      searchParams.get('id') &&
      searchParams.get('isAction')
    ) {
      if (searchParams.get('isAction') == 'true') {
        selectActionUsingFetch(
          searchParams.get('service')!,
          searchParams.get('id')!
        );
      } else {
        selectReactionUsingFetch(
          searchParams.get('service')!,
          searchParams.get('id')!
        );
      }
      setIsDrawerOpen(true);
    }
  }, [searchParams]);

  const fetchData = async () => {
    setLoadingData(true);
    try {
      const response = await api.get<{ mappings: Mapping[] }>({
        endpoint: '/mappings',
      });
      if (response.data) setData(response.data.mappings);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoadingData(false);
    }
  };

  const handleCreateAutomation = async () => {
    try {
      formData.action = {
        type: selectedAction?.id || '',
        config: actionConfig,
      };
      formData.reaction = selectedReactions.map((reaction, index) => ({
        type: reaction.id,
        config: reactionsConfig[index] || {},
        delay: reaction.delay,
      }));
      console.log('Creating mapping with data:', formData);
      const payload = {
        name: formData.name,
        description: formData.description,
        action: formData.action,
        reactions: formData.reaction,
        is_active: formData.is_active,
      };

      await api.post('/mappings', payload);

      setFormData({
        name: '',
        description: '',
        action: undefined,
        reaction: [],
        is_active: true,
      });
      setIsDrawerOpen(false);
      console.log('close');
      setSelectedAction(null);
      setSelectedReactions([]);
      setActionConfig({});
      setReactionsConfig([]);
      router.replace('/my-areas');
      fetchData();
    } catch (error) {
      console.error('Error creating mapping:', error);
      toast.error(t.myAreas.errors.createFailed);
    }
  };

  const handleDeleteMapping = async (id: number) => {
    if (!confirm(t.myAreas.card.deleteConfirm)) return;

    try {
      await api.delete(`/mappings/${id}`);
      fetchData();
    } catch (error) {
      console.error('Error deleting mapping:', error);
      toast.error(t.myAreas.errors.deleteFailed);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (isLoading) {
    return (
      <div className='min-h-screen flex items-center justify-center'>
        <div className='text-lg'>{t.myAreas.loading}</div>
        <TbLoader3 className='animate-spin text-app-text-secondary' size={24} />
      </div>
    );
  }

  if (!isAuthenticated) {
    router.push('/login');
    return null;
  }

  const switchActiveModeArea = async (mapping: Mapping) => {
    try {
      if (mapping.is_active == false) {
        await api.put(`/mappings/${mapping.id}/activate`);
        fetchData();
      } else {
        await api.put(`/mappings/${mapping.id}/deactivate`);
        fetchData();
      }
    } catch (error) {
      console.error('Error switching active mode:', error);
      toast.error(t.myAreas.errors.switchFailed);
    }
  };

  return (
    <div className='min-h-screen bg-gradient-to-br from-jeb-gradient-from to-jeb-gradient-to/50 flex flex-col'>
      <Navigation />

      <div className='container mx-auto px-4 py-8'>
        <div className='flex justify-between items-center mb-8'>
          <div>
            <h1 className='text-4xl font-bold text-primary mb-2'>{t.myAreas.title}</h1>
            <p className='text-muted-foreground'>
              {t.myAreas.subtitle}
            </p>
          </div>

          <Drawer
            open={isDrawerOpen}
            onOpenChange={setIsDrawerOpen}
            direction='right'
          >
            <DrawerTrigger asChild>
              <Button
                className='gap-2 cursor-pointer'
                onClick={() => {
                  setSelectedAction(null);
                  setSelectedReactions([]);
                  setActionConfig({});
                  setReactionsConfig([]);
                }}
              >
                <Plus className='w-4 h-4' />
                {t.myAreas.newAreaButton}
              </Button>
            </DrawerTrigger>
            <DrawerContent className='h-screen w-full sm:w-[500px] fixed right-0 top-0'>
              <DrawerHeader>
                <DrawerTitle>{t.myAreas.drawer.title}</DrawerTitle>
                <DrawerDescription>
                  {t.myAreas.drawer.subtitle}
                </DrawerDescription>
              </DrawerHeader>

              <div className='p-4 space-y-4 overflow-y-auto flex-1'>
                <div className='space-y-2'>
                  <Label htmlFor='name'>{t.myAreas.drawer.nameLabel}</Label>
                  <Input
                    id='name'
                    placeholder={t.myAreas.drawer.namePlaceholder}
                    value={formData.name}
                    onChange={e =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                  />
                </div>

                <div className='space-y-2'>
                  <Label htmlFor='description'>{t.myAreas.drawer.descriptionLabel}</Label>
                  <Textarea
                    id='description'
                    placeholder={t.myAreas.drawer.descriptionPlaceholder}
                    value={formData.description}
                    onChange={e =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    rows={3}
                  />
                </div>

                <div className='border-t pt-4'>
                  <h3 className='font-semibold mb-3'>{t.myAreas.drawer.actionTitle}</h3>

                  <ActionForm
                    selectedAction={selectedAction}
                    onActionChange={setSelectedAction}
                    actionConfig={actionConfig}
                    onConfigChange={setActionConfig}
                  />
                </div>

                <div className='border-t pt-4'>
                  <h3 className='font-semibold mb-3'>{t.myAreas.drawer.reactionTitle}</h3>

                  <ReactionForm
                    onReactionsChange={setSelectedReactions}
                    onConfigChange={setReactionsConfig}
                    defaultReaction={selectedReactions[0]}
                    selectedAction={selectedAction}
                  />
                </div>

                <div className='flex items-center justify-between border-t pt-4'>
                  <Label htmlFor='is_active'>{t.myAreas.drawer.activeLabel}</Label>
                  <Switch
                    id='is_active'
                    checked={formData.is_active}
                    onCheckedChange={checked =>
                      setFormData({ ...formData, is_active: checked })
                    }
                  />
                </div>
              </div>

              <DrawerFooter>
                <Button
                  className='cursor-pointer'
                  onClick={handleCreateAutomation}
                >
                  {t.myAreas.drawer.createButton}
                </Button>
                <DrawerClose asChild>
                  <Button
                    className=' cursor-pointer'
                    variant='outline'
                    onClick={() => {
                      router.replace('/my-areas');
                    }}
                  >
                    {t.myAreas.drawer.cancelButton}
                  </Button>
                </DrawerClose>
              </DrawerFooter>
            </DrawerContent>
          </Drawer>
        </div>

        {loadingData ? (
          <div className='text-center py-12'>
            <div className='text-lg text-muted-foreground'>
              {t.myAreas.loadingAreas}
            </div>
          </div>
        ) : data.length === 0 ? (
          <Card>
            <CardContent className='py-12 text-center'>
              <p className='text-muted-foreground mb-4'>{t.myAreas.emptyState.noAreas}</p>
              <p className='text-sm text-muted-foreground'>
                {t.myAreas.emptyState.description}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
            {data.map(mapping => (
              <Card key={mapping.id} className='relative'>
                <CardHeader>
                  <div className='flex items-start justify-between'>
                    <div className='flex-1'>
                      <CardTitle className='text-lg'>{mapping.name}</CardTitle>
                      <CardDescription className='mt-1'>
                        {mapping.description}
                      </CardDescription>
                    </div>
                    <div className='flex items-center gap-2'>
                      {mapping.is_active ? (
                        <Button
                          variant='ghost'
                          size='sm'
                          className='cursor-pointer'
                          onClick={() => switchActiveModeArea(mapping)}
                        >
                          <Power className='w-4 h-4 text-green-500' />
                        </Button>
                      ) : (
                        <Button
                          variant='ghost'
                          size='sm'
                          className='cursor-pointer'
                          onClick={() => switchActiveModeArea(mapping)}
                        >
                          <PowerOff className='w-4 h-4 text-gray-400' />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className='space-y-3 text-sm'>
                    <div>
                      <p className='font-semibold text-xs text-muted-foreground uppercase mb-1'>
                        {t.myAreas.card.actionLabel}
                      </p>
                      <p className='text-foreground'>{mapping.action.name}</p>
                    </div>

                    <div>
                      <p className='font-semibold text-xs text-muted-foreground uppercase mb-1'>
                        {t.myAreas.card.reactionsLabel}
                      </p>
                      <div className='space-y-1'>
                        {mapping.reactions.map((reaction, idx) => (
                          <div
                            key={idx}
                            className='flex items-center justify-between'
                          >
                            <span className='text-foreground'>
                              {reaction.name}
                            </span>
                            {reaction.delay > 0 && (
                              <span className='text-xs text-muted-foreground'>
                                +{reaction.delay}s
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className='pt-3 border-t flex items-center justify-between'>
                      <div className='text-xs text-muted-foreground'>
                        {t.myAreas.card.created}{' '}
                        {new Date(
                          mapping.created_at.toString()
                        ).toLocaleDateString()}
                      </div>
                      <Button
                        variant='ghost'
                        size='sm'
                        onClick={() => handleDeleteMapping(mapping.id)}
                        className='text-destructive hover:text-destructive hover:bg-destructive/10 cursor-pointer'
                      >
                        <Trash2 className='w-4 h-4' />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
