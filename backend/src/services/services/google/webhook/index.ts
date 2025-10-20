import { Request, Response } from 'express';
import { AppDataSource } from '../../../../config/db';
import { WebhookEvents } from '../../../../config/entity/WebhookEvents';
import { ExternalWebhooks } from '../../../../config/entity/ExternalWebhooks';
import type { WebhookHandler } from '../../../../types/webhook';

interface GmailMessageHeader {
  name: string;
  value: string;
}

interface GmailMessageResponse {
  id: string;
  threadId: string;
  snippet: string;
  labelIds?: string[];
  payload?: {
    headers?: GmailMessageHeader[];
  };
}

interface CalendarEventAttendee {
  email: string;
  responseStatus: string;
  displayName?: string;
}

interface CalendarEventResponse {
  id: string;
  summary: string;
  description?: string;
  location?: string;
  start?: {
    dateTime?: string;
    date?: string;
  };
  end?: {
    dateTime?: string;
    date?: string;
  };
  organizer?: {
    email: string;
    displayName?: string;
  };
  attendees?: CalendarEventAttendee[];
  htmlLink: string;
}

interface DriveFileOwner {
  emailAddress: string;
  displayName?: string;
}

interface DriveFileResponse {
  id: string;
  name: string;
  mimeType: string;
  size?: string;
  createdTime: string;
  modifiedTime: string;
  webViewLink?: string;
  webContentLink?: string;
  owners?: DriveFileOwner[];
  parents?: string[];
}

class GoogleWebhookHandler implements WebhookHandler {
  service = 'google';

