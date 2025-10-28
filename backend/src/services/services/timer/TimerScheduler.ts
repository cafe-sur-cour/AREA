import * as cron from 'node-cron';
import { AppDataSource } from '../../../config/db';
import { WebhookConfigs } from '../../../config/entity/WebhookConfigs';
import { WebhookEvents } from '../../../config/entity/WebhookEvents';
import { Raw } from 'typeorm';

export class TimerScheduler {
  private cronJobs: Map<string, cron.ScheduledTask> = new Map();
  private isRunning = false;

  async start(): Promise<void> {
    if (this.isRunning) {
      console.log('Timer scheduler is already running');
      return;
    }

    console.log('Starting Timer scheduler...');
    this.isRunning = true;

    const checkJob = cron.schedule('* * * * *', async () => {
      await this.checkAndTriggerTimers();
    });

    this.cronJobs.set('timer-check', checkJob);

    console.log('Timer scheduler started successfully');
  }

  async stop(): Promise<void> {
    if (!this.isRunning) {
      console.log('Timer scheduler is not running');
      return;
    }

    console.log('Stopping Timer scheduler...');
    this.isRunning = false;

    for (const job of this.cronJobs.values()) {
      job.destroy();
    }
    this.cronJobs.clear();

    console.log('Timer scheduler stopped');
  }

  private async checkAndTriggerTimers(): Promise<void> {
    try {
      const timezones = await this.getActiveTimerTimezones();

      for (const timezoneOffset of timezones) {
        await this.checkTimersForTimezone(timezoneOffset);
      }
    } catch (error) {
      console.error('Error checking timer events:', error);
    }
  }

  private async getActiveTimerTimezones(): Promise<number[]> {
    const mappingRepository = AppDataSource.getRepository(WebhookConfigs);

    const dailyMappings = await mappingRepository.find({
      where: {
        is_active: true,
        action: Raw(alias => `${alias} ->> 'type' = :type`, {
          type: 'timer.every_day_at_x_hour',
        }),
      },
    });

    const intervalMappings = await mappingRepository.find({
      where: {
        is_active: true,
        action: Raw(alias => `${alias} ->> 'type' = :type`, {
          type: 'timer.every_hour_at_intervals',
        }),
      },
    });

    const timezones = new Set<number>();

    for (const mapping of [...dailyMappings, ...intervalMappings]) {
      try {
        const config = mapping.action.config as { timezone?: number };
        if (config.timezone !== undefined) {
          timezones.add(config.timezone);
        } else {
          timezones.add(0);
        }
      } catch (error) {
        console.error(`Error parsing config for mapping ${mapping.id}:`, error);
      }
    }

    return Array.from(timezones);
  }

