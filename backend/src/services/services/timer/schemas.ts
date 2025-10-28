import type { ActionReactionSchema } from '../../../types/mapping';

export const everyDayAtXHourSchema: ActionReactionSchema = {
  name: 'Every Day at X Hour',
  description:
    'Triggers once a day at a specific hour and minute on selected days',
  fields: [
    {
      name: 'hour',
      type: 'number',
      label: 'Hour (0-23)',
      required: true,
      placeholder: '14',
      default: 14,
    },
    {
      name: 'minute',
      type: 'number',
      label: 'Minute (0-59)',
      required: true,
      placeholder: '30',
      default: 0,
    },
    {
      name: 'timezone',
      type: 'number',
      label: 'Timezone offset (hours from UTC)',
      required: true,
      placeholder: '1',
      default: 1,
    },
    {
      name: 'days',
      type: 'checkbox',
      label: 'Days of the week',
      required: true,
      options: [
        { value: 'monday', label: 'Monday' },
        { value: 'tuesday', label: 'Tuesday' },
        { value: 'wednesday', label: 'Wednesday' },
        { value: 'thursday', label: 'Thursday' },
        { value: 'friday', label: 'Friday' },
        { value: 'saturday', label: 'Saturday' },
        { value: 'sunday', label: 'Sunday' },
      ],
    },
  ],
};

export const everyHourAtIntervalsSchema: ActionReactionSchema = {
  name: 'Every Hour at X Minute',
  description: 'Triggers every hour at a specific minute',
  fields: [
    {
      name: 'minute',
      type: 'number',
      label: 'Minute (0-59)',
      required: true,
      placeholder: '30',
      default: 0,
    },
    {
      name: 'timezone',
      type: 'number',
      label: 'Timezone offset (hours from UTC)',
      required: true,
      placeholder: '1',
      default: 1,
    },
  ],
};
