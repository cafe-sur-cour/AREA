import type { ActionDefinition } from '../../../types/service';
import {
  slackNewMessageSchema,
  slackNewDMSchema,
  slackChannelCreatedSchema,
  slackReactionAddedSchema,
} from '../slack/schemas';

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
      sharedEventFilter: (event, mapping) => {
        const eventData = event.payload as {
          channel?: string;
          channel_type?: string;
        };
        if (!eventData.channel) return false;

        const mappingChannel = mapping.action.config?.channel as string;
        if (!mappingChannel) return true; // No filter means all channels

        // Check if channel matches (by ID or name)
        return eventData.channel === mappingChannel;
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
      sharedEvents: false, // DMs are user-specific
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
        // For channel creation, we can filter by creator if needed
        const eventData = event.payload as { channel?: { creator?: string } };

        const mappingCreator = mapping.action.config?.channel as string; // Reuse channel field for creator filter
        if (!mappingCreator) return true; // No filter means all channel creations

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
      sharedEventFilter: (event, mapping) => {
        const eventData = event.payload as {
          item?: { channel?: string };
          reaction?: string;
        };

        // Check channel filter
        const mappingChannel = mapping.action.config?.channel as string;
        if (mappingChannel && eventData.item?.channel !== mappingChannel) {
          return false;
        }

        // Check emoji filter
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
