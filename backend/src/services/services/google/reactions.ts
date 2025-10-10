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
  },
  {
    id: 'google.add_label_to_email',
    name: 'Add Label to Latest Email',
    description: 'Adds a label to the most recent email',
    configSchema: googleAddLabelToEmailSchema,
    outputSchema: {
      type: 'object',
      properties: {
        message_id: {
          type: 'string',
          description: 'The ID of the labeled message',
        },
        label_name: {
          type: 'string',
          description: 'The name of the applied label',
        },
        label_id: {
          type: 'string',
          description: 'The ID of the applied label',
        },
        success: {
          type: 'boolean',
          description: 'Whether the label operation was successful',
        },
      },
      required: ['message_id', 'label_name', 'label_id', 'success'],
    },
    metadata: {
      category: 'Gmail',
      tags: ['email', 'label', 'organize'],
      requiresAuth: true,
      estimatedDuration: 1500,
    },
  },

  // Google Calendar reactions
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
          description: 'The ID of the created event',
        },
        event_link: {
          type: 'string',
          description: 'The link to the created event',
        },
        summary: {
          type: 'string',
          description: 'The title of the created event',
        },
        success: {
          type: 'boolean',
          description: 'Whether the creation was successful',
        },
      },
      required: ['event_id', 'event_link', 'summary', 'success'],
    },
    metadata: {
      category: 'Google Calendar',
      tags: ['calendar', 'event', 'schedule'],
      requiresAuth: true,
      estimatedDuration: 2000,
    },
  },
  {
    id: 'google.delete_next_calendar_event',
    name: 'Delete Next Calendar Event',
    description: 'Deletes the next upcoming event in Google Calendar',
    configSchema: googleDeleteNextCalendarEventSchema,
    outputSchema: {
      type: 'object',
      properties: {
        deleted_event_id: {
          type: 'string',
          description: 'The ID of the deleted event',
        },
        deleted_event_summary: {
          type: 'string',
          description: 'The title of the deleted event',
        },
        success: {
          type: 'boolean',
          description: 'Whether the deletion was successful',
        },
      },
      required: ['deleted_event_id', 'deleted_event_summary', 'success'],
    },
    metadata: {
      category: 'Google Calendar',
      tags: ['calendar', 'event', 'delete'],
      requiresAuth: true,
      estimatedDuration: 1500,
    },
  },

  // Google Drive reactions
  {
    id: 'google.create_document',
    name: 'Create Google Doc',
    description: 'Creates a new Google Document',
    configSchema: googleCreateDocumentSchema,
    outputSchema: {
      type: 'object',
      properties: {
        document_id: {
          type: 'string',
          description: 'The ID of the created document',
        },
        document_url: {
          type: 'string',
          description: 'The URL to access the document',
        },
        title: {
          type: 'string',
          description: 'The title of the created document',
        },
        success: {
          type: 'boolean',
          description: 'Whether the creation was successful',
        },
      },
      required: ['document_id', 'document_url', 'title', 'success'],
    },
    metadata: {
      category: 'Google Drive',
      tags: ['drive', 'document', 'create'],
      requiresAuth: true,
      estimatedDuration: 2000,
    },
  },
  {
    id: 'google.upload_file_to_drive',
    name: 'Upload File to Drive',
    description: 'Uploads a file to Google Drive',
    configSchema: googleUploadFileToDriveSchema,
    outputSchema: {
      type: 'object',
      properties: {
        file_id: {
          type: 'string',
          description: 'The ID of the uploaded file',
        },
        file_name: {
          type: 'string',
          description: 'The name of the uploaded file',
        },
        file_url: {
          type: 'string',
          description: 'The URL to access the file',
        },
        success: {
          type: 'boolean',
          description: 'Whether the upload was successful',
        },
      },
      required: ['file_id', 'file_name', 'file_url', 'success'],
    },
    metadata: {
      category: 'Google Drive',
      tags: ['drive', 'file', 'upload'],
      requiresAuth: true,
      estimatedDuration: 3000,
    },
  },
  {
    id: 'google.share_file',
    name: 'Share File',
    description: 'Shares a file or folder with specific users',
    configSchema: googleShareFileSchema,
    outputSchema: {
      type: 'object',
      properties: {
        permission_id: {
          type: 'string',
          description: 'The ID of the created permission',
        },
        file_id: {
          type: 'string',
          description: 'The ID of the shared file',
        },
        email: {
          type: 'string',
          description: 'The email of the user the file was shared with',
        },
        role: {
          type: 'string',
          description: 'The permission role granted',
        },
        success: {
          type: 'boolean',
          description: 'Whether the sharing was successful',
        },
      },
      required: ['permission_id', 'file_id', 'email', 'role', 'success'],
    },
    metadata: {
      category: 'Google Drive',
      tags: ['drive', 'share', 'permissions'],
      requiresAuth: true,
      estimatedDuration: 1500,
    },
  },
];
