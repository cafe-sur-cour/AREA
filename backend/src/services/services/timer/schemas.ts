import type { ActionReactionSchema } from '../../../types/mapping';

export const everyDayAtXHourSchema: ActionReactionSchema = {
  name: 'Every Day at X Hour',
  description: 'Triggers once a day at a specific hour on selected days',
  fields: [
    {
      name: 'hour',
      type: 'number',
      label: 'Hour (0-23)',
      required: true,
      placeholder: '14',
      default: 14,
      validator: {
        min: 0,
        max: 23,
      },
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
  description: 'Triggers every hour at a specific minute (00, 15, 30, or 45)',
  fields: [
    {
      name: 'minute',
      type: 'select',
      label: 'Minute',
      required: true,
      options: [
        { value: '0', label: ':00' },
        { value: '15', label: ':15' },
        { value: '30', label: ':30' },
        { value: '45', label: ':45' },
      ],
    },
  ],
};
