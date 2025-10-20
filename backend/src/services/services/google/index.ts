import type { Service } from '../../../types/service';
import { getIconSvg } from '../../../utils/iconMapping';
import { googleActions } from './actions';
import { googleReactions } from './reactions';
import { googleReactionExecutor } from './executor';

const googleService: Service = {
  id: 'google',
  name: 'Google',
  description:
    'Google services integration including Gmail, Calendar, and Drive',
  version: '1.0.0',
  icon: getIconSvg('FaGoogle'),
  actions: googleActions,
  reactions: googleReactions,
  oauth: {
    enabled: true,
    supportsLogin: true,
  },
  getCredentials: async (userId: number) => {
    const { googleOAuth } = await import('./oauth');
    const userToken = await googleOAuth.getUserToken(userId);
    return userToken ? { access_token: userToken.token_value } : {};
  },
  ensureWebhookForMapping: async (mapping, userId, actionDefinition) => {
    if (!actionDefinition?.metadata?.webhookPattern) {
      return;
    }

    const actionType = mapping.action.type;
    console.log(
      `🔔 [Google Service] Ensuring webhook exists for action: ${actionType}`
    );

    try {
      const { AppDataSource } = await import('../../../config/db');
      const { ExternalWebhooks } = await import(
        '../../../config/entity/ExternalWebhooks'
      );
      const { googleWebhookManager } = await import('./webhook/webhookManager');

      let webhookPath = '/api/webhooks/google';
      if (actionType === 'google.email_received') {
        webhookPath += '/gmail';
      } else if (actionType === 'google.calendar_event_invite') {
        webhookPath += '/calendar';
      } else if (actionType === 'google.drive_file_added') {
        webhookPath += '/drive';
      }

      const webhookUrl = `${process.env.WEBHOOK_BASE_URL || ''}${webhookPath}`;

      const existingWebhook = await AppDataSource.getRepository(
        ExternalWebhooks
      ).findOne({
        where: {
          user_id: userId,
          service: 'google',
          url: webhookUrl,
          is_active: true,
        },
      });

      if (existingWebhook) {
        console.log(
          `✅ [Google Service] Webhook already exists for ${actionType}`
        );
        return;
      }

      const webhook = new ExternalWebhooks();
      webhook.user_id = userId;
      webhook.service = 'google';
      webhook.url = webhookUrl;
      webhook.repository = `google:${actionType}`;
      webhook.events = [actionType];
      webhook.is_active = true;

      const savedWebhook =
        await AppDataSource.getRepository(ExternalWebhooks).save(webhook);
      console.log(
        `✅ [Google Service] Webhook created for ${actionType} (URL: ${webhookUrl})`
      );

      if (actionType === 'google.calendar_event_invite') {
        const calendarId =
          (mapping.action.config?.calendar_id as string) || 'primary';
        const watchResponse = await googleWebhookManager.setupCalendarWatch(
          userId,
          webhookUrl,
          calendarId
        );

        if (watchResponse) {
          await googleWebhookManager.updateWebhookWithWatchInfo(
            savedWebhook.id,
            watchResponse
          );
        } else {
          console.warn(
            `⚠️  [Google Service] Calendar watch setup failed, but webhook is ready to receive notifications if configured manually`
          );
        }
      } else if (actionType === 'google.drive_file_added') {
        const fileId = (mapping.action.config?.folder_id as string) || 'root';
        const watchResponse = await googleWebhookManager.setupDriveWatch(
          userId,
          webhookUrl,
          fileId
        );

        if (watchResponse) {
          await googleWebhookManager.updateWebhookWithWatchInfo(
            savedWebhook.id,
            watchResponse
          );
        } else {
          console.warn(
            `⚠️  [Google Service] Drive watch setup failed, but webhook is ready to receive notifications if configured manually`
          );
        }
      } else if (actionType === 'google.email_received') {
        console.log(
          `ℹ️  [Google Service] Gmail requires Google Cloud Pub/Sub configuration. See GOOGLE_WEBHOOKS_SETUP.md for details.`
        );
      }
    } catch (error) {
      console.error(`❌ [Google Service] Failed to create webhook:`, error);
    }
  },
  authOnly: false,
};

export default googleService;

export const executor = googleReactionExecutor;

export async function initialize(): Promise<void> {
  console.log('Initializing Google service...');
  const { initializeGooglePassport } = await import('./passport');
  initializeGooglePassport();

  const { googleWebhookManager } = await import('./webhook/webhookManager');
  await googleWebhookManager.cleanupExpiredWatches();

  setInterval(async () => {
    await googleWebhookManager.cleanupExpiredWatches();
  }, 6 * 60 * 60 * 1000);

  console.log('Google service initialized');
}

export async function cleanup(): Promise<void> {
  console.log('Cleaning up Google service...');
  console.log('Google service cleaned up');
}
