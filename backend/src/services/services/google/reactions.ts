import type { ReactionDefinition } from '../../../types/service';
import {
  googleSendEmailSchema,
  googleCreateCalendarEventSchema,
  googleCreateDocumentSchema,
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
  },
  {
    id: 'google.create_calendar_event',
    name: 'Create Calendar Event',
    description: 'Creates a new event in Google Calendar',
    configSchema: googleCreateCalendarEventSchema,
    outputSchema: {
      type: 'object',
      properties: {
        event_id: {
          type: 'string',
          description: 'The ID of the created calendar event',
        },
        summary: {
          type: 'string',
          description: 'The title of the event',
        },
        start_datetime: {
          type: 'string',
          description: 'The start date/time of the event',
        },
        end_datetime: {
          type: 'string',
          description: 'The end date/time of the event',
        },
        success: {
          type: 'boolean',
          description: 'Whether the creation operation was successful',
        },
      },
      required: ['event_id', 'summary', 'start_datetime', 'end_datetime', 'success'],
    },
    metadata: {
      category: 'Calendar',
      tags: ['calendar', 'event', 'schedule'],
      requiresAuth: true,
      estimatedDuration: 3000,
    },
  },
  {
    id: 'google.create_document',
    name: 'Create Document',
    description: 'Creates a new document in Google Docs',
    configSchema: googleCreateDocumentSchema,
    outputSchema: {
      type: 'object',
      properties: {
        document_id: {
          type: 'string',
          description: 'The ID of the created document',
        },
        title: {
          type: 'string',
          description: 'The title of the document',
        },
        success: {
          type: 'boolean',
          description: 'Whether the creation operation was successful',
        },
      },
      required: ['document_id', 'title', 'success'],
    },
    metadata: {
      category: 'Docs',
      tags: ['document', 'create', 'productivity'],
      requiresAuth: true,
      estimatedDuration: 2500,
    },
  }
];
