'use client';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/contexts/I18nContext';
import { useRouter } from 'next/navigation';
import Navigation from '@/components/header';
import { useEffect, useState, useCallback } from 'react';
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Trash2, Plus, Power, PowerOff, AlertCircle, CheckCircle2 } from 'lucide-react';
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [mappingToDelete, setMappingToDelete] = useState<number | null>(null);
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

  const resetForm = useCallback(() => {
    setFormData({
      name: '',
      description: '',
      action: undefined,
      reaction: [],
      is_active: true,
    });
    setSelectedAction(null);
    setSelectedReactions([]);
    setActionConfig({});
    setReactionsConfig([]);
  }, []);

  const selectActionUsingFetch = useCallback(async (name: string, id: string) => {
    try {
      const res = (
        await api.get<Action>({ endpoint: `/services/${name}/actions/${id}` })
      ).data;
      if (res) {
        setSelectedAction(res);
        toast.success(t.myAreas.feedback.actionSelected);
      }
    } catch (err: unknown) {
      console.error(err);
      toast.error(t.myAreas.feedback.actionSelectError);
    }
  }, []);

  const selectReactionUsingFetch = useCallback(async (name: string, id: string) => {
    try {
      const res = (
        await api.get<Reaction>({
          endpoint: `/services/${name}/reactions/${id}`,
        })
      ).data;
      if (res) {
        setSelectedReactions([res]);
        toast.success(t.myAreas.feedback.reactionSelected);
      }
    } catch (err: unknown) {
      console.error(err);
      toast.error(t.myAreas.feedback.reactionSelectError);
    }
  }, []);

  useEffect(() => {
    if (
      searchParams.get('service') &&
      searchParams.get('id') &&
      searchParams.get('isAction')
    ) {
      if (searchParams.get('isAction') === 'true') {
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
  }, [searchParams, selectActionUsingFetch, selectReactionUsingFetch]);

  const fetchData = useCallback(async () => {
    setLoadingData(true);
    try {
      const response = await api.get<{ mappings: Mapping[] }>({
        endpoint: '/mappings',
      });
      if (response.data) setData(response.data.mappings);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error(t.myAreas.feedback.loadError);
    } finally {
      setLoadingData(false);
    }
  }, []);

  const validateForm = (): boolean => {
    if (!formData.name.trim()) {
      toast.error(t.myAreas.feedback.nameRequired);
      return false;
    }
    if (!selectedAction) {
      toast.error(t.myAreas.feedback.actionRequired);
      return false;
    }
    if (selectedReactions.length === 0) {
      toast.error(t.myAreas.feedback.reactionRequired);
      return false;
    }
    return true;
  };

  const handleCreateAutomation = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);
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

      const payload = {
        name: formData.name,
        description: formData.description,
        action: formData.action,
        reactions: formData.reaction,
        is_active: formData.is_active,
      };

      await api.post('/mappings', payload);

      toast.success(t.myAreas.feedback.createSuccess, {
        description: `"${formData.name}" ${t.myAreas.feedback.createSuccessDescription} ${formData.is_active ? t.myAreas.feedback.active : t.myAreas.feedback.inactive}`,
      });

      resetForm();
      setIsDrawerOpen(false);
      router.replace('/my-areas');
      fetchData();
    } catch (error) {
      console.error('Error creating mapping:', error);
      toast.error(t.myAreas.errors.createFailed);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteMapping = async (id: number) => {
    try {
      await api.delete(`/mappings/${id}`);
      toast.success(t.myAreas.feedback.deleteSuccess);
      fetchData();
    } catch (error) {
      console.error('Error deleting mapping:', error);
      toast.error(t.myAreas.errors.deleteFailed);
    } finally {
      setDeleteDialogOpen(false);
      setMappingToDelete(null);
    }
  };

  const switchActiveModeArea = async (mapping: Mapping) => {
    try {
      if (mapping.is_active === false) {
        await api.put(`/mappings/${mapping.id}/activate`);
        toast.success(`✅ "${mapping.name}" ${t.myAreas.feedback.activateSuccess}`);
      } else {
        await api.put(`/mappings/${mapping.id}/deactivate`);
        toast.info(`⏸️ "${mapping.name}" ${t.myAreas.feedback.deactivateInfo}`);
      }
      fetchData();
    } catch (error) {
      console.error('Error switching active mode:', error);
      toast.error(t.myAreas.errors.switchFailed);
    }
  };

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (
      searchParams.get('service') &&
      searchParams.get('id') &&
      searchParams.get('isAction')
    ) {
      if (searchParams.get('isAction') === 'true') {
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
  }, [searchParams, selectActionUsingFetch, selectReactionUsingFetch]);

  const LoadingCards = () => (
    <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
      {[1, 2, 3].map((i) => (
        <Card key={i}>
          <CardHeader>
            <Skeleton className='h-6 w-3/4 mb-2' />
            <Skeleton className='h-4 w-full' />
          </CardHeader>
          <CardContent>
            <Skeleton className='h-4 w-1/2 mb-2' />
            <Skeleton className='h-4 w-full mb-4' />
            <Skeleton className='h-4 w-1/2 mb-2' />
            <Skeleton className='h-4 w-full' />
          </CardContent>
        </Card>
      ))}
    </div>
  );

  if (isLoading) {
    return (
      <div className='min-h-screen flex items-center justify-center gap-3'>
        <TbLoader3 className='animate-spin text-primary' size={32} />
        <div className='text-lg text-primary'>{t.myAreas.loading}</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    router.push('/login');
    return null;
  }

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
            onOpenChange={(open) => {
              setIsDrawerOpen(open);
              if (!open) {
                resetForm();
                router.replace('/my-areas');
              }
            }}
            direction='right'
          >
            <DrawerTrigger asChild>
              <Button
                className='gap-2 cursor-pointer shadow-lg hover:shadow-xl transition-all'
                onClick={resetForm}
              >
                <Plus className='w-4 h-4' />
                {t.myAreas.newAreaButton}
              </Button>
            </DrawerTrigger>
            <DrawerContent className='h-screen w-full fixed inset-0'>
              <div className='h-full flex flex-col max-w-7xl mx-auto'>
                <DrawerHeader className='border-b px-6 py-4'>
                  <DrawerTitle className='text-2xl'>{t.myAreas.drawer.title}</DrawerTitle>
                  <DrawerDescription>
                    {t.myAreas.drawer.subtitle}
                  </DrawerDescription>
                </DrawerHeader>

                <div className='flex-1 overflow-y-auto px-6 py-6'>
                  <div className='max-w-4xl mx-auto mb-8 space-y-4'>
                    <div className='space-y-2'>
                      <Label htmlFor='name' className='text-sm font-medium'>
                        {t.myAreas.drawer.nameLabel} <span className='text-destructive'>*</span>
                      </Label>
                      <Input
                        id='name'
                        placeholder={t.myAreas.drawer.namePlaceholder}
                        value={formData.name}
                        onChange={e =>
                          setFormData({ ...formData, name: e.target.value })
                        }
                        className='transition-all focus:ring-2 text-lg h-12'
                      />
                    </div>

                    <div className='space-y-2'>
                      <Label htmlFor='description' className='text-sm font-medium'>
                        {t.myAreas.drawer.descriptionLabel}
                      </Label>
                      <Textarea
                        id='description'
                        placeholder={t.myAreas.drawer.descriptionPlaceholder}
                        value={formData.description}
                        onChange={e =>
                          setFormData({ ...formData, description: e.target.value })
                        }
                        rows={2}
                        className='transition-all focus:ring-2 resize-none'
                      />
                    </div>
                  </div>

                  <div className='max-w-6xl mx-auto relative'>
                    <div className='hidden lg:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 items-center justify-center pointer-events-none'>
                      <div className='bg-background border-2 border-primary rounded-full px-6 py-3 shadow-lg'>
                        <div className='flex items-center gap-3'>
                          <div className='w-3 h-3 rounded-full bg-blue-500 animate-pulse' />
                          <span className='text-sm font-bold text-primary'>THEN</span>
                          <div className='w-3 h-3 rounded-full bg-purple-500 animate-pulse' />
                        </div>
                      </div>
                    </div>

                    <div className='grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6'>
                      <Card className='border-2 border-blue-200 dark:border-blue-900 bg-gradient-to-br from-blue-50/50 to-transparent dark:from-blue-950/20 hover:shadow-xl transition-all duration-300'>
                        <CardHeader>
                          <div className='flex items-center gap-3'>
                            <div className='w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center shadow-lg'>
                              <span className='text-white font-bold text-lg'>1</span>
                            </div>
                            <div className='flex-1'>
                              <CardTitle className='text-xl flex items-center gap-2'>
                                {t.myAreas.drawer.actionTitle}
                                {selectedAction && <CheckCircle2 className='w-5 h-5 text-green-500' />}
                              </CardTitle>
                              <CardDescription>
                                {t.myAreas.drawer.actionSubtitle}
                              </CardDescription>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <ActionForm
                            selectedAction={selectedAction}
                            onActionChange={setSelectedAction}
                            actionConfig={actionConfig}
                            onConfigChange={setActionConfig}
                          />
                        </CardContent>
                      </Card>

                      <Card className='border-2 border-purple-200 dark:border-purple-900 bg-gradient-to-br from-purple-50/50 to-transparent dark:from-purple-950/20 hover:shadow-xl transition-all duration-300'>
                        <CardHeader>
                          <div className='flex items-center gap-3'>
                            <div className='w-10 h-10 rounded-full bg-purple-500 flex items-center justify-center shadow-lg'>
                              <span className='text-white font-bold text-lg'>2</span>
                            </div>
                            <div className='flex-1'>
                              <CardTitle className='text-xl flex items-center gap-2'>
                                {t.myAreas.drawer.reactionTitle}
                                {selectedReactions.length > 0 && (
                                  <span className='bg-purple-500 text-white text-xs px-2.5 py-1 rounded-full font-medium'>
                                    {selectedReactions.length}
                                  </span>
                                )}
                              </CardTitle>
                              <CardDescription>
                                {t.myAreas.drawer.reactionSubtitle}
                              </CardDescription>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <ReactionForm
                            onReactionsChange={setSelectedReactions}
                            onConfigChange={setReactionsConfig}
                            defaultReaction={selectedReactions[0]}
                            selectedAction={selectedAction}
                          />
                        </CardContent>
                      </Card>
                    </div>

                    <div className='flex items-center justify-center -mt-3 mb-6 lg:hidden'>
                      <div className='flex items-center gap-2 bg-primary/10 border border-primary px-4 py-2 rounded-full'>
                        <div className='w-2 h-2 rounded-full bg-blue-500 animate-pulse' />
                        <span className='text-xs font-bold text-primary'>THEN</span>
                        <div className='w-2 h-2 rounded-full bg-purple-500 animate-pulse' />
                      </div>
                    </div>
                  </div>

                  <div className='max-w-4xl mx-auto mt-6'>
                    <Card className='bg-muted/30'>
                      <CardContent className='py-4'>
                        <div className='flex items-center justify-between'>
                          <div className='space-y-1'>
                            <Label htmlFor='is_active' className='text-base font-semibold cursor-pointer'>
                              {t.myAreas.drawer.activeLabel}
                            </Label>
                            <p className='text-sm text-muted-foreground'>
                              {t.myAreas.feedback.automationWillBe} {formData.is_active ? t.myAreas.feedback.active : t.myAreas.feedback.inactive} {t.myAreas.feedback.afterCreation}
                            </p>
                          </div>
                          <Switch
                            id='is_active'
                            checked={formData.is_active}
                            onCheckedChange={checked =>
                              setFormData({ ...formData, is_active: checked })
                            }
                          />
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>

                <DrawerFooter className='border-t bg-background/95 backdrop-blur px-6 py-4'>
                  <div className='max-w-4xl mx-auto w-full flex gap-3'>
                    <DrawerClose asChild>
                      <Button
                        className='cursor-pointer flex-1'
                        variant='outline'
                        disabled={isSubmitting}
                        onClick={() => {
                          resetForm();
                          router.replace('/my-areas');
                        }}
                      >
                        {t.myAreas.drawer.cancelButton}
                      </Button>
                    </DrawerClose>
                    <Button
                      className='cursor-pointer flex-1 shadow-lg'
                      onClick={handleCreateAutomation}
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <>
                          <TbLoader3 className='animate-spin mr-2' size={18} />
                          {t.myAreas.feedback.creating}
                        </>
                      ) : (
                        <>
                          <Plus className='w-4 h-4 mr-2' />
                          {t.myAreas.drawer.createButton}
                        </>
                      )}
                    </Button>
                  </div>
                </DrawerFooter>
              </div>
            </DrawerContent>
          </Drawer>
        </div>

        {loadingData ? (
          <LoadingCards />
        ) : data.length === 0 ? (
          <Card className='border-dashed border-2'>
            <CardContent className='py-16 text-center'>
              <div className='flex flex-col items-center gap-4'>
                <div className='w-16 h-16 rounded-full bg-muted flex items-center justify-center'>
                  <AlertCircle className='w-8 h-8 text-muted-foreground' />
                </div>
                <div>
                  <h3 className='text-lg font-semibold mb-2'>{t.myAreas.emptyState.noAreas}</h3>
                  <p className='text-sm text-muted-foreground max-w-md mx-auto'>
                    {t.myAreas.emptyState.description}
                  </p>
                </div>
                <Button
                  onClick={() => setIsDrawerOpen(true)}
                  className='mt-4 cursor-pointer'
                >
                  <Plus className='w-4 h-4 mr-2' />
                  {t.myAreas.feedback.createFirstAutomation}
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
            {data.map(mapping => (
              <Card
                key={mapping.id}
                className='relative hover:shadow-lg transition-all duration-200 group'
              >
                <CardHeader>
                  <div className='flex items-start justify-between gap-3'>
                    <div className='flex-1 min-w-0'>
                      <CardTitle className='text-lg truncate'>{mapping.name}</CardTitle>
                      <CardDescription className='mt-1 line-clamp-2'>
                        {mapping.description || t.myAreas.card.noDescription}
                      </CardDescription>
                    </div>
                    <div className='flex items-center gap-1 flex-shrink-0'>
                      <Button
                        variant='ghost'
                        size='sm'
                        className='cursor-pointer h-9 w-9 p-0 transition-transform hover:scale-110'
                        onClick={() => switchActiveModeArea(mapping)}
                        title={mapping.is_active ? t.myAreas.card.deactivate : t.myAreas.card.activate}
                      >
                        {mapping.is_active ? (
                          <Power className='w-4 h-4 text-green-500' />
                        ) : (
                          <PowerOff className='w-4 h-4 text-gray-400' />
                        )}
                      </Button>
                    </div>
                  </div>
                  {mapping.is_active && (
                    <div className='absolute top-2 right-2 w-2 h-2 bg-green-500 rounded-full animate-pulse' />
                  )}
                </CardHeader>
                <CardContent>
                  <div className='space-y-3 text-sm'>
                    <div className='bg-blue-50 dark:bg-blue-950/20 p-3 rounded-lg'>
                      <p className='font-semibold text-xs text-blue-600 dark:text-blue-400 uppercase mb-1.5 flex items-center gap-1'>
                        ⚡ {t.myAreas.card.actionLabel}
                      </p>
                      <p className='text-foreground font-medium'>{mapping.action.name}</p>
                    </div>

                    <div className='bg-purple-50 dark:bg-purple-950/20 p-3 rounded-lg'>
                      <p className='font-semibold text-xs text-purple-600 dark:text-purple-400 uppercase mb-1.5 flex items-center gap-1'>
                        {t.myAreas.card.reactionsLabel}
                      </p>
                      <div className='space-y-1.5'>
                        {mapping.reactions.map((reaction, idx) => (
                          <div
                            key={idx}
                            className='flex items-center justify-between bg-background/50 px-2 py-1 rounded'
                          >
                            <span className='text-foreground text-xs'>
                              {reaction.name}
                            </span>
                            {reaction.delay > 0 && (
                              <span className='text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded'>
                                +{reaction.delay}s
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className='pt-3 border-t flex items-center justify-between'>
                      <div className='text-xs text-muted-foreground flex items-center gap-1'>
                        <span>📅</span>
                        {new Date(
                          mapping.created_at.toString()
                        ).toLocaleDateString('fr-FR', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </div>
                      <Button
                        variant='ghost'
                        size='sm'
                        onClick={() => {
                          setMappingToDelete(mapping.id);
                          setDeleteDialogOpen(true);
                        }}
                        className='text-destructive hover:text-destructive hover:bg-destructive/10 cursor-pointer h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity'
                        title={t.myAreas.feedback.delete}
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

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t.myAreas.feedback.confirmDelete}</AlertDialogTitle>
            <AlertDialogDescription>
              {t.myAreas.feedback.confirmDeleteDescription}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setMappingToDelete(null)}>
              {t.myAreas.feedback.cancel}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => mappingToDelete && handleDeleteMapping(mappingToDelete)}
              className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
            >
              {t.myAreas.feedback.delete}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
