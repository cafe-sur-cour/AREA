import type {
  ReactionExecutor,
  ReactionExecutionContext,
  ReactionExecutionResult,
} from '../../../types/service';
import fetch from 'node-fetch';
import { slackOAuth } from './oauth';
import { createLog } from '../../../routes/logs/logs.service';

interface SlackApiResponse {
  ok: boolean;
  error?: string;
  ts?: string;
  channel?: string;
}

interface SlackImOpenResponse {
  ok: boolean;
  error?: string;
  channel: {
    id: string;
  };
}

interface SendMessageConfig {
  channel: string;
  message: string;
}

interface AddReactionConfig {
  channel: string;
  messageId: string;
  emoji: string;
}

interface SendDMConfig {
  userId: string;
  message: string;
}

interface PinMessageConfig {
  channel: string;
  messageId: string;
}

export class SlackReactionExecutor implements ReactionExecutor {
  async execute(
    context: ReactionExecutionContext
  ): Promise<ReactionExecutionResult> {
    const { reaction, event } = context;
    const userId = event.user_id;

    try {
      // Get user token
      const userToken = await slackOAuth.getUserToken(userId);
      if (!userToken) {
        await createLog(
          401,
          'other',
          `No Slack token found for user ${userId}`
        );
        return {
          success: false,
          error: 'User not authenticated with Slack',
        };
      }

      const accessToken = userToken.token_value;

      switch (reaction.type) {
        case 'slack.send_message':
          return await this.sendMessage(
            accessToken,
            reaction.config as unknown as SendMessageConfig
          );

        case 'slack.add_reaction':
          return await this.addReaction(
            accessToken,
            reaction.config as unknown as AddReactionConfig
          );

        case 'slack.send_dm':
          return await this.sendDM(
            accessToken,
            reaction.config as unknown as SendDMConfig
          );

        case 'slack.pin_message':
          return await this.pinMessage(
            accessToken,
            reaction.config as unknown as PinMessageConfig
          );

        default:
          return {
            success: false,
            error: `Unknown Slack reaction type: ${reaction.type}`,
          };
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      await createLog(
        500,
        'other',
        `Slack reaction execution failed: ${errorMessage}`
      );
      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  private async sendMessage(
    accessToken: string,
    config: SendMessageConfig
  ): Promise<ReactionExecutionResult> {
    const { channel, message } = config;

    const response = await fetch(
      `${slackOAuth['slackApiBaseUrl']}/chat.postMessage`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          channel: channel,
          text: message,
        }),
      }
    );

    if (!response.ok) {
      const errorData = (await response.json()) as SlackApiResponse;
      throw new Error(`Failed to send message: ${errorData.error}`);
    }

    const data = (await response.json()) as SlackApiResponse;

    await createLog(200, 'other', `Message sent to channel ${channel}`);

    return {
      success: true,
      output: {
        success: true,
        messageId: data.ts,
        channel: data.channel,
        timestamp: data.ts,
      },
    };
  }

  private async addReaction(
    accessToken: string,
    config: AddReactionConfig
  ): Promise<ReactionExecutionResult> {
    const { channel, messageId, emoji } = config;

    const response = await fetch(
      `${slackOAuth['slackApiBaseUrl']}/reactions.add`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          channel: channel,
          timestamp: messageId,
          name: emoji,
        }),
      }
    );

    if (!response.ok) {
      const errorData = (await response.json()) as SlackApiResponse;
      throw new Error(`Failed to add reaction: ${errorData.error}`);
    }

    await createLog(
      200,
      'other',
      `Reaction ${emoji} added to message ${messageId} in channel ${channel}`
    );

    return {
      success: true,
      output: {
        success: true,
        channel: channel,
        messageId: messageId,
        emoji: emoji,
      },
    };
  }

  private async sendDM(
    accessToken: string,
    config: SendDMConfig
  ): Promise<ReactionExecutionResult> {
    const { userId, message } = config;

    // First, open a DM channel with the user
    const imResponse = await fetch(`${slackOAuth['slackApiBaseUrl']}/im.open`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user: userId,
      }),
    });

    if (!imResponse.ok) {
      const errorData = (await imResponse.json()) as SlackApiResponse;
      throw new Error(`Failed to open DM: ${errorData.error}`);
    }

    const imData = (await imResponse.json()) as SlackImOpenResponse;
    const channelId = imData.channel.id;

    // Now send the message
    const messageResponse = await fetch(
      `${slackOAuth['slackApiBaseUrl']}/chat.postMessage`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          channel: channelId,
          text: message,
        }),
      }
    );

    if (!messageResponse.ok) {
      const errorData = (await messageResponse.json()) as SlackApiResponse;
      throw new Error(`Failed to send DM: ${errorData.error}`);
    }

    const messageData = (await messageResponse.json()) as SlackApiResponse;

    await createLog(200, 'other', `DM sent to user ${userId}`);

    return {
      success: true,
      output: {
        success: true,
        channel: channelId,
        messageId: messageData.ts,
        userId: userId,
      },
    };
  }

  private async pinMessage(
    accessToken: string,
    config: PinMessageConfig
  ): Promise<ReactionExecutionResult> {
    const { channel, messageId } = config;

    const response = await fetch(`${slackOAuth['slackApiBaseUrl']}/pins.add`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        channel: channel,
        timestamp: messageId,
      }),
    });

    if (!response.ok) {
      const errorData = (await response.json()) as SlackApiResponse;
      throw new Error(`Failed to pin message: ${errorData.error}`);
    }

    await createLog(
      200,
      'other',
      `Message ${messageId} pinned in channel ${channel}`
    );

    return {
      success: true,
      output: {
        success: true,
        channel: channel,
        messageId: messageId,
      },
    };
  }
}

export const slackReactionExecutor = new SlackReactionExecutor();
