import type { ActionDefinition } from '../../../types/service';
import {
  slackNewMessageSchema,
  slackNewDMSchema,
  slackChannelCreatedSchema,
  slackReactionAddedSchema,
} from '../slack/schemas';
import { AppDataSource } from '../../../config/db';
import { UserToken } from '../../../config/entity/UserToken';
import { slackReactionExecutor } from './executor';

async function resolveChannelId(
  channelInput: string,
  userId: number
): Promise<string> {
  try {
    console.log(
      `🔍 [SLACK FILTER] Resolving channel "${channelInput}" for user ${userId}`
    );

    const tokenRepository = AppDataSource.getRepository(UserToken);
    const userToken = await tokenRepository.findOne({
      where: {
        user_id: userId,
        token_type: 'slack_access_token',
        is_revoked: false,
      },
    });

    if (!userToken) {
      console.log(`❌ [SLACK FILTER] No token found for user ${userId}`);
      return channelInput;
    }

    console.log(
      `✅ [SLACK FILTER] Found token for user ${userId}, decrypting...`
    );

    const decryptedToken = decryptToken(userToken.token_value, userId);

    console.log(
      `🔄 [SLACK FILTER] Calling slackReactionExecutor.resolveChannelId...`
    );

    const resolvedId = await slackReactionExecutor.resolveChannelId(
      decryptedToken,
      channelInput
    );

    console.log(
      `✅ [SLACK FILTER] Channel "${channelInput}" resolved to "${resolvedId}"`
    );

    return resolvedId;
  } catch (error) {
    console.error('❌ [SLACK FILTER] Error resolving channel ID:', error);
    return channelInput;
  }
}

function decryptToken(encryptedToken: string, userId: number): string {
  try {
    const decoded = Buffer.from(encryptedToken, 'base64').toString('utf-8');
    const parts = decoded.split(':::');
    if (parts.length !== 2 || !parts[0] || !parts[1]) {
      throw new Error('Invalid encrypted token format');
    }
    const [token, tokenUserId] = parts;
    if (parseInt(tokenUserId) !== userId) {
      throw new Error('Token user ID mismatch');
    }
    return token;
  } catch (error) {
    console.error('Error decrypting token:', error);
    throw error;
  }
}

