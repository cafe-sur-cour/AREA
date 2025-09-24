import type { ActionDefinition } from '../../../types/service';
import { everyDayAtXHourSchema, everyHourAtIntervalsSchema } from './schemas';

export const timerActions: ActionDefinition[] = [
  {
    id: 'every_day_at_x_hour',
    name: 'Every Day at X Hour',
    description: 'Triggers once a day at a specific hour on selected days',
    configSchema: everyDayAtXHourSchema,
    inputSchema: {
      type: 'object',
      properties: {
        timestamp: {
          type: 'string',
          description: 'ISO timestamp of when the timer triggered',
        },
        hour: {
          type: 'number',
          description: 'The hour that triggered',
        },
        day: {
          type: 'string',
          description: 'The day of the week',
        },
      },
    },
    metadata: {
      category: 'Timer',
      tags: ['schedule', 'daily'],
      requiresAuth: false,
    },
  },
  {
    id: 'every_hour_at_intervals',
    name: 'Every Hour at X Minute',
    description: 'Triggers every hour at a specific minute (00, 15, 30, or 45)',
    configSchema: everyHourAtIntervalsSchema,
    inputSchema: {
      type: 'object',
      properties: {
        timestamp: {
          type: 'string',
          description: 'ISO timestamp of when the timer triggered',
        },
        minute: {
          type: 'number',
          description: 'The minute that triggered (0, 15, 30, or 45)',
        },
      },
    },
    metadata: {
      category: 'Timer',
      tags: ['schedule', 'interval'],
      requiresAuth: false,
    },
  },
];
