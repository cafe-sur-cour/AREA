import crypto from 'crypto';
import { AppDataSource } from '../../../../config/db';
import { ExternalWebhooks } from '../../../../config/entity/ExternalWebhooks';
import { googleOAuth } from '../oauth';

interface GoogleWatchResponse {
  kind: string;
  id: string;
  resourceId: string;
  resourceUri: string;
  expiration: string;
}

export class GoogleWebhookManager {
  private apiBaseUrl: string;

  constructor() {
    this.apiBaseUrl =
      process.env.SERVICE_GOOGLE_API_BASE_URL || 'https://www.googleapis.com';
  }

  private isWatchExpired(expirationTimestamp: string): boolean {
    const expirationDate = new Date(parseInt(expirationTimestamp));
    const now = new Date();
    const hoursRemaining = (expirationDate.getTime() - now.getTime()) / (1000 * 60 * 60);
    return hoursRemaining < 24;
  }

  async renewWatchIfNeeded(webhook: ExternalWebhooks): Promise<boolean> {
    if (!webhook.secret) {
      console.warn(`⚠️  [Google] No secret data found for webhook ${webhook.id}`);
      return false;
    }

    try {
      const secretData = JSON.parse(webhook.secret);
      const { channelId, resourceId, expiration } = secretData;

      if (!expiration || !this.isWatchExpired(expiration)) {
        console.log(`✅ [Google] Watch ${channelId} is still valid`);
        return true;
      }

      console.log(`🔄 [Google] Watch ${channelId} expired, renewing...`);

      // Arrêter l'ancien watch
      await this.stopWatch(webhook.user_id, channelId, resourceId);

      // Déterminer le type de watch
      const actionType = webhook.repository?.split(':')[1];

      if (actionType === 'google.calendar_event_invite') {
        const calendarId = secretData.calendarId || 'primary';
        const newWatch = await this.setupCalendarWatch(
          webhook.user_id,
          webhook.url,
          calendarId
        );
        if (newWatch) {
          await this.updateWebhookWithWatchInfo(webhook.id, newWatch);
          return true;
        }
      } else if (actionType === 'google.drive_file_added') {
        const fileId = secretData.fileId || 'root';
        const newWatch = await this.setupDriveWatch(
          webhook.user_id,
          webhook.url,
          fileId
        );
        if (newWatch) {
          await this.updateWebhookWithWatchInfo(webhook.id, newWatch);
          return true;
        }
      }

      console.error(`❌ [Google] Failed to renew watch for action type: ${actionType}`);
      return false;
    } catch (error) {
      console.error('Error renewing Google watch:', error);
      return false;
    }
  }

  async cleanupExpiredWatches(): Promise<void> {
    try {
      console.log('🧹 [Google] Starting cleanup of expired watches...');

      const webhooks = await AppDataSource.getRepository(ExternalWebhooks).find({
        where: {
          service: 'google',
          is_active: true,
        },
      });

      let renewedCount = 0;
      let failedCount = 0;

      for (const webhook of webhooks) {
        try {
          const renewed = await this.renewWatchIfNeeded(webhook);
          if (renewed) {
            renewedCount++;
          }
        } catch (error) {
          console.error(`❌ [Google] Failed to renew watch for webhook ${webhook.id}:`, error);
          failedCount++;
        }
      }

      console.log(`✅ [Google] Watch cleanup completed: ${renewedCount} renewed, ${failedCount} failed`);
    } catch (error) {
      console.error('Error during watch cleanup:', error);
    }
  }