  private async checkTimersForTimezone(timezoneOffset: number): Promise<void> {
    const now = new Date();
    const adjustedTime = new Date(
      now.getTime() + timezoneOffset * 60 * 60 * 1000
    );

    const formatter = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'UTC',
      hour: 'numeric',
      minute: 'numeric',
      weekday: 'long',
    });

    const timeParts = formatter.formatToParts(adjustedTime);
    const currentHour = parseInt(timeParts.find(p => p.type === 'hour')!.value);
    const currentMinute = parseInt(
      timeParts.find(p => p.type === 'minute')!.value
    );
    const dayName = timeParts
      .find(p => p.type === 'weekday')!
      .value.toLowerCase();

    const dayNames = [
      'sunday',
      'monday',
      'tuesday',
      'wednesday',
      'thursday',
      'friday',
      'saturday',
    ];
    const currentDay = dayNames.indexOf(dayName);

    await this.checkEveryHourAtIntervalsTimers(currentMinute, timezoneOffset);
    await this.checkEveryDayAtXHourTimers(
      currentHour,
      currentMinute,
      currentDay,
      timezoneOffset
    );
  }

  private getTimezoneOffset(timezone: string): number {
    const match = timezone.match(/UTC([+-])(\d+)/);
    if (!match || !match[2]) return 0;
    const sign = match[1] === '+' ? 1 : -1;
    const hours = parseInt(match[2]);
    return sign * hours;
  }

  private async checkEveryHourAtIntervalsTimers(
    currentMinute: number,
    timezoneOffset: number
  ): Promise<void> {
    const mappingRepository = AppDataSource.getRepository(WebhookConfigs);

    const mappings = await mappingRepository.find({
      where: {
        is_active: true,
        action: Raw(alias => `${alias} ->> 'type' = :type`, {
          type: 'timer.every_hour_at_intervals',
        }),
      },
    });

    for (const mapping of mappings) {
      try {
        const config = mapping.action.config as {
          minute: number;
          timezone?: number;
        };

        const configTimezone = config.timezone ?? 0;
        if (configTimezone !== timezoneOffset) continue;

        if (config.minute !== undefined && currentMinute === config.minute) {
          console.log(`Triggering timer for mapping ${mapping.id}`);
          await this.triggerTimerEvent(mapping, {
            timestamp: new Date().toISOString(),
            minute: currentMinute,
          });
        }
      } catch (error) {
        console.error(`Error processing timer mapping ${mapping.id}:`, error);
      }
    }
  }

  private async checkEveryDayAtXHourTimers(
    currentHour: number,
    currentMinute: number,
    currentDay: number,
    timezoneOffset: number
  ): Promise<void> {
    const mappingRepository = AppDataSource.getRepository(WebhookConfigs);

    const mappings = await mappingRepository.find({
      where: {
        is_active: true,
        action: Raw(alias => `${alias} ->> 'type' = :type`, {
          type: 'timer.every_day_at_x_hour',
        }),
      },
    });

    console.log(
      `[TimerScheduler] Found ${mappings.length} daily timer mappings for timezone ${timezoneOffset}`
    );

    const dayNames = [
      'sunday',
      'monday',
      'tuesday',
      'wednesday',
      'thursday',
      'friday',
      'saturday',
    ];

    for (const mapping of mappings) {
      try {
        const config = mapping.action.config as {
          hour: number;
          minute?: number;
          days: string[];
          timezone?: number;
        };

        const configTimezone = config.timezone ?? 0;
        console.log(
          `[TimerScheduler] Mapping ${mapping.id}: config timezone ${configTimezone}, current timezone ${timezoneOffset}, hour ${config.hour}:${config.minute ?? 0}, days ${config.days}, current ${currentHour}:${currentMinute} ${dayNames[currentDay]}`
        );
        if (configTimezone !== timezoneOffset) {
          console.log(
            `[TimerScheduler] Skipping mapping ${mapping.id}: timezone mismatch`
          );
          continue;
        }

        if (
          config.hour === currentHour &&
          (config.minute ?? 0) === currentMinute &&
          config.days &&
          config.days.includes(dayNames[currentDay]!)
        ) {
          console.log(
            `✅ [TimerScheduler] Triggering timer for mapping ${mapping.id}`
          );
          await this.triggerTimerEvent(mapping, {
            timestamp: new Date().toISOString(),
            hour: config.hour,
            minute: config.minute ?? 0,
            day: dayNames[currentDay]!,
          });
        } else {
          console.log(
            `[TimerScheduler] Mapping ${mapping.id} does not match: hour ${config.hour}==${currentHour}, minute ${config.minute ?? 0}==${currentMinute}, day ${dayNames[currentDay]} in ${config.days}`
          );
        }
      } catch (error) {
        console.error(`Error processing timer mapping ${mapping.id}:`, error);
      }
    }
  }

  private async triggerTimerEvent(
    mapping: WebhookConfigs,
    payload: Record<string, unknown>
  ): Promise<void> {
    const eventRepository = AppDataSource.getRepository(WebhookEvents);

    const event = eventRepository.create({
      action_type: mapping.action.type,
      user_id: mapping.created_by || 0,
      payload: payload,
      source: 'timer',
      status: 'received',
      mapping_id: mapping.id,
    });

    await eventRepository.save(event);

    console.log(
      `Timer event triggered for mapping ${mapping.id}: ${mapping.action.type}`
    );
  }
}
