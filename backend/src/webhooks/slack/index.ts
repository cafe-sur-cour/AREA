import { Request, Response } from 'express';
import crypto from 'crypto';
import { AppDataSource } from '../../config/db';
import { WebhookEvents } from '../../config/entity/WebhookEvents';
import { UserToken } from '../../config/entity/UserToken';
import type { WebhookHandler } from '../../types/webhook';

class SlackWebhookHandler implements WebhookHandler {
  service = 'slack';

  async handle(req: Request, res: Response): Promise<Response> {
    try {
      console.log(
        `\n🎣 [SLACK WEBHOOK] Event received`
      );

      const signature = req.headers['x-slack-signature'] as string;
      const timestamp = req.headers['x-slack-request-timestamp'] as string;

      // Handle URL verification challenge (no auth needed)
      if (req.body.type === 'url_verification') {
        console.log('✅ [SLACK WEBHOOK] URL verification challenge received');
        return res.status(200).json({ challenge: req.body.challenge });
      }

      if (!signature || !timestamp) {
        console.error('❌ [SLACK WEBHOOK] Missing required headers');
        return res.status(400).json({ error: 'Missing required headers' });
      }

      // Check timestamp to prevent replay attacks (within 5 minutes)
      const now = Math.floor(Date.now() / 1000);
      const requestTimestamp = parseInt(timestamp);
      if (Math.abs(now - requestTimestamp) > 300) {
        console.error('❌ [SLACK WEBHOOK] Request timestamp too old');
        return res.status(400).json({ error: 'Request timestamp too old' });
      }

      // For Slack, find user by team_id from the payload
      const teamId = req.body?.team_id || req.body?.event?.team;
      if (!teamId) {
        console.error('❌ [SLACK WEBHOOK] No team_id found in payload');
        return res.status(400).json({ error: 'No team information' });
      }

      // Find user by Slack team ID
      const userToken = await this.findUserBySlackTeam(teamId);
      if (!userToken) {
        console.log(`⚠️  [SLACK WEBHOOK] No user found for Slack team ${teamId}`);
        return res.status(200).json({ message: 'Team not registered' });
      }

      const userId = userToken.user_id;

      console.log(
        `✅ [SLACK WEBHOOK] Found user ${userId} for Slack team ${teamId}`
      );

      const { serviceSubscriptionManager } = await import(
        '../../services/ServiceSubscriptionManager'
      );
      const isSubscribed = await serviceSubscriptionManager.isUserSubscribed(
        userId,
        'slack'
      );

      if (!isSubscribed) {
        console.log(
          `⚠️  [SLACK Webhook] User ${userId} not subscribed - ignoring`
        );
        return res
          .status(200)
          .json({ message: 'User not subscribed to service' });
      }

      // Verify Slack signature using the app's signing secret
      const signingSecret = process.env.SERVICE_SLACK_SIGNING_SECRET;
      if (signingSecret) {
        const bodyString = JSON.stringify(req.body);
        const baseString = `v0:${timestamp}:${bodyString}`;

        const expectedSignature = crypto
          .createHmac('sha256', signingSecret)
          .update(baseString, 'utf8')
          .digest('hex');

        const receivedSignature = signature.replace('v0=', '');

        if (
          !crypto.timingSafeEqual(
            Buffer.from(expectedSignature, 'hex'),
            Buffer.from(receivedSignature, 'hex')
          )
        ) {
          console.error('❌ [SLACK WEBHOOK] Invalid signature');
          return res.status(400).json({ error: 'Invalid signature' });
        }
      } else {
        console.warn('⚠️  [SLACK WEBHOOK] No signing secret configured - skipping signature verification');
      }

      // Handle actual events
      if (req.body.type === 'event_callback') {
        const event = req.body.event;
        if (!event) {
          console.error('❌ [SLACK WEBHOOK] No event in payload');
          return res.status(400).json({ error: 'No event in payload' });
        }

        const actionType = this.getActionTypeFromEvent(event);

        if (!actionType) {
          console.log(`⚠️  [SLACK WEBHOOK] Unsupported event type: ${event.type}`);
          return res.status(200).json({ message: 'Event type not supported' });
        }

        console.log(`🎣 [SLACK WEBHOOK] Processing ${event.type} → ${actionType}`);

        // Log event details
        if (event.type === 'message') {
          const channelType = event.channel_type || 'unknown';
          console.log(
            `💬 Message in ${channelType} channel ${event.channel} from user ${event.user}`
          );
        } else if (event.type === 'app_mention') {
          console.log(
            `🏷️  Mention in channel ${event.channel} from user ${event.user}`
          );
        } else if (event.type === 'reaction_added') {
          console.log(
            `😀 Reaction ${event.reaction} added to message in channel ${event.item?.channel} by user ${event.user}`
          );
        }

        const webhookEvent = new WebhookEvents();
        webhookEvent.action_type = actionType;
        webhookEvent.user_id = userId;
        webhookEvent.source = 'slack';
        webhookEvent.external_id = req.body.event_id || `slack_${Date.now()}`;
        webhookEvent.payload = req.body;
        webhookEvent.status = 'received';
        webhookEvent.user_agent = req.get('User-Agent') || null;
        webhookEvent.signature_verified = !!process.env.SERVICE_SLACK_SIGNING_SECRET;

        await AppDataSource.getRepository(WebhookEvents).save(webhookEvent);

        console.log(
          `✅ [SLACK WEBHOOK] Event processed successfully (ID: ${webhookEvent.id})`
        );

        return res.status(200).json({ message: 'Event processed successfully' });
      }

      console.log(`⚠️  [SLACK WEBHOOK] Unknown payload type: ${req.body.type}`);
      return res.status(200).json({ message: 'Unknown payload type' });
    } catch (error) {
      console.error('Error processing Slack webhook:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  private getActionTypeFromEvent(event: Record<string, unknown>): string | null {
    switch (event.type) {
      case 'message':
        // Check channel type for message events
        if (event.channel_type === 'channel' || event.channel_type === 'group') {
          return 'slack.new_message';
        } else if (event.channel_type === 'im') {
          return 'slack.new_dm';
        }
        break;
      case 'app_mention':
        return 'slack.user_mention';
      case 'reaction_added':
        return 'slack.reaction_added';
    }
    return null;
  }

  private async findUserBySlackTeam(teamId: string): Promise<UserToken | null> {
    const tokenRepository = AppDataSource.getRepository(UserToken);

    // For now, find the first active Slack token
    // TODO: In production, store team_id in database during OAuth and match exactly
    const slackToken = await tokenRepository.findOne({
      where: {
        token_type: 'slack_access_token',
        is_revoked: false,
      },
    });

    if (slackToken) {
      console.log(`🔍 [SLACK WEBHOOK] Found Slack user ${slackToken.user_id} for team ${teamId}`);
      return slackToken;
    }

    return null;
  }
}

export default new SlackWebhookHandler();