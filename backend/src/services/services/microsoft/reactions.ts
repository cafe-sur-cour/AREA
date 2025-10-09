import type { ReactionDefinition } from '../../../types/service';
import {
  microsoftPostTeamsMessageSchema,
  microsoftSendTeamsChatToUserSchema,
  microsoftSendEmailSchema,
  microsoftCreateCalendarEventSchema,
  microsoftPostTeamsChannelMessageSchema,
  microsoftReplyToEmailSchema,
  microsoftUpdatePresenceSchema,
} from './schemas';

// Microsoft reactions
export const microsoftReactions: ReactionDefinition[] = [
  {
    id: 'microsoft.send_teams_chat_message',
    name: 'Send Message in Teams Chat',
    description:
      'Sends a message to a Microsoft Teams chat (1-to-1 or group chat)',
    configSchema: microsoftPostTeamsMessageSchema,
    outputSchema: {
      type: 'object',
      properties: {
        message_id: {
          type: 'string',
          description: 'The ID of the sent message',
        },
        chat_id: {
          type: 'string',
          description: 'The ID of the chat where the message was sent',
        },
        success: {
          type: 'boolean',
          description: 'Whether the message was sent successfully',
        },
      },
      required: ['success'],
    },
    metadata: {
      category: 'Microsoft Teams',
      tags: ['teams', 'messaging', 'chat', 'communication'],
      requiresAuth: true,
      estimatedDuration: 1500,
    },
  },
  {
    id: 'microsoft.send_direct_message',
    name: 'Send Direct Message to User',
    description: 'Sends a direct message to a specific user in Microsoft Teams',
    configSchema: microsoftSendTeamsChatToUserSchema,
    outputSchema: {
      type: 'object',
      properties: {
        message_id: {
          type: 'string',
          description: 'The ID of the sent message',
        },
        chat_id: {
          type: 'string',
          description: 'The ID of the chat that was created or used',
        },
        user_email: {
          type: 'string',
          description: 'The email of the user who received the message',
        },
        success: {
          type: 'boolean',
          description: 'Whether the message was sent successfully',
        },
      },
      required: ['success'],
    },
    metadata: {
      category: 'Microsoft Teams',
      tags: ['teams', 'messaging', 'direct message', 'communication'],
      requiresAuth: true,
      estimatedDuration: 2000,
    },
  },
  {
    id: 'microsoft.send_email',
    name: 'Send Email',
    description: 'Sends an email via Outlook',
    configSchema: microsoftSendEmailSchema,
    outputSchema: {
      type: 'object',
      properties: {
        message_id: {
          type: 'string',
          description: 'The ID of the sent email',
        },
        success: {
          type: 'boolean',
          description: 'Whether the email was sent successfully',
        },
      },
      required: ['success'],
    },
    metadata: {
      category: 'Microsoft Outlook',
      tags: ['email', 'outlook', 'send', 'communication'],
      requiresAuth: true,
      estimatedDuration: 2000,
    },
  },
  {
    id: 'microsoft.reply_to_email',
    name: 'Reply to Email',
    description: 'Replies to a specific email in Outlook',
    configSchema: microsoftReplyToEmailSchema,
    outputSchema: {
      type: 'object',
      properties: {
        message_id: {
          type: 'string',
          description: 'The ID of the reply message',
        },
        success: {
          type: 'boolean',
          description: 'Whether the reply was sent successfully',
        },
      },
      required: ['success'],
    },
    metadata: {
      category: 'Microsoft Outlook',
      tags: ['email', 'outlook', 'reply', 'communication'],
      requiresAuth: true,
      estimatedDuration: 1500,
    },
  },
  {
    id: 'microsoft.create_calendar_event',
    name: 'Create Calendar Event',
    description: 'Creates a new event in Outlook Calendar',
    configSchema: microsoftCreateCalendarEventSchema,
    outputSchema: {
      type: 'object',
      properties: {
        event_id: {
          type: 'string',
          description: 'The ID of the created event',
        },
        web_link: {
          type: 'string',
          description: 'Web link to the created event',
        },
        success: {
          type: 'boolean',
          description: 'Whether the event was created successfully',
        },
      },
      required: ['success'],
    },
    metadata: {
      category: 'Microsoft Calendar',
      tags: ['calendar', 'event', 'outlook', 'schedule'],
      requiresAuth: true,
      estimatedDuration: 2500,
    },
  },
  {
    id: 'microsoft.post_teams_channel_message',
    name: 'Post Message in Teams Channel',
    description: 'Posts a message to a Microsoft Teams channel',
    configSchema: microsoftPostTeamsChannelMessageSchema,
    outputSchema: {
      type: 'object',
      properties: {
        message_id: {
          type: 'string',
          description: 'The ID of the posted message',
        },
        success: {
          type: 'boolean',
          description: 'Whether the message was posted successfully',
        },
      },
      required: ['success'],
    },
    metadata: {
      category: 'Microsoft Teams',
      tags: ['teams', 'channel', 'messaging', 'communication'],
      requiresAuth: true,
      estimatedDuration: 1500,
    },
  },
  {
    id: 'microsoft.update_presence',
    name: 'Update User Presence',
    description: 'Updates your presence status in Microsoft Teams',
    configSchema: microsoftUpdatePresenceSchema,
    outputSchema: {
      type: 'object',
      properties: {
        success: {
          type: 'boolean',
          description: 'Whether the presence was updated successfully',
        },
        availability: {
          type: 'string',
          description: 'The updated availability status',
        },
        activity: {
          type: 'string',
          description: 'The updated activity status',
        },
      },
      required: ['success'],
    },
    metadata: {
      category: 'Microsoft Teams',
      tags: ['teams', 'presence', 'status', 'availability'],
      requiresAuth: true,
      estimatedDuration: 1000,
    },
  },
];