  async setupCalendarWatch(
    userId: number,
    webhookUrl: string,
    calendarId: string = 'primary'
  ): Promise<GoogleWatchResponse & { calendarId: string } | null> {
    try {
      const userToken = await googleOAuth.getUserToken(userId);
      if (!userToken) {
        throw new Error('User token not found for Google service');
      }

      const channelId = crypto.randomUUID();
      console.log(
        `📅 [Google Calendar] Creating watch for user ${userId}, calendar: ${calendarId}`
      );

      const response = await fetch(
        `${this.apiBaseUrl}/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/watch`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${userToken.token_value}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            id: channelId,
            type: 'web_hook',
            address: webhookUrl,
          }),
        }
      );

      console.log(`📅 [Google Calendar] API Response Status: ${response.status}`);
      console.log(`📅 [Google Calendar] API Response Headers:`, response.headers);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ [Google Calendar] API Error Response:`, errorText);
        console.error(`❌ [Google Calendar] Request details:`, {
          url: `${this.apiBaseUrl}/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/watch`,
          method: 'POST',
          headers: {
            Authorization: `Bearer ${userToken.token_value ? '[REDACTED]' : 'MISSING'}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            id: channelId,
            type: 'web_hook',
            address: webhookUrl,
          }),
        });
        return null;
      }

      const watchResponse = (await response.json()) as GoogleWatchResponse;
      console.log(`✅ [Google Calendar] Full API Response:`, JSON.stringify(watchResponse, null, 2));
      console.log(`✅ [Google Calendar] Watch created: ${watchResponse.id} (expires: ${new Date(parseInt(watchResponse.expiration)).toISOString()})`);

      return { ...watchResponse, calendarId };
    } catch (error) {
      console.error('Error creating Calendar watch:', error);
      return null;
    }
  }


  async setupDriveWatch(
    userId: number,
    webhookUrl: string,
    fileId: string = 'root'
  ): Promise<GoogleWatchResponse & { fileId: string } | null> {
    try {
      const userToken = await googleOAuth.getUserToken(userId);
      if (!userToken) {
        throw new Error('User token not found for Google service');
      }

      const channelId = crypto.randomUUID();

      console.log(
        `📂 [Google Drive] Creating watch for user ${userId}, file: ${fileId}`
      );

      const response = await fetch(
        `${this.apiBaseUrl}/drive/v3/files/${fileId}/watch`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${userToken.token_value}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            id: channelId,
            type: 'web_hook',
            address: webhookUrl,
          }),
        }
      );

      console.log(`📂 [Google Drive] API Response Status: ${response.status}`);
      console.log(`📂 [Google Drive] API Response Headers:`, response.headers);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ [Google Drive] API Error Response:`, errorText);
        console.error(`❌ [Google Drive] Request details:`, {
          url: `${this.apiBaseUrl}/drive/v3/files/${fileId}/watch`,
          method: 'POST',
          headers: {
            Authorization: `Bearer ${userToken.token_value ? '[REDACTED]' : 'MISSING'}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            id: channelId,
            type: 'web_hook',
            address: webhookUrl,
          }),
        });
        return null;
      }

      const watchResponse = (await response.json()) as GoogleWatchResponse;
      console.log(`✅ [Google Drive] Full API Response:`, JSON.stringify(watchResponse, null, 2));
      console.log(`✅ [Google Drive] Watch created: ${watchResponse.id} (expires: ${new Date(parseInt(watchResponse.expiration)).toISOString()})`);

      return { ...watchResponse, fileId };
    } catch (error) {
      console.error('Error creating Drive watch:', error);
      return null;
    }
  }

  async stopWatch(
    userId: number,
    channelId: string,
    resourceId: string
  ): Promise<boolean> {
    try {
      const userToken = await googleOAuth.getUserToken(userId);
      if (!userToken) {
        throw new Error('User token not found for Google service');
      }

      const response = await fetch(
        `${this.apiBaseUrl}/calendar/v3/channels/stop`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${userToken.token_value}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            id: channelId,
            resourceId: resourceId,
          }),
        }
      );

      console.log(`🛑 [Google] Stop Watch API Response Status: ${response.status}`);
      console.log(`🛑 [Google] Stop Watch API Response Headers:`, response.headers);

      if (!response.ok) {
        const errorText = await response.text();
        console.warn(`⚠️  [Google] Stop Watch API Error Response:`, errorText);
        console.warn(`⚠️  [Google] Stop Watch Request details:`, {
          url: `${this.apiBaseUrl}/calendar/v3/channels/stop`,
          method: 'POST',
          headers: {
            Authorization: `Bearer ${userToken.token_value ? '[REDACTED]' : 'MISSING'}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            id: channelId,
            resourceId: resourceId,
          }),
        });
        return false;
      }

      const responseText = await response.text();
      console.log(`✅ [Google] Stop Watch API Response:`, responseText || 'No content');

      console.log(`✅ [Google] Watch stopped: ${channelId}`);
      return true;
    } catch (error) {
      console.error('Error stopping Google watch:', error);
      return false;
    }
  }

  async updateWebhookWithWatchInfo(
    webhookId: number,
    watchResponse: GoogleWatchResponse & { calendarId?: string; fileId?: string }
  ): Promise<void> {
    const webhook = await AppDataSource.getRepository(ExternalWebhooks).findOne(
      {
        where: { id: webhookId },
      }
    );

    if (!webhook) {
      console.error(`Webhook ${webhookId} not found`);
      return;
    }

    webhook.external_id = watchResponse.resourceId;
    const secretData: Record<string, string> = {
      channelId: watchResponse.id,
      resourceId: watchResponse.resourceId,
      expiration: watchResponse.expiration,
    };

    if ('calendarId' in watchResponse && watchResponse.calendarId) {
      secretData.calendarId = watchResponse.calendarId;
    }
    if ('fileId' in watchResponse && watchResponse.fileId) {
      secretData.fileId = watchResponse.fileId;
    }

    webhook.secret = JSON.stringify(secretData);

    await AppDataSource.getRepository(ExternalWebhooks).save(webhook);
    console.log(`✅ [Google] Webhook ${webhookId} updated with watch info`);
  }
}

export const googleWebhookManager = new GoogleWebhookManager();
