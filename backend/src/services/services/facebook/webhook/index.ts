import { Request, Response } from 'express';
import crypto from 'crypto';
import { AppDataSource } from '../../../../config/db';
import { WebhookEvents } from '../../../../config/entity/WebhookEvents';
import { ExternalWebhooks } from '../../../../config/entity/ExternalWebhooks';
import type { WebhookHandler } from '../../../../types/webhook';

class FacebookWebhookHandler implements WebhookHandler {
  service = 'facebook';

  async handle(req: Request, res: Response): Promise<Response> {
    try {
      // Handle GET request for webhook verification
      if (req.method === 'GET') {
        return this.verifyWebhook(req, res);
      }

      console.log(
        `\n🎣 [FACEBOOK WEBHOOK] Event received from ${req.body.object}`
      );

      const signature = req.headers['x-hub-signature-256'] as string;

      if (!signature) {
        console.error('❌ [FACEBOOK WEBHOOK] Missing signature header');
        return res.status(400).json({ error: 'Missing signature' });
      }

      const webhookUrl = `${process.env.WEBHOOK_BASE_URL || ''}${req.originalUrl}`;

      const externalWebhook = await AppDataSource.getRepository(
        ExternalWebhooks
      ).findOne({
        where: {
          url: webhookUrl,
          service: 'facebook',
          is_active: true,
        },
      });

      if (!externalWebhook) {
        console.error(
          `❌ [FACEBOOK WEBHOOK] No webhook found for URL: ${webhookUrl}`
        );
        return res.status(404).json({ error: 'Webhook not found' });
      }

      console.log(
        `✅ [FACEBOOK WEBHOOK] Found webhook for user: ${externalWebhook.user_id}`
      );

      // Check user subscription
      const { serviceSubscriptionManager } = await import(
        '../../../ServiceSubscriptionManager'
      );
      const isSubscribed = await serviceSubscriptionManager.isUserSubscribed(
        externalWebhook.user_id,
        'facebook'
      );

      if (!isSubscribed) {
        console.log(
          `⚠️  [Facebook Webhook] User ${externalWebhook.user_id} not subscribed - ignoring`
        );
        return res
          .status(200)
          .json({ message: 'User not subscribed to service' });
      }

      if (externalWebhook.secret) {
        const expectedSignature = crypto
          .createHmac('sha256', externalWebhook.secret)
          .update(JSON.stringify(req.body))
          .digest('hex');

        const receivedSignature = signature.replace('sha256=', '');

        if (
          !crypto.timingSafeEqual(
            Buffer.from(expectedSignature, 'hex'),
            Buffer.from(receivedSignature, 'hex')
          )
        ) {
          console.error('❌ [FACEBOOK WEBHOOK] Invalid signature');
          return res.status(400).json({ error: 'Invalid signature' });
        }
      }

      const { object, entry } = req.body;

      if (!entry || !Array.isArray(entry)) {
        console.log('⚠️  [Facebook Webhook] No entries in payload');
        return res.status(200).json({ message: 'No entries to process' });
      }

      console.log(`📦 [Facebook Webhook] Processing ${entry.length} entries`);

      for (const entryItem of entry) {
        await this.processEntry(entryItem, object, externalWebhook.user_id, req);
      }

      externalWebhook.last_triggered_at = new Date();
      await AppDataSource.getRepository(ExternalWebhooks).save(externalWebhook);

      console.log(
        `✅ [Facebook Webhook] All entries processed successfully`
      );

      return res
        .status(200)
        .json({ message: 'Webhook processed successfully' });
    } catch (error) {
      console.error('❌ [FACEBOOK WEBHOOK] Error processing:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Verify webhook during setup (GET request)
   */
  private verifyWebhook(req: Request, res: Response): Response {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    console.log(`🔐 [FACEBOOK WEBHOOK] Verification request received`);

    // Check if a token and mode were sent
    if (mode && token) {
      // Verify the mode and token
      console.log("Mode : ", mode);
      console.log("token : ", token , " vs ", process.env.WEBHOOK_SECRET);
      if (mode === 'subscribe' && token === process.env.WEBHOOK_SECRET) {
        console.log('✅ [FACEBOOK WEBHOOK] Webhook verified');
        return res.status(200).send(challenge);
      } else {
        console.error('❌ [FACEBOOK WEBHOOK] Verification failed');
        return res.sendStatus(403);
      }
    }

    return res.sendStatus(400);
  }

  /**
   * Process a single entry from the webhook payload
   */
  private async processEntry(
    entry: any,
    objectType: string,
    userId: number,
    req: Request
  ): Promise<void> {
    const changes = entry.changes || [];

    for (const change of changes) {
      const actionType = this.getActionTypeFromChange(objectType, change);

      if (!actionType) {
        console.log(
          `⚠️  [Facebook Webhook] Unsupported change: ${change.field}`
        );
        continue;
      }

      console.log(
        `🎯 [Facebook Webhook] Processing ${objectType}.${change.field} → ${actionType}`
      );

      // Log specific details based on field type
      this.logChangeDetails(change);

      // Save to database
      const webhookEvent = new WebhookEvents();
      webhookEvent.action_type = actionType;
      webhookEvent.user_id = userId;
      webhookEvent.source = 'facebook';
      webhookEvent.external_id = entry.id || `${entry.time}_${change.field}`;
      webhookEvent.payload = {
        object: objectType,
        entry_id: entry.id,
        time: entry.time,
        change: change,
      };
      webhookEvent.status = 'received';
      webhookEvent.user_agent = req.get('User-Agent') || null;
      webhookEvent.signature_verified = true;

      await AppDataSource.getRepository(WebhookEvents).save(webhookEvent);
      
      console.log(`✅ [Facebook Webhook] Event saved (ID: ${webhookEvent.id})`);
    }
  }

  /**
   * Determine action type from Facebook change object
   */
  private getActionTypeFromChange(
    objectType: string,
    change: any
  ): string | null {
    const field = change.field;

    // User object events
    if (objectType === 'user') {
      switch (field) {
        case 'name':
          return 'facebook.user.name_changed';
        case 'email':
          return 'facebook.user.email_changed';
        case 'picture':
          return 'facebook.user.picture_changed';
        case 'birthday':
          return 'facebook.user.birthday_changed';
        case 'hometown':
          return 'facebook.user.hometown_changed';
        case 'location':
          return 'facebook.user.location_changed';
        case 'feed':
          return 'facebook.user.feed_posted';
        case 'photos':
          return 'facebook.user.photo_uploaded';
        case 'videos':
          return 'facebook.user.video_uploaded';
        case 'about':
          return 'facebook.user.about_changed';
        default:
          return `facebook.user.${field}`;
      }
    }

    // Page object events
    if (objectType === 'page') {
      switch (field) {
        case 'messages':
          return 'facebook.page.message_received';
        case 'feed':
          return 'facebook.page.feed_posted';
        case 'comments':
          return 'facebook.page.comment_received';
        case 'ratings':
          return 'facebook.page.rating_received';
        default:
          return `facebook.page.${field}`;
      }
    }

    return null;
  }

  /**
   * Log details about the change for debugging
   */
  private logChangeDetails(change: any): void {
    const field = change.field;
    const value = change.value;

    if (field === 'feed' && value) {
      console.log(
        `  📝 Feed update - Type: ${value.post_id ? 'post' : 'unknown'}`
      );
    } else if (field === 'photos' && value) {
      console.log(
        `  📷 Photo upload - Photos: ${value.photos?.length || 1}`
      );
    } else if (field === 'videos' && value) {
      console.log(
        `  🎥 Video upload - Video ID: ${value.video_id || 'unknown'}`
      );
    } else if (field === 'name' && value) {
      console.log(
        `  👤 Name changed`
      );
    } else if (field === 'picture' && value) {
      console.log(
        `  🖼️  Profile picture changed`
      );
    } else {
      console.log(
        `  📋 ${field} changed`
      );
    }
  }
}

export default new FacebookWebhookHandler();