// Slack actions
export const slackActions: ActionDefinition[] = [
  {
    id: 'slack.new_message',
    name: 'New Message in Channel',
    description: 'Triggers when a new message is posted in a specific channel',
    configSchema: slackNewMessageSchema,
    inputSchema: {
      type: 'object',
      properties: {
        type: { type: 'string', description: 'Event type (message)' },
        channel: {
          type: 'string',
          description: 'Channel ID where message was posted',
        },
        user: { type: 'string', description: 'User ID who sent the message' },
        text: { type: 'string', description: 'Message text content' },
        ts: { type: 'string', description: 'Message timestamp' },
        channel_type: {
          type: 'string',
          description: 'Type of channel (channel, group, im)',
        },
        event_ts: { type: 'string', description: 'Event timestamp' },
        team: { type: 'string', description: 'Team/workspace ID' },
      },
      required: ['type', 'channel', 'user', 'text', 'ts'],
    },
    metadata: {
      category: 'Slack',
      tags: ['message', 'channel', 'communication'],
      requiresAuth: true,
      webhookPattern: 'message.channels',
      sharedEvents: true,
      sharedEventFilter: async (event, mapping, userId) => {
        console.log(`🔍 [SLACK FILTER] ===== STARTING FILTER =====`);
        console.log(
          `🔍 [SLACK FILTER] Event payload:`,
          JSON.stringify(event.payload, null, 2)
        );

        const slackEvent = (
          event.payload as {
            event?: { channel?: string; channel_type?: string };
          }
        )?.event;
        const eventData = {
          channel: slackEvent?.channel,
          channel_type: slackEvent?.channel_type,
        };

        console.log(
          `🔍 [SLACK FILTER] Extracted event channel: "${eventData.channel}"`
        );
        console.log(
          `🔍 [SLACK FILTER] Extracted event channel_type: "${eventData.channel_type}"`
        );

        if (!eventData.channel) {
          console.log(`🔍 [SLACK FILTER] No channel in event, returning false`);
          return false;
        }

        const mappingChannel = mapping.action.config?.channel as string;
        console.log(
          `🔍 [SLACK FILTER] Mapping channel config: "${mappingChannel}"`
        );

        if (!mappingChannel) {
          console.log(
            `🔍 [SLACK FILTER] No channel in mapping config, returning true`
          );
          return true;
        }

        console.log(
          `🔍 [SLACK FILTER] Calling resolveChannelId for user ${userId}...`
        );
        const resolvedMappingChannel = userId
          ? await resolveChannelId(mappingChannel, userId)
          : mappingChannel;

        console.log(
          `🔍 [SLACK FILTER] Resolved mapping channel: "${resolvedMappingChannel}"`
        );
        console.log(`🔍 [SLACK FILTER] Event channel: "${eventData.channel}"`);
        console.log(
          `🔍 [SLACK FILTER] Match result: ${eventData.channel === resolvedMappingChannel}`
        );

        return eventData.channel === resolvedMappingChannel;
      },
    },
  },
  {
    id: 'slack.new_dm',
    name: 'New Direct Message',
    description: 'Triggers when the user receives a new private message',
    configSchema: slackNewDMSchema,
    inputSchema: {
      type: 'object',
      properties: {
        type: { type: 'string', description: 'Event type (message)' },
        channel: { type: 'string', description: 'DM channel ID' },
        user: { type: 'string', description: 'User ID who sent the message' },
        text: { type: 'string', description: 'Message text content' },
        ts: { type: 'string', description: 'Message timestamp' },
        channel_type: { type: 'string', description: 'Type of channel (im)' },
        event_ts: { type: 'string', description: 'Event timestamp' },
        team: { type: 'string', description: 'Team/workspace ID' },
      },
      required: ['type', 'channel', 'user', 'text', 'ts'],
    },
    metadata: {
      category: 'Slack',
      tags: ['message', 'dm', 'direct', 'communication'],
      requiresAuth: true,
      webhookPattern: 'message.im',
      sharedEvents: false,
    },
  },
  {
    id: 'slack.channel_created',
    name: 'Channel Created',
    description: 'Triggers when a new channel is created in the workspace',
    configSchema: slackChannelCreatedSchema,
    inputSchema: {
      type: 'object',
      properties: {
        type: { type: 'string', description: 'Event type (channel_created)' },
        channel: {
          type: 'object',
          description: 'Channel information',
          properties: {
            id: { type: 'string', description: 'Channel ID' },
            name: { type: 'string', description: 'Channel name' },
            created: { type: 'number', description: 'Creation timestamp' },
            creator: {
              type: 'string',
              description: 'User ID who created the channel',
            },
          },
        },
        event_ts: { type: 'string', description: 'Event timestamp' },
        team: { type: 'string', description: 'Team/workspace ID' },
      },
      required: ['type', 'channel', 'event_ts'],
    },
    metadata: {
      category: 'Slack',
      tags: ['channel', 'creation', 'organization'],
      requiresAuth: true,
      webhookPattern: 'channel_created',
      sharedEvents: true,
      sharedEventFilter: (event, mapping) => {
        const slackEvent = (
          event.payload as { event?: { channel?: { creator?: string } } }
        )?.event;
        const eventData = {
          channel: slackEvent?.channel,
        };

        const mappingCreator = mapping.action.config?.channel as string;
        if (!mappingCreator) return true;

        return eventData.channel?.creator === mappingCreator;
      },
    },
  },
  {
    id: 'slack.reaction_added',
    name: 'Reaction Added to Message',
    description: 'Triggers when someone adds a reaction (emoji) to a message',
    configSchema: slackReactionAddedSchema,
    inputSchema: {
      type: 'object',
      properties: {
        type: { type: 'string', description: 'Event type (reaction_added)' },
        user: { type: 'string', description: 'User ID who added the reaction' },
        reaction: { type: 'string', description: 'Reaction emoji name' },
        item: {
          type: 'object',
          description: 'Item that was reacted to',
          properties: {
            type: { type: 'string', description: 'Type of item (message)' },
            channel: { type: 'string', description: 'Channel ID' },
            ts: { type: 'string', description: 'Message timestamp' },
          },
        },
        event_ts: { type: 'string', description: 'Event timestamp' },
        team: { type: 'string', description: 'Team/workspace ID' },
      },
      required: ['type', 'user', 'reaction', 'item'],
    },
    metadata: {
      category: 'Slack',
      tags: ['reaction', 'emoji', 'interaction'],
      requiresAuth: true,
      webhookPattern: 'reaction_added',
      sharedEvents: true,
      sharedEventFilter: async (event, mapping, userId) => {
        const slackEvent = (
          event.payload as {
            event?: { item?: { channel?: string }; reaction?: string };
          }
        )?.event;
        const eventData = {
          item: slackEvent?.item,
          reaction: slackEvent?.reaction,
        };

        const mappingChannel = mapping.action.config?.channel as string;
        if (mappingChannel) {
          if (!eventData.item?.channel) return false;

          const resolvedMappingChannel = userId
            ? await resolveChannelId(mappingChannel, userId)
            : mappingChannel;

          if (eventData.item.channel !== resolvedMappingChannel) {
            return false;
          }
        }

        const mappingEmoji = mapping.action.config?.emoji as string;
        if (
          mappingEmoji &&
          eventData.reaction !== mappingEmoji.replace(/:/g, '')
        ) {
          return false;
        }

        return true;
      },
    },
  },
];
