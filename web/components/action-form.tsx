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

interface ActionFormProps {
  selectedAction: Action | null;
  onActionChange: (action: Action | null) => void;
  actionConfig: Record<string, unknown>;
  onConfigChange: (config: Record<string, unknown>) => void;
}

const getStringValue = (value: unknown): string => {
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return value.toString();
  return '';
};

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
            selectedAction.configSchema.fields.map(field => (
              <div key={field.name} className='mt-2'>
                <label className='block text-sm font-medium text-gray-700'>
                  {field.label}
                </label>
                <input
                  type={field.type}
                  name={field.name}
                  placeholder={field.placeholder}
                  required={field.required}
                  value={
                    getStringValue(actionConfig[field.name]) ||
                    getStringValue(field.default) ||
                    ''
                  }
                  onChange={e => {
                    onConfigChange({
                      ...actionConfig,
                      [field.name]: e.target.value,
                    });
                  }}
                  className='mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2'
                />
              </div>
            ))}
        </>
      )}
    </>
  );
}
