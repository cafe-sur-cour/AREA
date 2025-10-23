import { Request, Response } from 'express';
import { AppDataSource } from '../../../../config/db';
import { WebhookEvents } from '../../../../config/entity/WebhookEvents';
import { ExternalWebhooks } from '../../../../config/entity/ExternalWebhooks';
import type { WebhookHandler } from '../../../../types/webhook';

class GitLabWebhookHandler implements WebhookHandler {
  service = 'gitlab';

  async handle(req: Request, res: Response): Promise<Response> {
    try {
      console.log(
        `\n🎣 [GITLAB WEBHOOK] ${req.headers['x-gitlab-event']} event received`
      );

      const token = req.headers['x-gitlab-token'] as string;
      const event = req.headers['x-gitlab-event'] as string;

      if (!token || !event) {
        console.error('❌ [GITLAB WEBHOOK] Missing required headers');
        return res.status(400).json({ error: 'Missing required headers' });
      }

      const webhookUrl = `${process.env.WEBHOOK_BASE_URL || ''}${req.originalUrl}`;

      const externalWebhook = await AppDataSource.getRepository(
        ExternalWebhooks
      ).findOne({
        where: {
          url: webhookUrl,
          service: 'gitlab',
          is_active: true,
        },
      });

      if (!externalWebhook) {
        console.error(
          `❌ [GITLAB WEBHOOK] No webhook found for URL: ${webhookUrl}`
        );
        return res.status(404).json({ error: 'Webhook not found' });
      }

      console.log(
        `✅ [GITLAB WEBHOOK] Found webhook for ${externalWebhook.repository} (user: ${externalWebhook.user_id})`
      );

      const { serviceSubscriptionManager } = await import(
        '../../../ServiceSubscriptionManager'
      );
      const isSubscribed = await serviceSubscriptionManager.isUserSubscribed(
        externalWebhook.user_id,
        'gitlab'
      );

      if (!isSubscribed) {
        console.log(
          `⚠️  [GitLab Webhook] User ${externalWebhook.user_id} not subscribed - ignoring`
        );
        return res
          .status(200)
          .json({ message: 'User not subscribed to service' });
      }

      if (externalWebhook.secret) {
        if (token !== externalWebhook.secret) {
          console.error('❌ [GITLAB WEBHOOK] Invalid token');
          return res.status(400).json({ error: 'Invalid token' });
        }
      }

      const actionType = this.getActionTypeFromEvent(event, req.body);

      if (!actionType) {
        console.log(`⚠️  [GitLab Webhook] Unsupported event type: ${event}`);
        return res.status(200).json({ message: 'Event type not supported' });
      }

      console.log(`🎣 [GitLab Webhook] Processing ${event} → ${actionType}`);

      if (event === 'Push Hook') {
        const { project, ref, commits, user_name } = req.body;
        const branch = ref?.replace('refs/heads/', '') || 'unknown';
        console.log(
          `📦 Push on ${project?.path_with_namespace}/${branch} by ${user_name} (${commits?.length || 0} commits)`
        );
      } else if (event === 'Merge Request Hook') {
        const { object_attributes, user } = req.body;
        const action = object_attributes?.action || object_attributes?.state;
        console.log(
          `📦 MR #${object_attributes?.iid} ${action} on ${object_attributes?.target?.path_with_namespace} by ${user?.name}`
        );
      }

      const webhookEvent = new WebhookEvents();
      webhookEvent.action_type = actionType;
      webhookEvent.user_id = externalWebhook.user_id;
      webhookEvent.source = 'gitlab';
      webhookEvent.external_id =
        (req.headers['x-gitlab-event-uuid'] as string) || null;
      webhookEvent.payload = req.body;
      webhookEvent.status = 'received';
      webhookEvent.user_agent = req.get('User-Agent') || null;
      webhookEvent.signature_verified = !!externalWebhook.secret;

      await AppDataSource.getRepository(WebhookEvents).save(webhookEvent);

      externalWebhook.last_triggered_at = new Date();
      await AppDataSource.getRepository(ExternalWebhooks).save(externalWebhook);

      console.log(
        `✅ [GitLab Webhook] Event processed successfully (ID: ${webhookEvent.id})`
      );

      return res
        .status(200)
        .json({ message: 'Webhook processed successfully' });
    } catch (error) {
      console.error('Error processing GitLab webhook:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  private getActionTypeFromEvent(
    event: string,
    payload: Record<string, unknown>
  ): string | null {
    switch (event) {
      case 'Push Hook':
        return 'gitlab.push';
      case 'Merge Request Hook':
        const objectAttributes = payload.object_attributes as Record<
          string,
          unknown
        >;
        const action = objectAttributes?.action as string;
        const state = objectAttributes?.state as string;
        if (action === 'open' || state === 'opened') {
          return 'gitlab.merge_request_opened';
        } else if (state === 'merged') {
          return 'gitlab.merge_request_merged';
        }
        break;
      case 'Issue Hook':
        const issueAction = (
          payload.object_attributes as Record<string, unknown>
        )?.action as string;
        if (issueAction === 'open') {
          return 'gitlab.issue_opened';
        }
        break;
    }
    return null;
  }
}

export default new GitLabWebhookHandler();
