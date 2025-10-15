import crypto from 'crypto';
import { AppDataSource } from '../../../config/db';
import { ExternalWebhooks } from '../../../config/entity/ExternalWebhooks';

export class TwitchEventSubManager {
  private clientId: string;
  private clientSecret: string;
  private webhookBaseUrl: string;
  private twitchApiBaseUrl: string;
  private twitchAuthBaseUrl: string;

  constructor() {
    this.clientId = process.env.SERVICE_TWITCH_CLIENT_ID || '';
    this.clientSecret = process.env.SERVICE_TWITCH_CLIENT_SECRET || '';
    this.webhookBaseUrl = process.env.WEBHOOK_BASE_URL || '';
    this.twitchApiBaseUrl =
      process.env.SERVICE_TWITCH_API_BASE_URL || 'https://api.twitch.tv';
    this.twitchAuthBaseUrl =
      process.env.SERVICE_TWITCH_AUTH_BASE_URL || 'https://id.twitch.tv';
  }

  private async getAppAccessToken(): Promise<string> {
    try {
      const response = await fetch(`${this.twitchAuthBaseUrl}/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: this.clientId,
          client_secret: this.clientSecret,
          grant_type: 'client_credentials',
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return data.access_token;
    } catch (error) {
      console.error('Failed to get Twitch app access token:', error);
      throw new Error('Failed to authenticate with Twitch');
    }
  }

  async createSubscription(
    userId: number,
    broadcasterId: string,
    subscriptionType: string,
    moderatorId?: string
  ): Promise<{
    id: string;
    status: string;
    type: string;
    version: string;
    condition: Record<string, string>;
    transport: {
      method: string;
      callback: string;
      secret: string;
    };
    created_at: string;
    cost: number;
  }> {
    try {
      const appToken = await this.getAppAccessToken();
      const webhookUrl = `${this.webhookBaseUrl}/api/webhooks/twitch`;
      const secret = this.generateSecret();

      const subscriptionData: {
        type: string;
        version: string;
        condition: Record<string, string>;
        transport: {
          method: string;
          callback: string;
          secret: string;
        };
      } = {
        type: subscriptionType,
        version: subscriptionType === 'channel.follow' ? '2' : '1',
        condition: {
          broadcaster_user_id: broadcasterId,
        },
        transport: {
          method: 'webhook',
          callback: webhookUrl,
          secret: secret,
        },
      };

      const moderatorRequiredEvents = ['channel.follow', 'channel.subscribe'];

      if (moderatorRequiredEvents.includes(subscriptionType)) {
        if (!moderatorId) {
          throw new Error(
            `moderatorId is required for ${subscriptionType} subscription`
          );
        }
        subscriptionData.condition.moderator_user_id = moderatorId;
      }

      const response = await fetch(
        `${this.twitchApiBaseUrl}/eventsub/subscriptions`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${appToken}`,
            'Client-Id': this.clientId,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(subscriptionData),
        }
      );

      if (!response.ok) {
        if (response.status === 409) {
          const existingSubscriptions = await this.getSubscriptions();

          const existingSubscription = existingSubscriptions.find(
            (sub: Record<string, unknown>) => {
              const matches =
                sub.type === subscriptionType &&
                (sub.condition as Record<string, string>)
                  ?.broadcaster_user_id === broadcasterId;
              return matches;
            }
          );

          if (existingSubscription) {
            if (
              existingSubscription.status ===
                'webhook_callback_verification_failed' ||
              existingSubscription.status === 'enabled'
            ) {
              await this.deleteSubscription(existingSubscription.id as string);

              return await this.createSubscription(
                userId,
                broadcasterId,
                subscriptionType,
                moderatorId
              );
            }

            return {
              id: existingSubscription.id as string,
              status: existingSubscription.status as string,
              type: existingSubscription.type as string,
              version: existingSubscription.version as string,
              condition: existingSubscription.condition as Record<
                string,
                string
              >,
              created_at: existingSubscription.created_at as string,
              cost: existingSubscription.cost as number,
              transport: {
                method: 'webhook',
                callback: webhookUrl,
                secret: secret,
              },
            };
          }
        }

        const errorData = await response.json();
        throw new Error(
          `HTTP ${response.status}: ${JSON.stringify(errorData)}`
        );
      }

      const data = await response.json();
      const subscription = data.data?.[0];

      if (!subscription) {
        throw new Error('Invalid response from Twitch API');
      }

      return {
        ...subscription,
        transport: {
          method: 'webhook',
          callback: webhookUrl,
          secret: secret,
        },
      };
    } catch (error) {
      throw error;
    }
  }

  async createSubscriptionForAction(
    userId: number,
    actionType: string,
    broadcasterId: string,
    moderatorId?: string
  ): Promise<void> {
    let subscriptionType: string;

    switch (actionType) {
      case 'twitch.new_follower':
        subscriptionType = 'channel.follow';
        break;
      case 'twitch.new_subscription':
        subscriptionType = 'channel.subscribe';
        break;
      default:
        throw new Error(`Unknown action type: ${actionType}`);
    }

    await this.createSubscription(
      userId,
      broadcasterId,
      subscriptionType,
      moderatorId
    );
  }

  async createWebhook(
    userId: number,
    actionType: string,
    broadcasterId: string,
    moderatorId?: string
  ): Promise<ExternalWebhooks> {
    try {
      const subscription = await this.createSubscription(
        userId,
        broadcasterId,
        this.getSubscriptionType(actionType),
        moderatorId
      );

      const webhook = new ExternalWebhooks();
      webhook.user_id = userId;
      webhook.service = 'twitch';
      webhook.external_id = subscription.id;
      webhook.url = subscription.transport.callback;
      webhook.secret = subscription.transport.secret;
      webhook.events = [actionType];
      webhook.is_active = subscription.status === 'enabled';

      const savedWebhook =
        await AppDataSource.getRepository(ExternalWebhooks).save(webhook);

      return savedWebhook;
    } catch (error) {
      throw error;
    }
  }

  private getSubscriptionType(actionType: string): string {
    switch (actionType) {
      case 'twitch.new_follower':
        return 'channel.follow';
      case 'twitch.new_subscription':
        return 'channel.subscribe';
      default:
        throw new Error(`Unknown action type: ${actionType}`);
    }
  }

  async deleteSubscription(subscriptionId: string): Promise<void> {
    try {
      const appToken = await this.getAppAccessToken();

      const response = await fetch(
        `${this.twitchApiBaseUrl}/eventsub/subscriptions?id=${subscriptionId}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${appToken}`,
            'Client-Id': this.clientId,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.error(`Failed to delete subscription ${subscriptionId}:`, error);
      throw error;
    }
  }

  async getSubscriptions(): Promise<Record<string, unknown>[]> {
    try {
      const appToken = await this.getAppAccessToken();

      const response = await fetch(
        `${this.twitchApiBaseUrl}/eventsub/subscriptions`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${appToken}`,
            'Client-Id': this.clientId,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return data.data || [];
    } catch (error) {
      console.error('Failed to get subscriptions:', error);
      return [];
    }
  }

  async getUserId(username: string): Promise<string | null> {
    try {
      const appToken = await this.getAppAccessToken();

      const response = await fetch(
        `${this.twitchApiBaseUrl}/users?login=${encodeURIComponent(username)}`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${appToken}`,
            'Client-Id': this.clientId,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      const user = data.data?.[0];

      if (!user) {
        console.error(`User ${username} not found on Twitch`);
        return null;
      }

      return user.id;
    } catch (error) {
      console.error(`Failed to get user ID for ${username}:`, error);
      return null;
    }
  }

  async getUserInfo(userId: string): Promise<Record<string, unknown> | null> {
    try {
      const appToken = await this.getAppAccessToken();

      const response = await fetch(
        `${this.twitchApiBaseUrl}/users?id=${userId}`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${appToken}`,
            'Client-Id': this.clientId,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return data.data?.[0] || null;
    } catch (error) {
      console.error(`Failed to get user info for ID ${userId}:`, error);
      return null;
    }
  }

  private generateSecret(): string {
    return crypto.randomBytes(32).toString('hex');
  }
}

export const twitchEventSubManager = new TwitchEventSubManager();
