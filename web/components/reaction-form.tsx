'use client';
import api from '@/lib/api';
import { Reaction, ServiceReaction } from '@/types/reaction';
import { Action } from '@/types/action';
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
import { Plus, Trash2, Zap, Info } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface ReactionInstance {
  id: string;
  reaction: Reaction | null;
  config: Record<string, unknown>;
  delay: number | null;
  selectedService: string | null;
  dynamicFields: Record<string, boolean>; // Track which fields are in dynamic mode
}

interface ReactionFormProps {
  onReactionsChange: (reactions: Reaction[]) => void;
  onConfigChange: (config: Record<string, unknown>[]) => void;
  selectedAction?: Action | null; // Action sélectionnée pour afficher les champs de payload
}

const getStringValue = (value: unknown): string => {
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return value.toString();
  return '';
};

export default function ReactionForm({
  onReactionsChange,
  onConfigChange,
  selectedAction,
}: ReactionFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [ServiceReactions, setServiceReactions] = useState<ServiceReaction[]>(
    []
  );
  const [reactionInstances, setReactionInstances] = useState<
    ReactionInstance[]
  >([
    {
      id: `reaction-${Date.now()}`,
      reaction: null,
      config: {},
      delay: 0,
      selectedService: null,
      dynamicFields: {},
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
      dynamicFields: {},
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
                onValueChange={(value: string) => {
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
                  onValueChange={(value: string) => {
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

                {/* Payload Fields Info */}
                {selectedAction?.payloadFields && selectedAction.payloadFields.length > 0 && (
                  <div className='bg-blue-50 border border-blue-200 rounded-md p-3 mb-4'>
                    <div className='flex items-center mb-2'>
                      <Info className='w-4 h-4 text-blue-600 mr-2' />
                      <span className='text-sm font-medium text-blue-800'>
                        Available Action Data
                      </span>
                    </div>
                    <p className='text-xs text-blue-700 mb-2'>
                      When configuring dynamic fields, you can reference data from the &quot;{selectedAction.name}&quot; action:
                    </p>
                    <div className='space-y-1'>
                      {selectedAction.payloadFields.map(field => (
                        <div key={field.path} className='text-xs'>
                          <code className='bg-blue-100 text-blue-800 px-1 py-0.5 rounded font-mono'>
                            {'{{action.payload.' + field.path + '}}'}
                          </code>
                          <span className='text-blue-600 ml-2'>
                            {field.description} ({field.type})
                          </span>
                          {field.example && (
                            <span className='text-blue-500 ml-1'>
                              e.g., {field.example}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {instance.reaction.configSchema.fields.map(field => {
                  const isDynamic = field.dynamic;
                  const isInDynamicMode = instance.dynamicFields[field.name] || false;

                  return (
                    <div key={field.name} className='space-y-2'>
                      <div className='flex items-center justify-between'>
                        <label className='block text-sm font-medium text-gray-700'>
                          {field.label}
                          {isDynamic && (
                            <span className='ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded'>
                              Dynamic
                            </span>
                          )}
                        </label>
                        {isDynamic && (
                          <div className='flex items-center space-x-2'>
                            <span className='text-xs text-gray-500'>Dynamic</span>
                            <Switch
                              checked={isInDynamicMode}
                              onCheckedChange={(checked: boolean) => {
                                updateReactionInstance(instance.id, {
                                  dynamicFields: {
                                    ...instance.dynamicFields,
                                    [field.name]: checked,
                                  },
                                  config: {
                                    ...instance.config,
                                    [field.name]: checked
                                      ? (field.dynamicPlaceholder || '')
                                      : (instance.config[field.name] || ''),
                                  },
                                });
                              }}
                            />
                          </div>
                        )}
                      </div>

                      {isDynamic && isInDynamicMode && (
                        <div className='text-xs text-gray-500 mb-2'>
                          Use {'{{action.payload.field}}'} syntax to reference action data.
                          {field.dynamicPlaceholder && (
                            <div className='mt-1 p-2 bg-gray-50 rounded text-xs font-mono'>
                              Example: {field.dynamicPlaceholder}
                            </div>
                          )}
                        </div>
                      )}

                      <textarea
                        name={field.name}
                        placeholder={
                          isDynamic && isInDynamicMode
                            ? field.dynamicPlaceholder || field.placeholder
                            : field.placeholder
                        }
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
                        className={`mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 text-sm ${
                          isDynamic && isInDynamicMode ? 'font-mono bg-blue-50' : ''
                        }`}
                        rows={field.type === 'textarea' ? 3 : 1}
                      />
                    </div>
                  );
                })}
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
