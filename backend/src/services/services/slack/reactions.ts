import type { ReactionDefinition } from '../../../types/service';

// Slack reactions
export const slackReactions: ReactionDefinition[] = [
  {
    id: 'slack.send_message',
    name: 'Send Message to Channel',
    description: 'Send a custom message to a specific Slack channel',
    configSchema: {
      name: 'Send Message Configuration',
      description: 'Configure which channel and message to send',
      fields: [
        {
          name: 'channel',
          type: 'text',
          label: 'Channel Name or ID',
          placeholder: '#general or C1234567890',
          required: true,
        },
        {
          name: 'message',
          type: 'textarea',
          label: 'Message Content',
          placeholder: 'Enter your message here...',
          required: true,
        },
      ],
    },
    outputSchema: {
      type: 'object',
      properties: {
        success: {
          type: 'boolean',
          description: 'Whether the message was sent successfully',
        },
        messageId: {
          type: 'string',
          description: 'The ID of the sent message',
        },
        channel: {
          type: 'string',
          description: 'The channel where the message was sent',
        },
        timestamp: {
          type: 'string',
          description: 'The timestamp of the sent message',
        },
      },
      required: ['success'],
    },
    metadata: {
      category: 'Communication',
      tags: ['message', 'channel', 'notification'],
      icon: '💬',
      color: '#4A154B',
      requiresAuth: true,
      estimatedDuration: 2,
    },
  },
  {
    id: 'slack.add_reaction',
    name: 'Add Reaction to Last Message',
    description: 'Add an emoji reaction to the last message in a channel',
    configSchema: {
      name: 'Add Reaction Configuration',
      description:
        'Configure which channel and emoji reaction to add to the last message',
      fields: [
        {
          name: 'channel',
          type: 'text',
          label: 'Channel Name or ID',
          placeholder: '#general or C1234567890',
          required: true,
        },
        {
          name: 'emoji',
          type: 'text',
          label: 'Emoji Name',
          placeholder: 'thumbsup, heart, smile, etc.',
          required: true,
        },
      ],
    },
    outputSchema: {
      type: 'object',
      properties: {
        success: {
          type: 'boolean',
          description: 'Whether the reaction was added successfully',
        },
        channel: {
          type: 'string',
          description: 'The channel where the reaction was added',
        },
        messageId: {
          type: 'string',
          description: 'The ID of the message that received the reaction',
        },
        emoji: {
          type: 'string',
          description: 'The emoji that was added as reaction',
        },
      },
      required: ['success'],
    },
    metadata: {
      category: 'Interaction',
      tags: ['reaction', 'emoji', 'message', 'last'],
      icon: '👍',
      color: '#4A154B',
      requiresAuth: true,
      estimatedDuration: 1,
    },
  },
  {
    id: 'slack.send_dm',
    name: 'Send Direct Message',
    description: 'Send a private direct message to a Slack user',
    configSchema: {
      name: 'Send DM Configuration',
      description: 'Configure which user and message to send',
      fields: [
        {
          name: 'userId',
          type: 'text',
          label: 'User ID',
          placeholder: 'U1234567890',
          required: true,
        },
        {
          name: 'message',
          type: 'textarea',
          label: 'Message Content',
          placeholder: 'Enter your private message here...',
          required: true,
        },
      ],
    },
    outputSchema: {
      type: 'object',
      properties: {
        success: {
          type: 'boolean',
          description: 'Whether the DM was sent successfully',
        },
        channel: {
          type: 'string',
          description: 'The DM channel ID where the message was sent',
        },
        messageId: { type: 'string', description: 'The ID of the sent DM' },
        userId: {
          type: 'string',
          description: 'The ID of the user who received the DM',
        },
      },
      required: ['success'],
    },
    metadata: {
      category: 'Communication',
      tags: ['dm', 'private', 'direct'],
      icon: '💌',
      color: '#4A154B',
      requiresAuth: true,
      estimatedDuration: 2,
    },
  },
  {
    id: 'slack.pin_message',
    name: 'Pin Last Message',
    description: 'Pin the last message in a Slack channel',
    configSchema: {
      name: 'Pin Message Configuration',
      description: 'Configure which channel to pin the last message in',
      fields: [
        {
          name: 'channel',
          type: 'text',
          label: 'Channel Name or ID',
          placeholder: '#general or C1234567890',
          required: true,
        },
      ],
    },
    outputSchema: {
      type: 'object',
      properties: {
        success: {
          type: 'boolean',
          description: 'Whether the message was pinned successfully',
        },
        channel: {
          type: 'string',
          description: 'The channel where the message was pinned',
        },
        messageId: {
          type: 'string',
          description: 'The ID of the pinned message',
        },
      },
      required: ['success'],
    },
    metadata: {
      category: 'Organization',
      tags: ['pin', 'important', 'bookmark', 'last'],
      icon: '📌',
      color: '#4A154B',
      requiresAuth: true,
      estimatedDuration: 1,
    },
  },
];
