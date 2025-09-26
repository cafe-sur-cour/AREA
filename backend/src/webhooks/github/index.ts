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
      const signature = req.headers['x-hub-signature-256'] as string;
      const event = req.headers['x-github-event'] as string;
      const deliveryId = req.headers['x-github-delivery'] as string;

      if (!signature || !event) {
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
        return res.status(404).json({ error: 'Webhook not found' });
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

      console.log(
        `🎣 [GitHub Webhook] Received ${event} event - Action: ${actionType}`
      );

      if (event === 'push') {
        const { repository, ref, commits, pusher } = req.body;
        console.log(`📦 Repository: ${repository?.full_name || 'Unknown'}`);
        console.log(
          `🌿 Branch: ${ref?.replace('refs/heads/', '') || 'Unknown'}`
        );
        console.log(`👤 Pusher: ${pusher?.name || 'Unknown'}`);
        console.log(`📝 Commits: ${commits?.length || 0}`);
      } else if (event === 'pull_request') {
        const { action, number, pull_request, repository } = req.body;
        console.log(`📦 Repository: ${repository?.full_name || 'Unknown'}`);
        console.log(`🔢 PR #${number}: ${pull_request?.title || 'No title'}`);
        console.log(`📋 Action: ${action}`);
        console.log(`👤 Author: ${pull_request?.user?.login || 'Unknown'}`);
        if (pull_request?.merged) {
          console.log(`✅ PR merged at: ${pull_request.merged_at}`);
        }
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

      console.log(
        `✅ [GitHub Webhook] Event stored successfully - ID: ${webhookEvent.id}`
      );
      console.log(
        `🔄 [GitHub Webhook] Processing event through ExecutionService...\n`
      );

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
