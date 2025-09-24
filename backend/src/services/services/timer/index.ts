import type { Service } from '../../../types/service';
import type { ActionReactionSchema } from '../../../types/mapping';
import { TimerScheduler } from './TimerScheduler';

const everyDayAtXHourSchema: ActionReactionSchema = {
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

const everyHourAtIntervalsSchema: ActionReactionSchema = {
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

const timerService: Service = {
  id: 'timer',
  name: 'Timer',
  description: 'Internal timer service for scheduled actions',
  version: '1.0.0',
  actions: [
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
  ],
  reactions: [], /* No reactions provided by the Timer service */
};

export default timerService;

let scheduler: TimerScheduler | null = null;

export async function initialize(): Promise<void> {
  console.log('Initializing Timer service...');
  scheduler = new TimerScheduler();
  await scheduler.start();
  console.log('Timer service initialized');
}

export async function cleanup(): Promise<void> {
  console.log('Cleaning up Timer service...');
  if (scheduler) {
    await scheduler.stop();
    scheduler = null;
  }
  console.log('Timer service cleaned up');
}
