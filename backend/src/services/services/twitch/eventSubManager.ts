import crypto from 'crypto';

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
    subscriptionType: string
  ): Promise<Record<string, unknown>> {
    try {
      const appToken = await this.getAppAccessToken();
      const webhookUrl = `${this.webhookBaseUrl}/webhooks/twitch`;

      const subscriptionData = {
        type: subscriptionType,
        version: '1',
        condition: {
          broadcaster_user_id: broadcasterId,
        },
        transport: {
          method: 'webhook',
          callback: webhookUrl,
          secret: this.generateSecret(),
        },
      };

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
        const errorData = await response.json();
        throw new Error(
          `HTTP ${response.status}: ${JSON.stringify(errorData)}`
        );
      }

      const data = await response.json();
      console.log(
        `✅ Created ${subscriptionType} subscription for user ${userId}`
      );
      return data;
    } catch (error) {
      console.error(
        `Failed to create ${subscriptionType} subscription:`,
        error
      );
      throw error;
    }
  }

  async createAllSubscriptions(
    userId: number,
    broadcasterId: string
  ): Promise<void> {
    const subscriptionTypes = [
      'channel.follow',
      'channel.subscribe',
      'channel.subscription.message',
      'stream.online',
      'stream.offline',
    ];

    for (const type of subscriptionTypes) {
      try {
        await this.createSubscription(userId, broadcasterId, type);
      } catch (error) {
        console.error(
          `Failed to create ${type} subscription for user ${userId}:`,
          error
        );
      }
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

      console.log(`✅ Deleted subscription ${subscriptionId}`);
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

      console.log(`✅ Found user ${username} with ID ${user.id}`);
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
