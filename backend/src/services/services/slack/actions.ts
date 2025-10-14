import type { ActionDefinition } from '../../../types/service';
import {
  slackNewMessageSchema,
  slackNewDMSchema,
  slackChannelCreatedSchema,
  slackReactionAddedSchema,
} from '../slack/schemas';
import { AppDataSource } from '../../../config/db';
import { UserToken } from '../../../config/entity/UserToken';

// Helper function to get channel ID from name
async function getChannelIdFromName(
  channelName: string,
  userId: number
): Promise<string | null> {
  try {
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
      return null;
    }

    const decryptedToken = decryptToken(userToken.token_value, userId);

    const apiBaseUrl =
      process.env.SERVICE_SLACK_API_BASE_URL || 'https://slack.com/api';

    const cleanChannelName = channelName.startsWith('#')
      ? channelName.slice(1)
      : channelName;

    console.log(
      `🔍 [SLACK FILTER] Looking up channel ID for "${cleanChannelName}"`
    );

    const response = await fetch(
      `${apiBaseUrl}/conversations.list?types=public_channel,private_channel&limit=1000`,
      {
        headers: {
          Authorization: `Bearer ${decryptedToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      console.log(
        `❌ [SLACK FILTER] Failed to list channels: ${response.status}`
      );
      return null;
    }

    const data = (await response.json()) as {
      ok: boolean;
      channels?: Array<{ id: string; name: string }>;
      error?: string;
    };

    if (!data.ok || !data.channels) {
      console.log(`❌ [SLACK FILTER] API error: ${data.error}`);
      return null;
    }

    const channel = data.channels.find(ch => ch.name === cleanChannelName);
    if (channel) {
      console.log(
        `✅ [SLACK FILTER] Found channel "${cleanChannelName}" → ${channel.id}`
      );
      return channel.id;
    }

    console.log(`❌ [SLACK FILTER] Channel "${cleanChannelName}" not found`);
    return null;
  } catch (error) {
    console.error('❌ [SLACK FILTER] Error getting channel ID:', error);
    return null;
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
        const eventData = event.payload as {
          channel?: string;
          channel_type?: string;
        };
        if (!eventData.channel) return false;

        const mappingChannel = mapping.action.config?.channel as string;
        if (!mappingChannel) return true;

        if (!mappingChannel.startsWith('#')) {
          return eventData.channel === mappingChannel;
        }

        if (!userId) {
          return false;
        }

        try {
          const channelId = await getChannelIdFromName(mappingChannel, userId);
          if (!channelId) {
            console.log(
              `❌ [SLACK FILTER] Could not resolve channel name "${mappingChannel}"`
            );
            return false;
          }
          return eventData.channel === channelId;
        } catch (error) {
          console.error(
            '❌ [SLACK FILTER] Error in channel name resolution:',
            error
          );
          return false;
        }
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
        const eventData = event.payload as { channel?: { creator?: string } };

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
        const eventData = event.payload as {
          item?: { channel?: string };
          reaction?: string;
        };

        const mappingChannel = mapping.action.config?.channel as string;
        if (mappingChannel) {
          if (!eventData.item?.channel) return false;

          if (mappingChannel.startsWith('#')) {
            if (!userId) {
              return false;
            }

            try {
              const channelId = await getChannelIdFromName(
                mappingChannel,
                userId
              );
              if (!channelId) {
                console.log(
                  `❌ [SLACK FILTER] Could not resolve channel name "${mappingChannel}"`
                );
                return false;
              }
              if (eventData.item.channel !== channelId) {
                return false;
              }
            } catch (error) {
              console.error(
                '❌ [SLACK FILTER] Error in channel name resolution:',
                error
              );
              return false;
            }
          } else {
            if (eventData.item.channel !== mappingChannel) {
              return false;
            }
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
