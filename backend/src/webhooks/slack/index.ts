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
      const signature = req.headers['x-slack-signature'] as string;
      const timestamp = req.headers['x-slack-request-timestamp'] as string;

      if (req.body.type === 'url_verification') {
        return res.status(200).json({ challenge: req.body.challenge });
      }

      if (!signature || !timestamp) {
        return res.status(400).json({ error: 'Missing required headers' });
      }

      const now = Math.floor(Date.now() / 1000);
      const requestTimestamp = parseInt(timestamp);
      if (Math.abs(now - requestTimestamp) > 300) {
        return res.status(400).json({ error: 'Request timestamp too old' });
      }

      const teamId = req.body?.team_id || req.body?.event?.team;
      if (!teamId) {
        return res.status(400).json({ error: 'No team information' });
      }

      const userToken = await this.findUserBySlackTeam(teamId);
      if (!userToken) {
        return res.status(200).json({ message: 'Team not registered' });
      }

      const userId = userToken.user_id;

      const { serviceSubscriptionManager } = await import(
        '../../services/ServiceSubscriptionManager'
      );
      const isSubscribed = await serviceSubscriptionManager.isUserSubscribed(
        userId,
        'slack'
      );

      if (!isSubscribed) {
        return res
          .status(200)
          .json({ message: 'User not subscribed to service' });
      }

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
          return res.status(400).json({ error: 'Invalid signature' });
        }
      }

      if (req.body.type === 'event_callback') {
        const event = req.body.event;
        if (!event) {
          return res.status(400).json({ error: 'No event in payload' });
        }

        const actionType = this.getActionTypeFromEvent(event);

        if (!actionType) {
          return res.status(200).json({ message: 'Event type not supported' });
        }

        if (actionType === 'slack.new_dm') {
          const isRecipient = await this.isUserRecipientOfDM(event, userToken);
          if (!isRecipient) {
            return res
              .status(200)
              .json({ message: 'DM not for this user - ignored' });
          }
        }

        const webhookEvent = new WebhookEvents();
        webhookEvent.action_type = actionType;
        webhookEvent.user_id = userId;
        webhookEvent.source = 'slack';
        webhookEvent.external_id = req.body.event_id || `slack_${Date.now()}`;
        webhookEvent.payload = req.body;
        webhookEvent.status = 'received';
        webhookEvent.user_agent = req.get('User-Agent') || null;
        webhookEvent.signature_verified =
          !!process.env.SERVICE_SLACK_SIGNING_SECRET;

        await AppDataSource.getRepository(WebhookEvents).save(webhookEvent);

        return res
          .status(200)
          .json({ message: 'Event processed successfully' });
      }

      return res.status(200).json({ message: 'Unknown payload type' });
    } catch (error) {
      console.error('Error processing Slack webhook:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  private getActionTypeFromEvent(
    event: Record<string, unknown>
  ): string | null {
    switch (event.type) {
      case 'message':
        if (
          event.channel_type === 'channel' ||
          event.channel_type === 'group'
        ) {
          return 'slack.new_message';
        } else if (event.channel_type === 'im') {
          return 'slack.new_dm';
        }
        break;
      case 'channel_created':
        return 'slack.channel_created';
      case 'reaction_added':
        return 'slack.reaction_added';
    }
    return null;
  }

  private async findUserBySlackTeam(teamId: string): Promise<UserToken | null> {
    const tokenRepository = AppDataSource.getRepository(UserToken);
    const apiBaseUrl =
      process.env.SERVICE_SLACK_API_BASE_URL || 'https://slack.com/api';

    const slackTokens = await tokenRepository.find({
      where: {
        token_type: 'slack_access_token',
        is_revoked: false,
      },
    });

    for (const token of slackTokens) {
      try {
        const authResponse = await fetch(`${apiBaseUrl}/auth.test`, {
          headers: {
            Authorization: `Bearer ${token.token_value}`,
            'Content-Type': 'application/json',
          },
        });

        if (authResponse.ok) {
          const authData = (await authResponse.json()) as {
            ok: boolean;
            team_id: string;
            error?: string;
          };

          if (authData.ok && authData.team_id === teamId) {
            return token;
          }
        }
      } catch {}
    }

    return null;
  }

  private async isUserRecipientOfDM(
    event: Record<string, unknown>,
    userToken: UserToken
  ): Promise<boolean> {
    try {
      const channelId = event.channel as string;
      const senderId = event.user as string;
      const apiBaseUrl =
        process.env.SERVICE_SLACK_API_BASE_URL || 'https://slack.com/api';

      const userAccessToken = await this.getUserAccessToken(userToken.user_id);
      const tokenToUse = userAccessToken?.token_value || userToken.token_value;

      const response = await fetch(
        `${apiBaseUrl}/conversations.members?channel=${channelId}`,
        {
          headers: {
            Authorization: `Bearer ${tokenToUse}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        return false;
      }

      const data = (await response.json()) as {
        ok: boolean;
        members?: string[];
        error?: string;
      };

      if (!data.ok || !data.members) {
        return false;
      }

      if (data.members.length !== 2 && data.members.length !== 1) {
        return false;
      }

      let recipientId: string | undefined;

      if (data.members.length === 2) {
        recipientId = data.members.find(member => member !== senderId);
      } else if (data.members.length === 1) {
        recipientId = data.members[0];
      }

      if (!recipientId) {
        return false;
      }

      const authResponse = await fetch(`${apiBaseUrl}/auth.test`, {
        headers: {
          Authorization: `Bearer ${tokenToUse}`,
          'Content-Type': 'application/json',
        },
      });

      if (!authResponse.ok) {
        return false;
      }

      const authData = (await authResponse.json()) as {
        ok: boolean;
        user_id: string;
        error?: string;
      };

      if (!authData.ok || !authData.user_id) {
        return false;
      }

      const currentUserSlackId = authData.user_id;
      const isRecipient = currentUserSlackId === recipientId;

      return isRecipient;
    } catch {
      return false;
    }
  }

  private async getUserAccessToken(userId: number): Promise<UserToken | null> {
    try {
      const tokenRepository = AppDataSource.getRepository(UserToken);
      const userToken = await tokenRepository.findOne({
        where: {
          user_id: userId,
          token_type: 'user_access_token',
        },
      });

      return userToken || null;
    } catch {
      return null;
    }
  }
}

export default new SlackWebhookHandler();
