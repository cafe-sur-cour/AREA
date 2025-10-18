'use client';
import api from '@/lib/api';
import { Reaction, ServiceReaction } from '@/types/reaction';
import { Action, PayloadField } from '@/types/action';
import { DynamicTextareaProps } from '@/types/form';
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
import { Input } from '@/components/ui/input';
import { Plus, Trash2 } from 'lucide-react';

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
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    const newCursorPosition = e.target.selectionStart || 0;

    onChange(newValue);

    const textBeforeCursor = newValue.substring(0, newCursorPosition);
    const lastOpenBrace = textBeforeCursor.lastIndexOf('{');

    if (lastOpenBrace !== -1 && lastOpenBrace === newCursorPosition - 1) {
      setSuggestions(payloadFields);
      setShowSuggestions(true);
      setSelectedIndex(-1);
    } else {
      setShowSuggestions(false);
      setSelectedIndex(-1);
    }
  };

  const insertSuggestion = (field: PayloadField) => {
    const currentCursorPos = textareaRef.current?.selectionStart || 0;
    const textBeforeCursor = value.substring(0, currentCursorPos);
    const lastOpenBrace = textBeforeCursor.lastIndexOf('{');

    if (lastOpenBrace !== -1 && lastOpenBrace === currentCursorPos - 1) {
      const beforeBrace = value.substring(0, lastOpenBrace);
      const afterBrace = value.substring(currentCursorPos);
      const template = `{{action.payload.${field.path}}}`;
      const newValue = `${beforeBrace}${template}${afterBrace}`;

      onChange(newValue);
      setShowSuggestions(false);

      setTimeout(() => {
        if (textareaRef.current) {
          const newCursorPos = beforeBrace.length + template.length;
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
        setSelectedIndex(prev => {
          const newIndex = prev < suggestions.length - 1 ? prev + 1 : 0;
          setTimeout(() => {
            if (suggestionsRef.current) {
              const selectedElement = suggestionsRef.current.children[
                newIndex
              ] as HTMLElement;
              if (selectedElement) {
                selectedElement.scrollIntoView({
                  behavior: 'smooth',
                  block: 'nearest',
                });
              }
            }
          }, 0);
          return newIndex;
        });
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => {
          const newIndex = prev > 0 ? prev - 1 : suggestions.length - 1;
          setTimeout(() => {
            if (suggestionsRef.current) {
              const selectedElement = suggestionsRef.current.children[
                newIndex
              ] as HTMLElement;
              if (selectedElement) {
                selectedElement.scrollIntoView({
                  behavior: 'smooth',
                  block: 'nearest',
                });
              }
            }
          }, 0);
          return newIndex;
        });
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
    <div className='relative'>
      <textarea
        ref={textareaRef}
        name={name}
        placeholder={placeholder}
        required={required}
        value={value}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        className='mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 text-sm font-mono bg-blue-50'
        rows={rows}
      />

      {showSuggestions && suggestions.length > 0 && (
        <div
          ref={suggestionsRef}
          className='absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-40 overflow-y-auto'
        >
          {suggestions.map((field, index) => (
            <div
              key={field.path}
              className={`px-3 py-2 cursor-pointer text-sm border-b border-gray-100 last:border-b-0 ${
                index === selectedIndex ? 'bg-blue-100' : 'hover:bg-gray-100'
              }`}
              onClick={() => insertSuggestion(field)}
            >
              <div className='font-mono text-blue-600 text-xs break-all'>
                {'{' + '{action.payload.' + field.path + '}'}
              </div>
              <div className='text-gray-500 text-xs mt-1 break-words'>
                {field.description}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

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
  selectedAction?: Action | null;
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
  selectedAction,
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
      selectedService: defaultReaction?.serviceId || null,
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
                {instance.reaction.configSchema.fields.map(field => {
                  const isDynamic = field.dynamic;

                  return (
                    <div key={field.name} className='space-y-2'>
                      <label className='block text-sm font-medium text-gray-700'>
                        {field.label}
                      </label>

                      {isDynamic ? (
                        <div className='space-y-2'>
                          <div className='bg-blue-50 border border-blue-200 rounded-md p-2'>
                            <div className='flex items-center'>
                              <div className='text-xs text-blue-700'>
                                Type{' '}
                                <span className='font-mono bg-blue-100 px-1 rounded'>
                                  {'{'}
                                </span>{' '}
                                to see action data suggestions
                              </div>
                            </div>
                          </div>
                          <DynamicTextarea
                            name={field.name}
                            placeholder={field.placeholder || ''}
                            required={field.required}
                            value={
                              getStringValue(instance.config[field.name]) ||
                              getStringValue(field.default) ||
                              ''
                            }
                            onChange={value => {
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
                        </div>
                      ) : (
                        (() => {
                          const currentValue = instance.config[field.name];
                          const defaultValue = field.default;

                          const getFieldValue = () => {
                            if (currentValue !== undefined) return currentValue;
                            if (defaultValue !== undefined) return defaultValue;
                            return field.type === 'checkbox' ? [] : '';
                          };

                          const fieldValue = getFieldValue();

                          const handleValueChange = (value: unknown) => {
                            updateReactionInstance(instance.id, {
                              config: {
                                ...instance.config,
                                [field.name]: value,
                              },
                            });
                          };

                          if (field.type === 'select' && field.options) {
                            return (
                              <Select
                                value={String(fieldValue || '')}
                                onValueChange={value =>
                                  handleValueChange(value)
                                }
                              >
                                <SelectTrigger className='w-full mt-1'>
                                  <SelectValue
                                    placeholder={
                                      field.placeholder || 'Select an option'
                                    }
                                  />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectGroup>
                                    {field.options.map(option => (
                                      <SelectItem
                                        key={option.value}
                                        value={option.value}
                                      >
                                        {option.label}
                                      </SelectItem>
                                    ))}
                                  </SelectGroup>
                                </SelectContent>
                              </Select>
                            );
                          } else if (
                            field.type === 'checkbox' &&
                            field.options
                          ) {
                            return (
                              <div className='mt-1 space-y-2'>
                                {field.options.map(option => {
                                  const isChecked = Array.isArray(fieldValue)
                                    ? fieldValue.includes(option.value)
                                    : false;
                                  return (
                                    <label
                                      key={option.value}
                                      className='flex items-center space-x-2'
                                    >
                                      <input
                                        type='checkbox'
                                        checked={isChecked}
                                        onChange={e => {
                                          const currentArray = Array.isArray(
                                            fieldValue
                                          )
                                            ? fieldValue
                                            : [];
                                          const newArray = e.target.checked
                                            ? [...currentArray, option.value]
                                            : currentArray.filter(
                                                v => v !== option.value
                                              );
                                          handleValueChange(newArray);
                                        }}
                                        className='rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer'
                                      />
                                      <span className='text-sm text-gray-700'>
                                        {option.label}
                                      </span>
                                    </label>
                                  );
                                })}
                              </div>
                            );
                          } else if (field.type === 'textarea') {
                            return (
                              <textarea
                                name={field.name}
                                placeholder={field.placeholder}
                                required={field.required}
                                value={String(fieldValue || '')}
                                onChange={e =>
                                  handleValueChange(e.target.value)
                                }
                                className='mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 text-sm'
                                rows={3}
                              />
                            );
                          } else {
                            const inputProps: Record<string, unknown> = {
                              type: field.type === 'number' ? 'number' : 'text',
                              name: field.name,
                              placeholder: field.placeholder,
                              required: field.required,
                              value: String(fieldValue || ''),
                              className: 'mt-1',
                            };

                            if (field.type === 'number' && field.validator) {
                              if (field.validator.min !== undefined) {
                                inputProps.min = field.validator.min;
                              }
                              if (field.validator.max !== undefined) {
                                inputProps.max = field.validator.max;
                              }
                            }

                            const hasValidator =
                              field.type === 'number' && field.validator;
                            const minMax = hasValidator
                              ? (() => {
                                  const parts: string[] = [];
                                  if (field.validator?.min !== undefined) {
                                    parts.push(`min: ${field.validator.min}`);
                                  }
                                  if (field.validator?.max !== undefined) {
                                    parts.push(`max: ${field.validator.max}`);
                                  }
                                  return parts.join(', ');
                                })()
                              : null;

                            return (
                              <div>
                                <Input
                                  {...inputProps}
                                  onChange={e => {
                                    const value =
                                      field.type === 'number'
                                        ? e.target.value
                                          ? Number(e.target.value)
                                          : ''
                                        : e.target.value;
                                    handleValueChange(value);
                                  }}
                                />
                                {minMax && (
                                  <p className='text-xs text-gray-500 mt-1'>
                                    {minMax}
                                  </p>
                                )}
                              </div>
                            );
                          }
                        })()
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
