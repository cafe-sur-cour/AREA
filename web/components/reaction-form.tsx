'use client';
import api from '@/lib/api';
import { Reaction, ServiceReaction } from '@/types/reaction';
import { useEffect } from 'react';
import { useState } from 'react';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Trash2 } from 'lucide-react';

interface ReactionInstance {
  id: string;
  reaction: Reaction | null;
  config: Record<string, unknown>;
  delay: number | null;
  selectedService: string | null;
}

interface ReactionFormProps {
  onReactionsChange: (reactions: Reaction[]) => void;
  onConfigChange: (config: Record<string, unknown>[]) => void;
  defaultReaction: Reaction | null;
}

const getStringValue = (value: unknown): string => {
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return value.toString();
  return '';
};

export default function ReactionForm({
  onReactionsChange,
  onConfigChange,
  defaultReaction,
}: ReactionFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [ServiceReactions, setServiceReactions] = useState<ServiceReaction[]>(
    []
  );
  console.log('DEFAULT REACTION: ', defaultReaction);
  const [reactionInstances, setReactionInstances] = useState<
    ReactionInstance[]
  >([
    {
      id: `reaction-${Date.now()}`,
      reaction: defaultReaction,
      config: {},
      delay: 0,
      selectedService: defaultReaction?.serviceId!,
    },
  ]);

  useEffect(() => {
    const fetchAction = async () => {
      try {
        setIsLoading(true);
        const res = (
          await api.get<{ services: ServiceReaction[] }>({
            endpoint: '/services/reactions',
          })
        ).data;
        if (!res?.services || res.services.length === 0) {
          console.log('No service actions found');
          return;
        }
        console.log('Service actions: ', res.services);
        setServiceReactions(res.services);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAction();
  }, []);
  const addReaction = () => {
    const newReaction: ReactionInstance = {
      id: `reaction-${Date.now()}`,
      reaction: null,
      config: {},
      delay: null,
      selectedService: null,
    };
    setReactionInstances([...reactionInstances, newReaction]);
  };

  const removeReaction = (id: string) => {
    const updatedInstances = reactionInstances.filter(
      instance => instance.id !== id
    );
    setReactionInstances(updatedInstances);

    const reactions = updatedInstances
      .filter(instance => instance.reaction)
      .map(instance => instance.reaction!);
    const configs = updatedInstances.map(instance => instance.config);

    onReactionsChange(reactions);
    onConfigChange(configs);
  };

  const updateReactionInstance = (
    id: string,
    updates: Partial<ReactionInstance>
  ) => {
    const updatedInstances = reactionInstances.map(instance =>
      instance.id === id ? { ...instance, ...updates } : instance
    );
    setReactionInstances(updatedInstances);

    const reactions = updatedInstances
      .filter(instance => instance.reaction)
      .map(instance => {
        if (instance.reaction) {
          // Attacher le delay à la réaction avant de l'envoyer au parent
          return {
            ...instance.reaction,
            delay: instance.delay || 0,
          };
        }
        return instance.reaction!;
      });
    const configs = updatedInstances.map(instance => instance.config);

    console.log('Updated reactions with delays:', reactions);
    onReactionsChange(reactions);
    onConfigChange(configs);
  };

  const getAvailableReactions = (serviceId: string): Reaction[] => {
    return (
      ServiceReactions.find(service => service.id === serviceId)?.reactions ||
      []
    );
  };

  if (isLoading) return null;

  return (
    <div className='space-y-4'>
      {reactionInstances.map((instance, index) => (
        <Card key={instance.id} className='relative'>
          <CardHeader className='pb-3'>
            <div className='flex items-center justify-between'>
              <CardTitle className='text-sm'>Reaction {index + 1}</CardTitle>
              {reactionInstances.length > 1 && (
                <Button
                  variant='ghost'
                  size='sm'
                  onClick={() => removeReaction(instance.id)}
                  className='text-red-500 hover:text-red-600 cursor-pointer'
                >
                  <Trash2 className='w-4 h-4' />
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className='space-y-3'>
            {/* Service Selection */}
            <div>
              <label className='text-sm font-medium text-gray-700 mb-1 block'>
                Service
              </label>
              <Select
                value={instance.selectedService || ''}
                onValueChange={value => {
                  updateReactionInstance(instance.id, {
                    selectedService: value,
                    reaction: null,
                    config: {},
                  });
                }}
              >
                <SelectTrigger className='w-full'>
                  <SelectValue placeholder='Select a service' />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>Services</SelectLabel>
                    {ServiceReactions.map(service => (
                      <SelectItem key={service.id} value={service.id}>
                        {service.name}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>

            {/* Reaction Selection */}
            {instance.selectedService && (
              <div>
                <label className='text-sm font-medium text-gray-700 mb-1 block'>
                  Reaction
                </label>
                <Select
                  value={instance.reaction?.id || ''}
                  onValueChange={value => {
                    const selectedReaction =
                      getAvailableReactions(instance.selectedService!).find(
                        reaction => reaction.id === value
                      ) || null;

                    updateReactionInstance(instance.id, {
                      reaction: selectedReaction,
                      config: {},
                    });
                  }}
                >
                  <SelectTrigger className='w-full'>
                    <SelectValue placeholder='Select a reaction' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel>Reactions</SelectLabel>
                      {getAvailableReactions(instance.selectedService).map(
                        reaction => (
                          <SelectItem key={reaction.id} value={reaction.id}>
                            {reaction.name}
                          </SelectItem>
                        )
                      )}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Configuration Fields */}
            {instance.reaction && instance.reaction.configSchema && (
              <div className='space-y-3 pt-2 border-t'>
                <h4 className='text-sm font-medium text-gray-700'>
                  Configuration
                </h4>
                {instance.reaction.configSchema.fields.map(field => (
                  <div key={field.name}>
                    <label className='block text-sm font-medium text-gray-700 mb-1'>
                      {field.label}
                    </label>
                    <input
                      type={field.type}
                      name={field.name}
                      placeholder={field.placeholder}
                      required={field.required}
                      value={
                        getStringValue(instance.config[field.name]) ||
                        getStringValue(field.default) ||
                        ''
                      }
                      onChange={e => {
                        updateReactionInstance(instance.id, {
                          config: {
                            ...instance.config,
                            [field.name]: e.target.value,
                          },
                        });
                      }}
                      className='mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 text-sm'
                    />
                  </div>
                ))}
              </div>
            )}
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>
                Delay in seconds
              </label>
              <input
                type='number'
                name='delay'
                placeholder='Delay (in sec)'
                value={
                  instance.delay !== null ? instance.delay.toString() : '0'
                }
                onChange={e => {
                  updateReactionInstance(instance.id, {
                    delay: Number(e.target.value),
                  });
                }}
                className='mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 text-sm'
              />
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Add Reaction Button */}
      <Button
        variant='outline'
        onClick={addReaction}
        className='w-full border-dashed cursor-pointer'
      >
        <Plus className='w-4 h-4 mr-2' />
        Add Another Reaction
      </Button>
    </div>
  );
}
