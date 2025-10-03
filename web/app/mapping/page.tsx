'use client';
import { useAuth } from '@/contexts/AuthContext';
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

export default function MappingPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();
  const [loadingData, setLoadingData] = useState(true);
  const [data, setData] = useState<Mapping[]>([]);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const [formData, setFormData] = useState<formMapping>({
    name: '',
    description: '',
    action: undefined,
    reaction: [],
    is_active: true,
  });

  const [selectedAction, setSelectedAction] = useState<Action | null>(null);
  const [actionConfig, setActionConfig] = useState<Record<string, unknown>>({});

  const [selectedReactions, setSelectedReactions] = useState<Reaction[]>([]);
  const [reactionsConfig, setReactionsConfig] = useState<
    Record<string, unknown>[]
  >([]);

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
        delay: 0,
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

      fetchData();
    } catch (error) {
      console.error('Error creating mapping:', error);
      alert('Failed to create mapping. Please check your input.');
    }
  };

  const handleDeleteMapping = async (id: number) => {
    if (!confirm('Are you sure you want to delete this mapping?')) return;

    try {
      await api.delete(`/mappings/${id}`);
      fetchData();
    } catch (error) {
      console.error('Error deleting mapping:', error);
      alert('Failed to delete mapping.');
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (isLoading) {
    return (
      <div className='min-h-screen flex items-center justify-center'>
        <div className='text-lg'>Loading...</div>
        <TbLoader3 className='animate-spin text-app-text-secondary' size={24} />
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
            <h1 className='text-4xl font-bold text-primary mb-2'>Mapping</h1>
            <p className='text-muted-foreground'>
              Manage your mapping workflows
            </p>
          </div>

          <Drawer
            open={isDrawerOpen}
            onOpenChange={setIsDrawerOpen}
            direction='right'
          >
            <DrawerTrigger asChild>
              <Button className='gap-2'>
                <Plus className='w-4 h-4' />
                New Mapping
              </Button>
            </DrawerTrigger>
            <DrawerContent className='h-screen w-full sm:w-[500px] fixed right-0 top-0'>
              <DrawerHeader>
                <DrawerTitle>Create New Mapping</DrawerTitle>
                <DrawerDescription>
                  Set up a new mapping workflow
                </DrawerDescription>
              </DrawerHeader>

              <div className='p-4 space-y-4 overflow-y-auto flex-1'>
                <div className='space-y-2'>
                  <Label htmlFor='name'>Name *</Label>
                  <Input
                    id='name'
                    placeholder='My Mapping'
                    value={formData.name}
                    onChange={e =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                  />
                </div>

                <div className='space-y-2'>
                  <Label htmlFor='description'>Description *</Label>
                  <Textarea
                    id='description'
                    placeholder='Describe what this mapping does...'
                    value={formData.description}
                    onChange={e =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    rows={3}
                  />
                </div>

                <div className='border-t pt-4'>
                  <h3 className='font-semibold mb-3'>Action</h3>

                  <ActionForm
                    selectedAction={selectedAction}
                    onActionChange={setSelectedAction}
                    actionConfig={actionConfig}
                    onConfigChange={setActionConfig}
                  />
                </div>

                <div className='border-t pt-4'>
                  <h3 className='font-semibold mb-3'>Reaction</h3>

                  <ReactionForm
                    onReactionsChange={setSelectedReactions}
                    onConfigChange={setReactionsConfig}
                  />
                </div>

                <div className='flex items-center justify-between border-t pt-4'>
                  <Label htmlFor='is_active'>Active</Label>
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
                <Button onClick={handleCreateAutomation}>Create Mapping</Button>
                <DrawerClose asChild>
                  <Button variant='outline'>Cancel</Button>
                </DrawerClose>
              </DrawerFooter>
            </DrawerContent>
          </Drawer>
        </div>

        {loadingData ? (
          <div className='text-center py-12'>
            <div className='text-lg text-muted-foreground'>
              Loading mappings...
            </div>
          </div>
        ) : data.length === 0 ? (
          <Card>
            <CardContent className='py-12 text-center'>
              <p className='text-muted-foreground mb-4'>No mappings yet</p>
              <p className='text-sm text-muted-foreground'>
                Create your first mapping to get started
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
                        <Power className='w-4 h-4 text-green-500' />
                      ) : (
                        <PowerOff className='w-4 h-4 text-gray-400' />
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className='space-y-3 text-sm'>
                    <div>
                      <p className='font-semibold text-xs text-muted-foreground uppercase mb-1'>
                        Action
                      </p>
                      <p className='text-foreground'>{mapping.action.type}</p>
                    </div>

                    <div>
                      <p className='font-semibold text-xs text-muted-foreground uppercase mb-1'>
                        Reactions
                      </p>
                      <div className='space-y-1'>
                        {mapping.reactions.map((reaction, idx) => (
                          <div
                            key={idx}
                            className='flex items-center justify-between'
                          >
                            <span className='text-foreground'>
                              {reaction.type}
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
                        Created{' '}
                        {new Date(
                          mapping.created_at.toString()
                        ).toLocaleDateString()}
                      </div>
                      <Button
                        variant='ghost'
                        size='sm'
                        onClick={() => handleDeleteMapping(mapping.id)}
                        className='text-destructive hover:text-destructive hover:bg-destructive/10'
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
