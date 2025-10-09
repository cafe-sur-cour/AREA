import type { ReactionDefinition } from '../../../types/service';
import {
  microsoftPostTeamsMessageSchema,
  microsoftSendTeamsChatToUserSchema,
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
];
