import fetch from 'node-fetch';
import { AppDataSource } from '../../../config/db';
import { WebhookConfigs } from '../../../config/entity/WebhookConfigs';
import { WebhookEvents } from '../../../config/entity/WebhookEvents';
import { UserServiceSubscriptions } from '../../../config/entity/UserServiceSubscriptions';
import { microsoftOAuth } from './oauth';
import { Raw } from 'typeorm';

interface MicrosoftPhotoMetadata {
  '@odata.mediaContentType': string;
  '@odata.mediaEtag': string;
  id: string;
  height: number;
  width: number;
}

export class MicrosoftProfilePictureScheduler {
  private intervalId: NodeJS.Timeout | null = null;
  private isRunning = false;
  private readonly pollingInterval = 5000;

  async start(): Promise<void> {
    if (this.isRunning) {
      console.log('Microsoft Profile Picture Scheduler is already running');
      return;
    }

    console.log('Starting Microsoft Profile Picture Scheduler...');
    this.isRunning = true;

    this.checkProfilePictureChanges();
    this.intervalId = setInterval(() => {
      this.checkProfilePictureChanges();
    }, this.pollingInterval);

    console.log('Microsoft Profile Picture Scheduler started successfully');
  }

  async stop(): Promise<void> {
    if (!this.isRunning) {
      console.log('Microsoft Profile Picture Scheduler is not running');
      return;
    }

    console.log('Stopping Microsoft Profile Picture Scheduler...');
    this.isRunning = false;

    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    console.log('Microsoft Profile Picture Scheduler stopped');
  }

  private async checkProfilePictureChanges(): Promise<void> {
    try {
      const mappingRepository = AppDataSource.getRepository(WebhookConfigs);

      const mappings = await mappingRepository.find({
        where: {
          is_active: true,
          action: Raw(alias => `${alias} ->> 'type' = :type`, {
            type: 'microsoft.profile_picture_changed',
          }),
        },
      });

      const userMappings = new Map<number, typeof mappings>();

      for (const mapping of mappings) {
        const userId = mapping.created_by || 0;
        if (!userMappings.has(userId)) {
          userMappings.set(userId, []);
        }
        userMappings.get(userId)!.push(mapping);
      }

      for (const [userId, userMappingsList] of userMappings) {
        try {
          await this.checkUserProfilePicture(userId, userMappingsList);
        } catch (error) {
          console.error(
            `Error checking profile picture for user ${userId}:`,
            error
          );
        }
      }
    } catch (error) {
      console.error('Error in checkProfilePictureChanges:', error);
    }
  }

  private async checkUserProfilePicture(
    userId: number,
    mappings: WebhookConfigs[]
  ): Promise<void> {
    const token = await microsoftOAuth.getUserToken(userId);
    if (!token) {
      console.log(`No valid Microsoft token for user ${userId}`);
      return;
    }

    try {
      const photoMetadata = await this.getProfilePictureMetadata(
        token.token_value
      );

      if (!photoMetadata) {
        console.log(`No profile picture found for user ${userId}`);
        return;
      }

      const subscriptionRepository = AppDataSource.getRepository(
        UserServiceSubscriptions
      );
      let subscription = await subscriptionRepository.findOne({
        where: {
          user_id: userId,
          service: 'microsoft',
        },
      });

      if (!subscription) {
        subscription = subscriptionRepository.create({
          user_id: userId,
          service: 'microsoft',
          subscribed: true,
          subscribed_at: new Date(),
          state_data: {},
        });
        await subscriptionRepository.save(subscription);
      }

      const stateData = subscription.state_data as {
        profilePictureEtag?: string;
        lastCheck?: string;
      };

      const currentEtag = photoMetadata['@odata.mediaEtag'];
      const storedEtag = stateData.profilePictureEtag;

      if (!storedEtag) {
        subscription.state_data = {
          ...stateData,
          profilePictureEtag: currentEtag,
          lastCheck: new Date().toISOString(),
        };
        await subscriptionRepository.save(subscription);
        return;
      }

      if (storedEtag === currentEtag) {
        return;
      }

      const photoUrls = await this.getProfilePictureUrls(token.token_value);

      for (const mapping of mappings) {
        await this.triggerProfilePictureChangeEvent(mapping, {
          timestamp: new Date().toISOString(),
          old_photo_url: stateData.profilePictureEtag
            ? photoUrls?.original
            : null,
          new_photo_url: photoUrls?.original || null,
          user_id: userId.toString(),
          user_email: '',
        });
      }

      subscription.state_data = {
        ...stateData,
        profilePictureEtag: currentEtag,
        lastCheck: new Date().toISOString(),
      };
      await subscriptionRepository.save(subscription);

      console.log(`✅ Profile picture change detected for user ${userId}`);
    } catch (error) {
      console.error(
        `Error checking profile picture for user ${userId}:`,
        error
      );
    }
  }

  private async getProfilePictureMetadata(
    accessToken: string
  ): Promise<MicrosoftPhotoMetadata | null> {
    try {
      const response = await fetch(
        'https://graph.microsoft.com/v1.0/me/photo',
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            Accept: 'application/json',
          },
        }
      );

      if (response.status === 404) {
        return null;
      }

      if (!response.ok) {
        throw new Error(`Failed to get photo metadata: ${response.statusText}`);
      }

      return (await response.json()) as MicrosoftPhotoMetadata;
    } catch (error) {
      console.error('Error getting profile picture metadata:', error);
      return null;
    }
  }

  private async getProfilePictureUrls(
    accessToken: string
  ): Promise<{ original: string; thumbnail: string } | null> {
    try {
      const response = await fetch(
        'https://graph.microsoft.com/v1.0/me/photo/$value',
        {
          method: 'HEAD',
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
          redirect: 'manual',
        }
      );

      if (response.status === 302 || response.status === 301) {
        const location = response.headers.get('location');
        if (location) {
          return {
            original: location,
            thumbnail: location,
          };
        }
      }

      return null;
    } catch (error) {
      console.error('Error getting profile picture URLs:', error);
      return null;
    }
  }

  private async triggerProfilePictureChangeEvent(
    mapping: WebhookConfigs,
    payload: Record<string, unknown>
  ): Promise<void> {
    const eventRepository = AppDataSource.getRepository(WebhookEvents);

    const event = eventRepository.create({
      action_type: mapping.action.type,
      user_id: mapping.created_by || 0,
      payload: payload,
      source: 'microsoft',
      status: 'received',
      mapping_id: mapping.id,
    });

    await eventRepository.save(event);

    console.log(
      `Profile picture change event triggered for mapping ${mapping.id}`
    );
  }
}
