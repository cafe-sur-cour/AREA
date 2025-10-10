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
            reaction.config as unknown as AddReactionConfig,
            isUserToken
          );

        case 'slack.send_dm':
          return await this.sendDM(
            accessToken,
            reaction.config as unknown as SendDMConfig,
            isUserToken
          );

        case 'slack.pin_message':
          return await this.pinMessage(
            accessToken,
            reaction.config as unknown as PinMessageConfig,
            isUserToken
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
    config: AddReactionConfig,
    isUserToken: boolean = false
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
    config: SendDMConfig,
    isUserToken: boolean = false
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
    config: PinMessageConfig,
    isUserToken: boolean = false
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
