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

      if (!response.ok) {
        const errorText = await response.text();
        console.error(
          `❌ [Google Calendar] Failed to create watch: ${response.status} ${errorText}`
        );
        return null;
      }

      const watchResponse = (await response.json()) as GoogleWatchResponse;
      console.log(
        `✅ [Google Calendar] Watch created: ${watchResponse.id} (expires: ${watchResponse.expiration})`
      );

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

      if (!response.ok) {
        const errorText = await response.text();
        console.error(
          `❌ [Google Drive] Failed to create watch: ${response.status} ${errorText}`
        );
        return null;
      }

      const watchResponse = (await response.json()) as GoogleWatchResponse;
      console.log(
        `✅ [Google Drive] Watch created: ${watchResponse.id} (expires: ${watchResponse.expiration})`
      );

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

      if (!response.ok) {
        console.warn(
          `⚠️  [Google] Failed to stop watch: ${response.status} ${await response.text()}`
        );
        return false;
      }

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
