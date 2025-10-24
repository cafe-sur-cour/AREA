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
            <DrawerContent className='h-screen w-full sm:w-[500px] fixed right-0 top-0'>
              <DrawerHeader>
                <DrawerTitle className='text-xl'>{t.myAreas.drawer.title}</DrawerTitle>
                <DrawerDescription>
                  {t.myAreas.drawer.subtitle}
                </DrawerDescription>
              </DrawerHeader>

              <div className='p-4 space-y-6 overflow-y-auto flex-1'>
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
                    className='transition-all focus:ring-2'
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
                    rows={3}
                    className='transition-all focus:ring-2 resize-none'
                  />
                </div>

                <div className='border-t pt-4 space-y-3'>
                  <div className='flex items-center gap-2'>
                    <div className='w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center'>
                      <span className='text-primary font-bold'>1</span>
                    </div>
                    <h3 className='font-semibold text-base'>{t.myAreas.drawer.actionTitle}</h3>
                    {selectedAction && <CheckCircle2 className='w-4 h-4 text-green-500 ml-auto' />}
                  </div>

                  <ActionForm
                    selectedAction={selectedAction}
                    onActionChange={setSelectedAction}
                    actionConfig={actionConfig}
                    onConfigChange={setActionConfig}
                  />
                </div>

                <div className='border-t pt-4 space-y-3'>
                  <div className='flex items-center gap-2'>
                    <div className='w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center'>
                      <span className='text-primary font-bold'>2</span>
                    </div>
                    <h3 className='font-semibold text-base'>{t.myAreas.drawer.reactionTitle}</h3>
                    {selectedReactions.length > 0 && (
                      <span className='ml-auto bg-primary/10 text-primary text-xs px-2 py-1 rounded-full'>
                        {selectedReactions.length}
                      </span>
                    )}
                  </div>

                  <ReactionForm
                    onReactionsChange={setSelectedReactions}
                    onConfigChange={setReactionsConfig}
                    defaultReaction={selectedReactions[0]}
                    selectedAction={selectedAction}
                  />
                </div>

                <div className='flex items-center justify-between border-t pt-4 bg-muted/30 p-3 rounded-lg'>
                  <div className='space-y-0.5'>
                    <Label htmlFor='is_active' className='text-sm font-medium cursor-pointer'>
                      {t.myAreas.drawer.activeLabel}
                    </Label>
                    <p className='text-xs text-muted-foreground'>
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
              </div>

              <DrawerFooter className='border-t bg-background/95 backdrop-blur'>
                <Button
                  className='cursor-pointer w-full shadow-lg'
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
                <DrawerClose asChild>
                  <Button
                    className='cursor-pointer w-full'
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
              </DrawerFooter>
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
                        🎯 {t.myAreas.card.reactionsLabel}
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
