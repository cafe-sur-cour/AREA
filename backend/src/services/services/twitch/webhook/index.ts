import { Request, Response } from 'express';
import crypto from 'crypto';
import { AppDataSource } from '../../../../config/db';
import { WebhookEvents } from '../../../../config/entity/WebhookEvents';
import { ExternalWebhooks } from '../../../../config/entity/ExternalWebhooks';
import type { WebhookHandler } from '../../../../types/webhook';

class TwitchWebhookHandler implements WebhookHandler {
  service = 'twitch';

  async handle(req: Request, res: Response): Promise<Response> {
    try {
      const messageId = req.headers['twitch-eventsub-message-id'] as string;
      const messageTimestamp = req.headers[
        'twitch-eventsub-message-timestamp'
      ] as string;
      const messageSignature = req.headers[
        'twitch-eventsub-message-signature'
      ] as string;
      const messageType = req.headers['twitch-eventsub-message-type'] as string;
      const subscriptionType = req.headers[
        'twitch-eventsub-subscription-type'
      ] as string;

      if (
        !messageId ||
        !messageTimestamp ||
        !messageSignature ||
        !messageType
      ) {
        console.error('❌ [TWITCH WEBHOOK] Missing required headers');
        return res.status(400).json({ error: 'Missing required headers' });
      }

      if (messageType === 'webhook_callback_verification') {
        return this.handleVerificationChallenge(req, res);
      }

      const webhookUrl = `${process.env.WEBHOOK_BASE_URL || ''}${req.originalUrl}`;

      const externalWebhook = await AppDataSource.getRepository(
        ExternalWebhooks
      ).findOne({
        where: {
          url: webhookUrl,
          service: 'twitch',
          is_active: true,
        },
      });

      if (!externalWebhook) {
        console.error(
          `❌ [TWITCH WEBHOOK] No webhook found for URL: ${webhookUrl}`
        );
        return res.status(404).json({ error: 'Webhook not found' });
      }

      const { serviceSubscriptionManager } = await import(
        '../../../ServiceSubscriptionManager'
      );
      const isSubscribed = await serviceSubscriptionManager.isUserSubscribed(
        externalWebhook.user_id,
        'twitch'
      );

      if (!isSubscribed) {
        return res
          .status(200)
          .json({ message: 'User not subscribed to service' });
      }

      if (externalWebhook.secret) {
        const isValidSignature = this.verifySignature(
          req.body,
          messageId,
          messageTimestamp,
          messageSignature,
          externalWebhook.secret
        );

        if (!isValidSignature) {
          console.error('❌ [TWITCH WEBHOOK] Invalid signature');
          return res.status(400).json({ error: 'Invalid signature' });
        }
      }

      if (messageType === 'revocation') {
        return res.status(200).json({ message: 'Revocation acknowledged' });
      }

      if (messageType === 'notification') {
        return this.handleNotification(
          req,
          res,
          externalWebhook,
          messageId,
          subscriptionType
        );
      }

      return res.status(200).json({ message: 'Message type not supported' });
    } catch (error) {
      console.error('Error processing Twitch webhook:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  private async handleVerificationChallenge(
    req: Request,
    res: Response
  ): Promise<Response> {
    const challenge = req.body.challenge;

    if (!challenge) {
      console.error(
        '❌ [TWITCH WEBHOOK] Missing challenge in verification request'
      );
      return res.status(400).json({ error: 'Missing challenge' });
    }

    return res.status(200).send(challenge);
  }

  private async handleNotification(
    req: Request,
    res: Response,
    externalWebhook: ExternalWebhooks,
    messageId: string,
    subscriptionType: string
  ): Promise<Response> {
    const existingEvent = await AppDataSource.getRepository(
      WebhookEvents
    ).findOne({
      where: {
        external_id: messageId,
        source: 'twitch',
      },
    });

    if (existingEvent) {
      return res.status(200).json({ message: 'Duplicate message ignored' });
    }

    const actionType = this.getActionTypeFromSubscription(subscriptionType);

    if (!actionType) {
      return res
        .status(200)
        .json({ message: 'Subscription type not supported' });
    }

    const webhookEvent = new WebhookEvents();
    webhookEvent.action_type = actionType;
    webhookEvent.user_id = externalWebhook.user_id;
    webhookEvent.source = 'twitch';
    webhookEvent.external_id = messageId;
    webhookEvent.payload = req.body.event;
    webhookEvent.status = 'received';
    webhookEvent.user_agent = req.get('User-Agent') || null;
    webhookEvent.signature_verified = !!externalWebhook.secret;

    await AppDataSource.getRepository(WebhookEvents).save(webhookEvent);

    externalWebhook.last_triggered_at = new Date();
    await AppDataSource.getRepository(ExternalWebhooks).save(externalWebhook);

    return res.status(200).json({ message: 'Webhook processed successfully' });
  }

  private verifySignature(
    body: Record<string, unknown>,
    messageId: string,
    messageTimestamp: string,
    messageSignature: string,
    secret: string
  ): boolean {
    const message = messageId + messageTimestamp + JSON.stringify(body);
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(message)
      .digest('hex');

    const receivedSignature = messageSignature.replace('sha256=', '');

    try {
      return crypto.timingSafeEqual(
        Buffer.from(expectedSignature, 'hex'),
        Buffer.from(receivedSignature, 'hex')
      );
    } catch {
      return false;
    }
  }

  private getActionTypeFromSubscription(
    subscriptionType: string
  ): string | null {
    switch (subscriptionType) {
      case 'channel.follow':
        return 'twitch.new_follower';
      case 'channel.subscribe':
        return 'twitch.new_subscription';
      default:
        return null;
    }
  }
}

export default new TwitchWebhookHandler();