  async handle(req: Request, res: Response): Promise<Response> {
    try {
      console.log(
        `\n🎣 [GOOGLE WEBHOOK] Notification received from ${req.headers['x-goog-resource-state']}`
      );

      // Log détaillé des headers reçus
      console.log(`🔍 [GOOGLE WEBHOOK] All received headers:`, JSON.stringify(req.headers, null, 2));
      console.log(`🔍 [GOOGLE WEBHOOK] Request body:`, JSON.stringify(req.body, null, 2));

      const resourceState = req.headers['x-goog-resource-state'] as string;
      const resourceId = req.headers['x-goog-resource-id'] as string;
      const channelId = req.headers['x-goog-channel-id'] as string;
      const messageNumber = req.headers['x-goog-message-number'] as string;

      console.log(`📊 [GOOGLE WEBHOOK] Parsed headers:`, {
        resourceState,
        resourceId,
        channelId,
        messageNumber,
        resourceUri: req.headers['x-goog-resource-uri'],
        channelToken: req.headers['x-goog-channel-token'],
        channelExpiration: req.headers['x-goog-channel-expiration'],
      });

      if (resourceState === 'sync') {
        console.log('✅ [GOOGLE WEBHOOK] Sync confirmation received');
        return res.status(200).json({ message: 'Sync acknowledged' });
      }

      if (!channelId || !resourceId) {
        console.error('❌ [GOOGLE WEBHOOK] Missing required headers');
        return res.status(400).json({ error: 'Missing required headers' });
      }

      const webhookUrl = `${process.env.WEBHOOK_BASE_URL || ''}${req.originalUrl}`;

      const externalWebhook = await AppDataSource.getRepository(
        ExternalWebhooks
      ).findOne({
        where: {
          url: webhookUrl,
          service: 'google',
          is_active: true,
        },
      });

      if (!externalWebhook) {
        console.error(
          `❌ [GOOGLE WEBHOOK] No webhook found for URL: ${webhookUrl}`
        );
        return res.status(404).json({ error: 'Webhook not found' });
      }

      console.log(
        `✅ [GOOGLE WEBHOOK] Found webhook for channel ${channelId} (user: ${externalWebhook.user_id})`
      );

      // Vérifier et renouveler le watch si nécessaire
      const { googleWebhookManager } = await import('./webhookManager');
      const watchRenewed = await googleWebhookManager.renewWatchIfNeeded(externalWebhook);
      if (!watchRenewed) {
        console.warn(`⚠️  [Google Webhook] Failed to renew watch for webhook ${externalWebhook.id}, proceeding anyway`);
      }

      const { serviceSubscriptionManager } = await import(
        '../../../ServiceSubscriptionManager'
      );
      const isSubscribed = await serviceSubscriptionManager.isUserSubscribed(
        externalWebhook.user_id,
        'google'
      );

      if (!isSubscribed) {
        console.log(
          `⚠️  [Google Webhook] User ${externalWebhook.user_id} not subscribed - ignoring`
        );
        return res
          .status(200)
          .json({ message: 'User not subscribed to service' });
      }

      const actionType = this.getActionTypeFromWebhook(
        externalWebhook,
        resourceState
      );

      if (!actionType) {
        console.log(
          `⚠️  [Google Webhook] Unable to determine action type for state: ${resourceState}`
        );
        return res
          .status(200)
          .json({ message: 'Resource state not supported' });
      }

      console.log(
        `🎣 [Google Webhook] Processing ${resourceState} → ${actionType}`
      );

      const webhookData = await this.fetchResourceData(
        externalWebhook,
        actionType,
        resourceId
      );

      if (actionType === 'google.email_received' && webhookData) {
        console.log(
          `📧 Email from ${webhookData.from}: ${webhookData.subject}`
        );
      } else if (actionType === 'google.calendar_event_invite' && webhookData) {
        console.log(
          `📅 Calendar event: ${webhookData.summary} (${webhookData.start_datetime})`
        );
      } else if (actionType === 'google.drive_file_added' && webhookData) {
        console.log(
          `📂 Drive file added: ${webhookData.name} (${webhookData.mime_type})`
        );
      }

      const webhookEvent = new WebhookEvents();
      webhookEvent.action_type = actionType;
      webhookEvent.user_id = externalWebhook.user_id;
      webhookEvent.source = 'google';
      webhookEvent.external_id = `${channelId}-${messageNumber}`;
      webhookEvent.payload = webhookData || {
        resource_id: resourceId,
        resource_state: resourceState,
        channel_id: channelId,
      };
      webhookEvent.status = 'received';
      webhookEvent.user_agent = req.get('User-Agent') || null;
      webhookEvent.signature_verified = false;

      await AppDataSource.getRepository(WebhookEvents).save(webhookEvent);

      externalWebhook.last_triggered_at = new Date();
      await AppDataSource.getRepository(ExternalWebhooks).save(externalWebhook);

      console.log(
        `✅ [Google Webhook] Event processed successfully (ID: ${webhookEvent.id})`
      );

      return res
        .status(200)
        .json({ message: 'Webhook processed successfully' });
    } catch (error) {
      console.error('Error processing Google webhook:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  private getActionTypeFromWebhook(
    webhook: ExternalWebhooks,
    resourceState: string
  ): string | null {
    if (resourceState !== 'exists' && resourceState !== 'update') {
      return null;
    }

    const repository = webhook.repository;
    if (repository && repository.includes(':')) {
      const actionType = repository.split(':')[1];
      console.log(`🔍 [Google Webhook] Extracted action type from repository: ${actionType}`);
      return actionType || null;
    }

    if (webhook.url.includes('/gmail')) {
      console.log('🔍 [Google Webhook] Detected Gmail webhook from URL');
      return 'google.email_received';
    } else if (webhook.url.includes('/calendar')) {
      console.log('🔍 [Google Webhook] Detected Calendar webhook from URL');
      return 'google.calendar_event_invite';
    } else if (webhook.url.includes('/drive')) {
      console.log('🔍 [Google Webhook] Detected Drive webhook from URL');
      return 'google.drive_file_added';
    }

    console.warn(`⚠️  [Google Webhook] Unable to determine action type from repository: ${repository}`);
    return null;
  }

  private async fetchResourceData(
    webhook: ExternalWebhooks,
    actionType: string,
    resourceId: string
  ): Promise<Record<string, unknown> | null> {
    try {
      const { googleOAuth } = await import('../oauth');
      const userToken = await googleOAuth.getUserToken(webhook.user_id);
      if (!userToken) {
        console.error('❌ [Google Webhook] No access token found for user');
        return null;
      }

      const accessToken = userToken.token_value;
      const apiBaseUrl =
        process.env.SERVICE_GOOGLE_API_BASE_URL || 'https://www.googleapis.com';

      switch (actionType) {
        case 'google.email_received':
          return await this.fetchEmailData(accessToken, resourceId, apiBaseUrl);
        case 'google.calendar_event_invite': {
          let calendarId = 'primary';
          try {
            if (webhook.secret) {
              const secretData = JSON.parse(webhook.secret);
              calendarId = secretData.calendarId || 'primary';
            }
          } catch (error) {
            console.warn('⚠️  [Google Webhook] Failed to parse webhook secret, using primary calendar', error);
          }
          return await this.fetchCalendarEventData(
            accessToken,
            resourceId,
            apiBaseUrl,
            calendarId
          );
        }
        case 'google.drive_file_added':
          return await this.fetchDriveFileData(
            accessToken,
            resourceId,
            apiBaseUrl
          );
        default:
          console.warn(
            `⚠️  [Google Webhook] Unknown action type: ${actionType}`
          );
          return null;
      }
    } catch (error) {
      console.error('Error fetching resource data:', error);
      return null;
    }
  }

  private async fetchEmailData(
    accessToken: string,
    messageId: string,
    apiBaseUrl: string
  ): Promise<Record<string, unknown> | null> {
    try {
      console.log(`📧 [Google Gmail] Fetching email data for message: ${messageId}`);

      const response = await fetch(
        `${apiBaseUrl}/gmail/v1/users/me/messages/${messageId}?format=metadata&metadataHeaders=From&metadataHeaders=To&metadataHeaders=Subject&metadataHeaders=Date`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      console.log(`📧 [Google Gmail] API Response Status: ${response.status}`);
      console.log(`📧 [Google Gmail] API Response Headers:`, response.headers);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ [Google Gmail] API Error Response:`, errorText);
        console.error(`❌ [Google Gmail] Request details:`, {
          url: `${apiBaseUrl}/gmail/v1/users/me/messages/${messageId}?format=metadata&metadataHeaders=From&metadataHeaders=To&metadataHeaders=Subject&metadataHeaders=Date`,
          method: 'GET',
          headers: {
            Authorization: accessToken ? '[REDACTED]' : 'MISSING',
          },
        });
        return null;
      }

      const message = (await response.json()) as GmailMessageResponse;
      console.log(`✅ [Google Gmail] Full API Response:`, JSON.stringify(message, null, 2));
      const headers = message.payload?.headers || [];
      const getHeader = (name: string) =>
        headers.find(h => h.name.toLowerCase() === name.toLowerCase())?.value ||
        '';

      return {
        message_id: message.id,
        thread_id: message.threadId,
        from: getHeader('from'),
        to: getHeader('to')
          .split(',')
          .map((e: string) => e.trim()),
        subject: getHeader('subject'),
        snippet: message.snippet,
        date: getHeader('date'),
        labels: message.labelIds || [],
      };
    } catch (error) {
      console.error('Error fetching email data:', error);
      return null;
    }
  }

  private async fetchCalendarEventData(
    accessToken: string,
    eventId: string,
    apiBaseUrl: string,
    calendarId: string = 'primary'
  ): Promise<Record<string, unknown> | null> {
    try {
      console.log(`📅 [Google Calendar] Fetching event data for event: ${eventId}, calendar: ${calendarId}`);

      const response = await fetch(
        `${apiBaseUrl}/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${eventId}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      console.log(`📅 [Google Calendar] API Response Status: ${response.status}`);
      console.log(`📅 [Google Calendar] API Response Headers:`, response.headers);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ [Google Calendar] API Error Response:`, errorText);
        console.error(`❌ [Google Calendar] Request details:`, {
          url: `${apiBaseUrl}/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${eventId}`,
          method: 'GET',
          headers: {
            Authorization: accessToken ? '[REDACTED]' : 'MISSING',
          },
        });
        return null;
      }

      const event = (await response.json()) as CalendarEventResponse;
      console.log(`✅ [Google Calendar] Full API Response:`, JSON.stringify(event, null, 2));

      return {
        event_id: event.id,
        calendar_id: calendarId,
        summary: event.summary,
        description: event.description,
        start_datetime: event.start?.dateTime || event.start?.date,
        end_datetime: event.end?.dateTime || event.end?.date,
        location: event.location,
        organizer: {
          email: event.organizer?.email || '',
          display_name: event.organizer?.displayName,
        },
        attendees:
          event.attendees?.map(a => ({
            email: a.email,
            response_status: a.responseStatus,
            display_name: a.displayName,
          })) || [],
        html_link: event.htmlLink,
      };
    } catch (error) {
      console.error('Error fetching calendar event data:', error);
      return null;
    }
  }

  private async fetchDriveFileData(
    accessToken: string,
    fileId: string,
    apiBaseUrl: string
  ): Promise<Record<string, unknown> | null> {
    try {
      console.log(`📂 [Google Drive] Fetching file data for file: ${fileId}`);

      const response = await fetch(
        `${apiBaseUrl}/drive/v3/files/${fileId}?fields=id,name,mimeType,size,createdTime,modifiedTime,webViewLink,webContentLink,owners,parents`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      console.log(`📂 [Google Drive] API Response Status: ${response.status}`);
      console.log(`📂 [Google Drive] API Response Headers:`, response.headers);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ [Google Drive] API Error Response:`, errorText);
        console.error(`❌ [Google Drive] Request details:`, {
          url: `${apiBaseUrl}/drive/v3/files/${fileId}?fields=id,name,mimeType,size,createdTime,modifiedTime,webViewLink,webContentLink,owners,parents`,
          method: 'GET',
          headers: {
            Authorization: accessToken ? '[REDACTED]' : 'MISSING',
          },
        });
        return null;
      }

      const file = (await response.json()) as DriveFileResponse;
      console.log(`✅ [Google Drive] Full API Response:`, JSON.stringify(file, null, 2));

      return {
        file_id: file.id,
        name: file.name,
        mime_type: file.mimeType,
        size: file.size ? parseInt(file.size) : 0,
        created_time: file.createdTime,
        modified_time: file.modifiedTime,
        web_view_link: file.webViewLink,
        web_content_link: file.webContentLink,
        owner: file.owners?.[0]
          ? {
              email: file.owners[0].emailAddress,
              display_name: file.owners[0].displayName,
            }
          : undefined,
        parents: file.parents || [],
      };
    } catch (error) {
      console.error('Error fetching drive file data:', error);
      return null;
    }
  }
}

export default new GoogleWebhookHandler();
