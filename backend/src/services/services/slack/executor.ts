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
  private async resolveChannelId(accessToken: string, channelInput: string): Promise<string> {
    // If it's already an ID (starts with C, G, D, etc.), return as-is
    if (/^[CGD][A-Z0-9]+$/.test(channelInput)) {
      return channelInput;
    }

    // Remove # prefix if present
    const channelName = channelInput.startsWith('#') ? channelInput.substring(1) : channelInput;

    // Try to find the channel by name
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
      const errorData = await listResponse.json() as SlackApiResponse;
      throw new Error(`Failed to list channels: ${errorData.error}`);
    }

    const listData = await listResponse.json() as { channels?: Array<{ id: string; name: string }> };
    const channel = listData.channels?.find((ch) => ch.name === channelName);

    if (!channel) {
      throw new Error(`Channel '${channelInput}' not found or not accessible`);
    }

    return channel.id;
  }
  async execute(
    context: ReactionExecutionContext
  ): Promise<ReactionExecutionResult> {
    const { reaction, event } = context;
    const userId = event.user_id;

    console.log('🔵 SLACK DEBUG: execute() called with reaction:', reaction.type);
    console.log('🔵 SLACK DEBUG: execute() userId:', userId);
    console.log('🔵 SLACK DEBUG: execute() reaction config:', reaction.config);

    try {
      // Try user token first (preferred - messages come directly from user)
      let userToken = await slackOAuth.getUserAccessToken(userId);

      if (!userToken) {
        console.log('🔵 SLACK DEBUG: No user token found, trying bot token with as_user');
        // Fallback to bot token with as_user: true
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
      const isUserToken = userToken.token_type === 'slack_user_access_token';
      console.log(`🔵 SLACK DEBUG: Using ${isUserToken ? 'user' : 'bot'} token for posting`);

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
          await createLog(400, 'other', `Unknown Slack reaction type: ${reaction.type}`);
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

    console.log('🔵 SLACK DEBUG: sendMessage called with config:', { channel, message });
    console.log('🔵 SLACK DEBUG: Access token starts with:', accessToken.substring(0, 10) + '...');
    console.log('🔵 SLACK DEBUG: Using', isUserToken ? 'user token' : 'bot token');

    // First, ensure we can access the channel
    const webhookResult = await slackOAuth.createIncomingWebhook(accessToken, channel);
    if (!webhookResult.ok) {
      console.log('🔴 SLACK DEBUG: Cannot access channel:', webhookResult.error);
      throw new Error(`Cannot access channel ${channel}: ${webhookResult.error}`);
    }

    console.log('✅ SLACK DEBUG: Can access channel, proceeding with message...');

    const requestBody: Record<string, unknown> = {
      channel: channel,
      text: message,
    };

    // Only use as_user: true with bot tokens
    if (!isUserToken) {
      requestBody.as_user = true;
    }

    console.log('🔵 SLACK DEBUG: Request body:', requestBody);
    console.log('🔵 SLACK DEBUG: API URL:', `${slackOAuth['slackApiBaseUrl']}/chat.postMessage`);

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

    console.log('🔵 SLACK DEBUG: HTTP Response status:', response.status);
    console.log('🔵 SLACK DEBUG: HTTP Response headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorText = await response.text();
      console.log('🔴 SLACK DEBUG: Error response body:', errorText);
      let errorData;
      try {
        errorData = JSON.parse(errorText) as SlackApiResponse;
      } catch (parseError) { // eslint-disable-line @typescript-eslint/no-unused-vars
        console.log('🔴 SLACK DEBUG: Failed to parse error response as JSON');
        errorData = { error: errorText };
      }
      throw new Error(`Failed to send message: ${errorData.error || 'Unknown error'}`);
    }

    const responseText = await response.text();
    console.log('🔵 SLACK DEBUG: Success response body:', responseText);

    let data;
    try {
      data = JSON.parse(responseText) as SlackApiResponse;
    } catch (parseError) { // eslint-disable-line @typescript-eslint/no-unused-vars
      console.log('🔴 SLACK DEBUG: Failed to parse success response as JSON');
      data = { ts: 'unknown', channel: channel };
    }

    console.log('✅ SLACK DEBUG: Message sent successfully:', {
      messageId: data.ts,
      channel: data.channel,
      ok: data.ok
    });

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

    console.log('🔵 SLACK DEBUG: addReaction called with config:', { channel, emoji });

    // Resolve channel name to ID for history API
    const channelId = await this.resolveChannelId(accessToken, channel);
    console.log('🔵 SLACK DEBUG: Resolved channel:', channel, '->', channelId);

    // First, get the last message from the channel
    const historyResponse = await fetch(
      `${slackOAuth['slackApiBaseUrl']}/conversations.history?channel=${channelId}&limit=1`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    console.log('🔵 SLACK DEBUG: History API response status:', historyResponse.status);

    if (!historyResponse.ok) {
      const errorData = (await historyResponse.json()) as SlackApiResponse;
      console.log('🔴 SLACK DEBUG: History API error:', errorData);
      throw new Error(`Failed to get channel history: ${errorData.error}`);
    }

    const historyData = (await historyResponse.json()) as { ok: boolean; messages: Array<{ ts: string; text: string }> };
    console.log('🔵 SLACK DEBUG: History API response:', {
      ok: historyData.ok,
      messagesCount: historyData.messages?.length || 0,
      messages: historyData.messages
    });

    if (!historyData.ok || !historyData.messages || historyData.messages.length === 0) {
      console.log('🔴 SLACK DEBUG: No messages in history response');
      throw new Error('No messages found in channel');
    }

    const lastMessage = historyData.messages[0];
    if (!lastMessage) {
      throw new Error('No messages found in channel');
    }

    const messageId = lastMessage.ts;

    console.log('🔵 SLACK DEBUG: Found last message:', { messageId, text: lastMessage.text });

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
    const { channel } = config;

    console.log('🔵 SLACK DEBUG: pinMessage called with config:', { channel });

    // Resolve channel name to ID for history API
    const channelId = await this.resolveChannelId(accessToken, channel);
    console.log('🔵 SLACK DEBUG: Resolved channel:', channel, '->', channelId);

    // First, get the last message from the channel
    const historyResponse = await fetch(
      `${slackOAuth['slackApiBaseUrl']}/conversations.history?channel=${channelId}&limit=1`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    console.log('🔵 SLACK DEBUG: History API response status:', historyResponse.status);

    if (!historyResponse.ok) {
      const errorData = (await historyResponse.json()) as SlackApiResponse;
      console.log('🔴 SLACK DEBUG: History API error:', errorData);
      throw new Error(`Failed to get channel history: ${errorData.error}`);
    }

    const historyData = (await historyResponse.json()) as { ok: boolean; messages: Array<{ ts: string; text: string }> };
    console.log('🔵 SLACK DEBUG: History API response:', {
      ok: historyData.ok,
      messagesCount: historyData.messages?.length || 0,
      messages: historyData.messages
    });

    if (!historyData.ok || !historyData.messages || historyData.messages.length === 0) {
      console.log('🔴 SLACK DEBUG: No messages in history response');
      throw new Error('No messages found in channel');
    }

    const lastMessage = historyData.messages[0];
    if (!lastMessage) {
      throw new Error('No messages found in channel');
    }

    const messageId = lastMessage.ts;

    console.log('🔵 SLACK DEBUG: Found last message to pin:', { messageId, text: lastMessage.text });

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

    if (!response.ok) {
      const errorData = (await response.json()) as SlackApiResponse;
      throw new Error(`Failed to pin message: ${errorData.error}`);
    }

    await createLog(
      200,
      'other',
      `Last message pinned in channel ${channel}`
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
