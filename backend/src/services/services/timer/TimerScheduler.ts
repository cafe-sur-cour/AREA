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
      const now = new Date();
      const currentMinute = now.getMinutes();
      const currentHour = now.getHours();
      const currentDay = now.getDay();

      console.log(
        `⏰ [TimerScheduler] Checking timers at ${now.toISOString()} (Hour: ${currentHour}, Minute: ${currentMinute}, Day: ${currentDay})`
      );

      await this.checkEveryHourAtIntervalsTimers(currentMinute);
      await this.checkEveryDayAtXHourTimers(
        currentHour,
        currentMinute,
        currentDay
      );
    } catch (error) {
      console.error('Error checking timer events:', error);
    }
  }

  private async checkEveryHourAtIntervalsTimers(
    currentMinute: number
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
        const config = mapping.action.config as { minute: number };

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
    currentDay: number
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
      `📅 [TimerScheduler] Found ${mappings.length} every_day_at_x_hour mappings`
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
        };

        console.log(
          `🔍 [TimerScheduler] Checking mapping ${mapping.id}: hour=${config.hour}, minute=${config.minute ?? 0}, days=${config.days?.join(',')}, current=${currentHour}:${currentMinute} (${dayNames[currentDay]})`
        );

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
