import { Request, Response } from 'express';
import crypto from 'crypto';
import { AppDataSource } from '../../config/db';
import { WebhookEvents } from '../../config/entity/WebhookEvents';
import { ExternalWebhooks } from '../../config/entity/ExternalWebhooks';
import type { WebhookHandler } from '../../types/webhook';

class GitHubWebhookHandler implements WebhookHandler {
  service = 'github';

  async handle(req: Request, res: Response): Promise<Response> {
    try {
      console.log(`\n🎣 [GITHUB WEBHOOK] ${req.headers['x-github-event']} event received (${req.headers['x-github-delivery']})`);

      const signature = req.headers['x-hub-signature-256'] as string;
      const event = req.headers['x-github-event'] as string;
      const deliveryId = req.headers['x-github-delivery'] as string;

      if (!signature || !event) {
        console.error('❌ [GITHUB WEBHOOK] Missing required headers');
        return res.status(400).json({ error: 'Missing required headers' });
      }

      const webhookUrl = `${req.protocol}://${req.get('host')}${req.originalUrl}`;

      const externalWebhook = await AppDataSource.getRepository(
        ExternalWebhooks
      ).findOne({
        where: {
          url: webhookUrl,
          service: 'github',
          is_active: true,
        },
      });

      if (!externalWebhook) {
        console.error(`❌ [GITHUB WEBHOOK] No webhook found for URL: ${webhookUrl}`);
        return res.status(404).json({ error: 'Webhook not found' });
      }

      console.log(`✅ [GITHUB WEBHOOK] Found webhook for ${externalWebhook.repository} (user: ${externalWebhook.user_id})`);

      const { serviceSubscriptionManager } = await import(
        '../../services/ServiceSubscriptionManager'
      );
      const isSubscribed = await serviceSubscriptionManager.isUserSubscribed(
        externalWebhook.user_id,
        'github'
      );

      if (!isSubscribed) {
        console.log(`⚠️  [GitHub Webhook] User ${externalWebhook.user_id} not subscribed - ignoring`);
        return res.status(200).json({ message: 'User not subscribed to service' });
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
          return res.status(400).json({ error: 'Invalid signature' });
        }
      }

      const actionType = this.getActionTypeFromEvent(event, req.body);

      if (!actionType) {
        console.log(`⚠️  [GitHub Webhook] Unsupported event type: ${event}`);
        return res.status(200).json({ message: 'Event type not supported' });
      }

      console.log(`🎣 [GitHub Webhook] Processing ${event} → ${actionType}`);

      if (event === 'push') {
        const { repository, ref, commits, pusher } = req.body;
        const branch = ref?.replace('refs/heads/', '') || 'unknown';
        console.log(`� Push on ${repository?.full_name}/${branch} by ${pusher?.name} (${commits?.length || 0} commits)`);
      } else if (event === 'pull_request') {
        const { action, number, pull_request, repository } = req.body;
        console.log(`📦 PR #${number} ${action} on ${repository?.full_name} by ${pull_request?.user?.login}`);
      }

      const webhookEvent = new WebhookEvents();
      webhookEvent.action_type = actionType;
      webhookEvent.user_id = externalWebhook.user_id;
      webhookEvent.source = 'github';
      webhookEvent.external_id = deliveryId;
      webhookEvent.payload = req.body;
      webhookEvent.status = 'received';
      webhookEvent.user_agent = req.get('User-Agent') || null;
      webhookEvent.signature_verified = !!externalWebhook.secret;

      await AppDataSource.getRepository(WebhookEvents).save(webhookEvent);

      externalWebhook.last_triggered_at = new Date();
      await AppDataSource.getRepository(ExternalWebhooks).save(externalWebhook);

      console.log(`✅ [GitHub Webhook] Event processed successfully (ID: ${webhookEvent.id})`);

      return res
        .status(200)
        .json({ message: 'Webhook processed successfully' });
    } catch (error) {
      console.error('Error processing GitHub webhook:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  private getActionTypeFromEvent(
    event: string,
    payload: Record<string, unknown>
  ): string | null {
    switch (event) {
      case 'push':
        return 'github.push';
      case 'pull_request':
        const action = payload.action as string;
        if (action === 'opened') {
          return 'github.pull_request.opened';
        } else if (action === 'closed') {
          const pullRequest = payload.pull_request as Record<string, unknown>;
          if (pullRequest?.merged === true) {
            return 'github.pull_request.merged';
          }
        }
        break;
    }
    return null;
  }
}

export default new GitHubWebhookHandler();
