'use client';
import api from '@/lib/api';
import { Reaction, ServiceReaction } from '@/types/reaction';
import { Action, PayloadField } from '@/types/action';
import { useState, useRef, useEffect } from 'react';
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
import { Plus, Trash2, Info } from 'lucide-react';
import { Switch } from '@/components/ui/switch';

interface ReactionInstance {
  id: string;
  reaction: Reaction | null;
  config: Record<string, unknown>;
  delay: number | null;
  selectedService: string | null;
  dynamicFields: Record<string, boolean>; // Track which fields are in dynamic mode
}

interface DynamicTextareaProps {
  name: string;
  placeholder: string;
  required: boolean;
  value: string;
  onChange: (value: string) => void;
  payloadFields: PayloadField[];
  rows?: number;
}

const DynamicTextarea: React.FC<DynamicTextareaProps> = ({
  name,
  placeholder,
  required,
  value,
  onChange,
  payloadFields,
  rows = 1,
}) => {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<PayloadField[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [cursorPosition, setCursorPosition] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    const newCursorPosition = e.target.selectionStart || 0;

    onChange(newValue);
    setCursorPosition(newCursorPosition);

    // Check if we should show suggestions
    const textBeforeCursor = newValue.substring(0, newCursorPosition);
    const lastOpenBrace = textBeforeCursor.lastIndexOf('{');

    if (lastOpenBrace !== -1 && lastOpenBrace === newCursorPosition - 1) {
      // Show all suggestions when typing a single {
      setSuggestions(payloadFields);
      setShowSuggestions(true);
      setSelectedIndex(-1);
    } else {
      setShowSuggestions(false);
      setSelectedIndex(-1);
    }
  };

  const insertSuggestion = (field: PayloadField) => {
    const textBeforeCursor = value.substring(0, cursorPosition);
    const lastOpenBrace = textBeforeCursor.lastIndexOf('{');

    if (lastOpenBrace !== -1 && lastOpenBrace === cursorPosition - 1) {
      // Replace the single { with the full template
      const beforeBrace = value.substring(0, lastOpenBrace);
      const afterBrace = value.substring(cursorPosition);
      const newValue = `${beforeBrace}{{action.payload.${field.path}}}${afterBrace}`;

      onChange(newValue);
      setShowSuggestions(false);

      // Focus back to textarea and set cursor position
      setTimeout(() => {
        if (textareaRef.current) {
          const newCursorPos = beforeBrace.length + `{{action.payload.${field.path}}`.length;
          textareaRef.current.focus();
          textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
        }
      }, 0);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (showSuggestions && suggestions.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev =>
          prev < suggestions.length - 1 ? prev + 1 : 0
        );
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev =>
          prev > 0 ? prev - 1 : suggestions.length - 1
        );
      } else if (e.key === 'Enter' && selectedIndex >= 0) {
        e.preventDefault();
        insertSuggestion(suggestions[selectedIndex]);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        setShowSuggestions(false);
        setSelectedIndex(-1);
      }
    }
  };

  return (
    <div className="relative">
      <textarea
        ref={textareaRef}
        name={name}
        placeholder={placeholder}
        required={required}
        value={value}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 text-sm font-mono bg-blue-50"
        rows={rows}
      />

      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-40 overflow-y-auto">
          {suggestions.map((field, index) => (
            <div
              key={field.path}
              className={`px-3 py-2 cursor-pointer text-sm ${
                index === selectedIndex ? 'bg-blue-100' : 'hover:bg-gray-100'
              }`}
              onClick={() => insertSuggestion(field)}
            >
              <div className="font-mono text-blue-600">
                {`{{action.payload.${field.path}}}`}
              </div>
              <div className="text-gray-500 text-xs">
                {field.description}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

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
                {selectedAction?.payloadFields &&
                  selectedAction.payloadFields.length > 0 &&
                  instance.reaction?.configSchema?.fields?.some(
                    field => field.dynamic
                  ) && (
                    <div className='bg-blue-50 border border-blue-200 rounded-md p-3 mb-4'>
                      <div className='flex items-center mb-2'>
                        <Info className='w-4 h-4 text-blue-600 mr-2' />
                        <span className='text-sm font-medium text-blue-800'>
                          Available Action Data
                        </span>
                      </div>
                      <p className='text-xs text-blue-700 mb-2'>
                        When configuring dynamic fields, you can reference data
                        from the &quot;{selectedAction.name}&quot; action.
                        Use the {'{{action.payload.field}}'} syntax to insert
                        action data into dynamic fields.
                      </p>
                    </div>
                  )}

                {instance.reaction.configSchema.fields.map(field => {
                  const isDynamic = field.dynamic;
                  const isInDynamicMode =
                    instance.dynamicFields[field.name] || false;

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
                            <span className='text-xs text-gray-500'>
                              Dynamic
                            </span>
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
                                      ? field.dynamicPlaceholder || ''
                                      : instance.config[field.name] || '',
                                  },
                                });
                              }}
                            />
                          </div>
                        )}
                      </div>

                      {isDynamic && isInDynamicMode && (
                        <div className='text-xs text-gray-500 mb-2'>
                          Use {'{{action.payload.field}}'} syntax to reference
                          action data.
                          {field.dynamicPlaceholder && (
                            <div className='mt-1 p-2 bg-gray-50 rounded text-xs font-mono'>
                              Example: {field.dynamicPlaceholder}
                            </div>
                          )}
                        </div>
                      )}

                      {isDynamic && isInDynamicMode ? (
                        <DynamicTextarea
                          name={field.name}
                          placeholder={
                            field.dynamicPlaceholder || field.placeholder
                          }
                          required={field.required}
                          value={
                            getStringValue(instance.config[field.name]) ||
                            getStringValue(field.default) ||
                            ''
                          }
                          onChange={(value) => {
                            updateReactionInstance(instance.id, {
                              config: {
                                ...instance.config,
                                [field.name]: value,
                              },
                            });
                          }}
                          payloadFields={selectedAction?.payloadFields || []}
                          rows={field.type === 'textarea' ? 3 : 1}
                        />
                      ) : (
                        <textarea
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
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 text-sm"
                          rows={field.type === 'textarea' ? 3 : 1}
                        />
                      )}
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
