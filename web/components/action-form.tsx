'use client';
import api from '@/lib/api';
import { Action, ServiceAction } from '@/types/action';
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
import { Input } from '@/components/ui/input';

interface ActionFormProps {
  selectedAction: Action | null;
  onActionChange: (action: Action | null) => void;
  actionConfig: Record<string, unknown>;
  onConfigChange: (config: Record<string, unknown>) => void;
}

export default function ActionForm({
  selectedAction,
  onActionChange,
  actionConfig,
  onConfigChange,
}: ActionFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [actions, setActions] = useState<ServiceAction[]>([]);
  const [selectedServiceAction, setSelectedServiceAction] = useState<
    string | null
  >(null);
  const [listAction, setListAction] = useState<Action[]>([]);
  const [isFirstTime, setIsFirstTime] = useState<boolean>(false);

  useEffect(() => {
    const fetchAction = async () => {
      try {
        setIsLoading(true);
        const res = (
          await api.get<{ services: ServiceAction[] }>({
            endpoint: '/services/actions',
          })
        ).data;
        if (!res?.services || res.services.length === 0) {
          console.log('No service actions found');
          return;
        }
        setActions(res.services);
        if (selectedAction && !isFirstTime) {
          setIsFirstTime(true);
          setSelectedServiceAction(selectedAction.serviceId);
          setListAction(
            res.services.find(action => action.id === selectedAction.serviceId)
              ?.actions || []
          );
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchAction();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {}, [selectedAction]);

  if (isLoading) return null;
  return (
    <>
      <Select
        value={selectedServiceAction || ''}
        onValueChange={value => {
          setSelectedServiceAction(value);
          setListAction(
            actions.find(action => action.id === value)?.actions || []
          );
          onActionChange(null);
        }}
      >
        <SelectTrigger className='w-[180px]'>
          <SelectValue placeholder='Select a service' />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel>Services</SelectLabel>
            {actions.map(action => (
              <SelectItem key={action.id} value={action.id}>
                {action.name}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
      {selectedServiceAction && (
        <>
          <Select
            value={selectedAction?.id || ''}
            onValueChange={value => {
              onActionChange(
                listAction.find(action => action.id === value) || null
              );
            }}
          >
            <SelectTrigger className='w-[180px]'>
              <SelectValue placeholder='Select an action' />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>Services</SelectLabel>
                {listAction.map(action => (
                  <SelectItem key={action.id} value={action.id}>
                    {action.name}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>

          {selectedAction &&
            selectedAction.configSchema &&
            selectedAction.configSchema.fields.map(field => {
              const currentValue = actionConfig[field.name];
              const defaultValue = field.default;

              const getFieldValue = () => {
                if (currentValue !== undefined) return currentValue;
                if (defaultValue !== undefined) return defaultValue;
                return field.type === 'checkbox' ? [] : '';
              };

              const fieldValue = getFieldValue();

              const handleValueChange = (value: unknown) => {
                onConfigChange({
                  ...actionConfig,
                  [field.name]: value,
                });
              };

              return (
                <div key={field.name} className='mt-2'>
                  <label className='block text-sm font-medium text-gray-700'>
                    {field.label}
                  </label>

                  {field.type === 'select' && field.options ? (
                    <Select
                      value={String(fieldValue || '')}
                      onValueChange={value => handleValueChange(value)}
                    >
                      <SelectTrigger className='w-full mt-1'>
                        <SelectValue
                          placeholder={field.placeholder || 'Select an option'}
                        />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          {field.options.map(option => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  ) : field.type === 'checkbox' && field.options ? (
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
                                const currentArray = Array.isArray(fieldValue)
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
                  ) : field.type === 'textarea' ? (
                    <textarea
                      name={field.name}
                      placeholder={field.placeholder}
                      required={field.required}
                      value={String(fieldValue || '')}
                      onChange={e => handleValueChange(e.target.value)}
                      className='mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2'
                      rows={3}
                    />
                  ) : (
                    <Input
                      type={field.type === 'number' ? 'number' : field.type}
                      name={field.name}
                      placeholder={field.placeholder}
                      required={field.required}
                      value={String(fieldValue || '')}
                      onChange={e => {
                        const value =
                          field.type === 'number'
                            ? e.target.value
                              ? Number(e.target.value)
                              : ''
                            : e.target.value;
                        handleValueChange(value);
                      }}
                      className='mt-1'
                    />
                  )}
                </div>
              );
            })}
        </>
      )}
    </>
  );
}
