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
  emoji: string;
}

interface SendDMConfig {
  userId: string;
  message: string;
}

interface PinMessageConfig {
  channel: string;
}

export class SlackReactionExecutor implements ReactionExecutor {
  public async resolveChannelId(
    accessToken: string,
    channelInput: string
  ): Promise<string> {
    if (/^[CGD][A-Z0-9]+$/.test(channelInput)) {
      return channelInput;
    }

    const channelName = channelInput.startsWith('#')
      ? channelInput.substring(1)
      : channelInput;

    const listResponse = await fetch(
      `${slackOAuth['slackApiBaseUrl']}/conversations.list?types=public_channel,private_channel&limit=200`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!listResponse.ok) {
      const errorData = (await listResponse.json()) as SlackApiResponse;
      throw new Error(`Failed to list channels: ${errorData.error}`);
    }

    const listData = (await listResponse.json()) as {
      channels?: Array<{ id: string; name: string }>;
    };
    const channel = listData.channels?.find(ch => ch.name === channelName);

    if (!channel) {
      throw new Error(`Channel '${channelInput}' not found or not accessible`);
    }

    return channel.id;
  }
  async execute(
    context: ReactionExecutionContext
  ): Promise<ReactionExecutionResult> {
    const { reaction, mapping } = context;
    const userId = mapping.created_by;

    try {
      let userToken = await slackOAuth.getUserAccessToken(userId);

      if (!userToken) {
        userToken = await slackOAuth.getUserToken(userId);
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
      }

      const accessToken = userToken.token_value;
      const isUserToken = userToken.token_type.startsWith(
        'slack_user_access_token_user_'
      );

      switch (reaction.type) {
        case 'slack.send_message':
          return await this.sendMessage(
            accessToken,
            reaction.config as unknown as SendMessageConfig,
            isUserToken
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
          await createLog(
            400,
            'other',
            `Unknown Slack reaction type: ${reaction.type}`
          );
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
    config: SendMessageConfig,
    isUserToken: boolean = false
  ): Promise<ReactionExecutionResult> {
    const { channel, message } = config;

    const webhookResult = await slackOAuth.createIncomingWebhook(
      accessToken,
      channel
    );
    if (!webhookResult.ok) {
      throw new Error(
        `Cannot access channel ${channel}: ${webhookResult.error}`
      );
    }

    const requestBody: Record<string, unknown> = {
      channel: channel,
      text: message,
    };

    if (!isUserToken) {
      requestBody.as_user = true;
    }

    const response = await fetch(
      `${slackOAuth['slackApiBaseUrl']}/chat.postMessage`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      let errorData;
      try {
        errorData = JSON.parse(errorText) as SlackApiResponse;
      } catch {
        errorData = { error: errorText };
      }
      throw new Error(
        `Failed to send message: ${errorData.error || 'Unknown error'}`
      );
    }

    const responseText = await response.text();

    let data;
    try {
      data = JSON.parse(responseText) as SlackApiResponse;
    } catch {
      data = { ts: 'unknown', channel: channel };
    }

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
    const { channel, emoji } = config;

    const channelId = await this.resolveChannelId(accessToken, channel);

    const historyResponse = await fetch(
      `${slackOAuth['slackApiBaseUrl']}/conversations.history?channel=${channelId}&limit=1`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const historyData = (await historyResponse.json()) as {
      ok: boolean;
      messages: Array<{ ts: string; text: string; subtype?: string }>;
      error?: string;
    };

    if (!historyResponse.ok) {
      throw new Error(
        `Failed to get channel history: HTTP ${historyResponse.status}`
      );
    }

    if (!historyData.ok) {
      throw new Error(
        `Failed to get channel history: ${historyData.error || 'Unknown error'}`
      );
    }

    if (!historyData.messages || historyData.messages.length === 0) {
      throw new Error('No messages found in channel');
    }

    const lastMessage = historyData.messages[0];
    if (!lastMessage) {
      throw new Error('No messages found in channel');
    }

    const messageId = lastMessage.ts;

    const response = await fetch(
      `${slackOAuth['slackApiBaseUrl']}/reactions.add`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          channel: channelId,
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
      `Reaction ${emoji} added to last message in channel ${channel}`
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
    const { userId: targetUserId, message } = config;

    const imResponse = await fetch(
      `${slackOAuth['slackApiBaseUrl']}/conversations.open`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          users: targetUserId,
        }),
      }
    );

    if (!imResponse.ok) {
      const errorData = (await imResponse.json()) as SlackApiResponse;
      throw new Error(`Failed to open DM: ${errorData.error}`);
    }

    const imData = (await imResponse.json()) as SlackImOpenResponse;

    if (!imData.channel || !imData.channel.id) {
      throw new Error('Failed to open DM: Invalid channel data returned');
    }

    const channelId = imData.channel.id;
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

    await createLog(200, 'other', `DM sent to user ${targetUserId}`);

    return {
      success: true,
      output: {
        success: true,
        channel: channelId,
        messageId: messageData.ts,
        userId: targetUserId,
      },
    };
  }

  private async pinMessage(
    accessToken: string,
    config: PinMessageConfig
  ): Promise<ReactionExecutionResult> {
    const { channel } = config;

    const channelId = await this.resolveChannelId(accessToken, channel);

    const historyResponse = await fetch(
      `${slackOAuth['slackApiBaseUrl']}/conversations.history?channel=${channelId}&limit=10`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const historyData = (await historyResponse.json()) as {
      ok: boolean;
      messages: Array<{ ts: string; text: string; subtype?: string }>;
      error?: string;
    };

    if (!historyResponse.ok) {
      throw new Error(
        `Failed to get channel history: HTTP ${historyResponse.status}`
      );
    }

    if (!historyData.ok) {
      throw new Error(
        `Failed to get channel history: ${historyData.error || 'Unknown error'}`
      );
    }

    if (!historyData.messages || historyData.messages.length === 0) {
      throw new Error('No messages found in channel');
    }

    const pinnableMessage = historyData.messages.find(
      msg => !msg.subtype || msg.subtype !== 'bot_add'
    );
    if (!pinnableMessage) {
      throw new Error(
        'No pinnable messages found in channel (only system messages)'
      );
    }

    const messageId = pinnableMessage.ts;

    const response = await fetch(`${slackOAuth['slackApiBaseUrl']}/pins.add`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        channel: channelId,
        timestamp: messageId,
      }),
    });

    const pinData = (await response.json()) as { ok: boolean; error?: string };

    if (!response.ok) {
      throw new Error(`Failed to pin message: HTTP ${response.status}`);
    }

    if (!pinData.ok) {
      throw new Error(`Failed to pin message: ${pinData.error}`);
    }

    await createLog(200, 'other', `Last message pinned in channel ${channel}`);

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
