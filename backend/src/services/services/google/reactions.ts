import type { ReactionDefinition } from '../../../types/service';
import {
  googleSendEmailSchema,
  googleAddLabelToEmailSchema,
  googleCreateCalendarEventSchema,
  googleDeleteNextCalendarEventSchema,
  googleCreateDocumentSchema,
  googleUploadFileToDriveSchema,
  googleShareFileSchema,
} from './schemas';

export const googleReactions: ReactionDefinition[] = [
  {
    id: 'google.send_email',
    name: 'Send Email',
    description: 'Sends an email via Gmail',
    configSchema: googleSendEmailSchema,
    outputSchema: {
      type: 'object',
      properties: {
        message_id: {
          type: 'string',
          description: 'The ID of the sent message',
        },
        to: {
          type: 'string',
          description: 'The recipient email address',
        },
        subject: {
          type: 'string',
          description: 'The email subject',
        },
        success: {
          type: 'boolean',
          description: 'Whether the send operation was successful',
        },
      },
      required: ['message_id', 'to', 'subject', 'success'],
    },
    metadata: {
      category: 'Gmail',
      tags: ['email', 'send', 'communication'],
      requiresAuth: true,
      estimatedDuration: 2000,
    },
  }
];
