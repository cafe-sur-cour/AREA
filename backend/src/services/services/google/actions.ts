import type { ActionDefinition } from '../../../types/service';
import {
  googleCalendarEventCreatedSchema,
  googleGmailNewEmailSchema,
  googleDocsDocumentCreatedSchema,
  googleDriveFileUploadedSchema,
} from './schemas';

export const googleActions: ActionDefinition[] = [
  {
    id: 'google.calendar.event_created',
    name: 'Google Calendar Event Created',
    description: 'Triggers when a new event is created in Google Calendar',
    configSchema: googleCalendarEventCreatedSchema,
    inputSchema: {
      type: 'object',
      properties: {
        event: {
          type: 'object',
          description: 'Calendar event information',
          properties: {
            id: {
              type: 'string',
              description: 'Event ID',
            },
            summary: {
              type: 'string',
              description: 'Event title/summary',
            },
            description: {
              type: 'string',
              description: 'Event description',
            },
            location: {
              type: 'string',
              description: 'Event location',
            },
            start: {
              type: 'object',
              description: 'Event start time',
              properties: {
                dateTime: {
                  type: 'string',
                  description: 'Start date/time in ISO 8601 format',
                },
                timeZone: {
                  type: 'string',
                  description: 'Time zone',
                },
              },
            },
            end: {
              type: 'object',
              description: 'Event end time',
              properties: {
                dateTime: {
                  type: 'string',
                  description: 'End date/time in ISO 8601 format',
                },
                timeZone: {
                  type: 'string',
                  description: 'Time zone',
                },
              },
            },
            creator: {
              type: 'object',
              description: 'Event creator',
              properties: {
                email: {
                  type: 'string',
                  description: 'Creator email',
                },
                displayName: {
                  type: 'string',
                  description: 'Creator display name',
                },
              },
            },
            organizer: {
              type: 'object',
              description: 'Event organizer',
              properties: {
                email: {
                  type: 'string',
                  description: 'Organizer email',
                },
                displayName: {
                  type: 'string',
                  description: 'Organizer display name',
                },
              },
            },
            attendees: {
              type: 'array',
              description: 'Event attendees',
              items: {
                type: 'object',
                description: 'Attendee information',
                properties: {
                  email: {
                    type: 'string',
                    description: 'Attendee email',
                  },
                  displayName: {
                    type: 'string',
                    description: 'Attendee display name',
                  },
                  responseStatus: {
                    type: 'string',
                    description: 'Response status (accepted, declined, tentative, needsAction)',
                  },
                },
              },
            },
            htmlLink: {
              type: 'string',
              description: 'Link to the event in Google Calendar',
            },
          },
        },
        calendarId: {
          type: 'string',
          description: 'Calendar ID where the event was created',
        },
      },
      required: ['event', 'calendarId'],
    },
    metadata: {
      category: 'Google Calendar',
      tags: ['calendar', 'event', 'created'],
      requiresAuth: true,
      webhookPattern: 'calendar.event.created',
      sharedEvents: true,
      sharedEventFilter: (event, mapping) => {
        const calendarId = (
          event.payload as { calendarId?: string }
        )?.calendarId;
        const configCalendarId = mapping.action.config?.calendarId || 'primary';
        return calendarId ? configCalendarId === calendarId : true;
      },
    },
  },
  {
    id: 'google.gmail.new_email',
    name: 'Google Gmail New Email',
    description: 'Triggers when a new email is received in Gmail',
    configSchema: googleGmailNewEmailSchema,
    inputSchema: {
      type: 'object',
      properties: {
        message: {
          type: 'object',
          description: 'Email message information',
          properties: {
            id: {
              type: 'string',
              description: 'Message ID',
            },
            threadId: {
              type: 'string',
              description: 'Thread ID',
            },
            labelIds: {
              type: 'array',
              description: 'Labels applied to the message',
              items: {
                type: 'string',
                description: 'Label ID',
              },
            },
            snippet: {
              type: 'string',
              description: 'Short preview of the message',
            },
            from: {
              type: 'object',
              description: 'Sender information',
              properties: {
                email: {
                  type: 'string',
                  description: 'Sender email address',
                },
                name: {
                  type: 'string',
                  description: 'Sender name',
                },
              },
            },
            to: {
              type: 'array',
              description: 'Recipients',
              items: {
                type: 'object',
                description: 'Recipient information',
                properties: {
                  email: {
                    type: 'string',
                    description: 'Recipient email address',
                  },
                  name: {
                    type: 'string',
                    description: 'Recipient name',
                  },
                },
              },
            },
            subject: {
              type: 'string',
              description: 'Email subject',
            },
            date: {
              type: 'string',
              description: 'Date the email was sent',
            },
            body: {
              type: 'string',
              description: 'Email body (plain text)',
            },
            hasAttachments: {
              type: 'boolean',
              description: 'Whether the email has attachments',
            },
          },
        },
      },
      required: ['message'],
    },
    metadata: {
      category: 'Google Gmail',
      tags: ['email', 'gmail', 'message'],
      requiresAuth: true,
      webhookPattern: 'gmail.message.received',
      sharedEvents: true,
      sharedEventFilter: (event, mapping) => {
        const message = (event.payload as { message?: { labelIds?: string[] } })
          ?.message;
        const configLabelIdsStr = mapping.action.config?.labelIds as string | undefined;
        const configLabelIds = configLabelIdsStr?.split(',').map(id => id.trim()) || [];

        if (configLabelIds.length === 0) {
          return true;
        }
        return message?.labelIds?.some((label) =>
          configLabelIds.includes(label)
        ) ?? true;
      },
    },
  },
  {
    id: 'google.docs.document_created',
    name: 'Google Docs Document Created',
    description: 'Triggers when a new Google Docs document is created',
    configSchema: googleDocsDocumentCreatedSchema,
    inputSchema: {
      type: 'object',
      properties: {
        document: {
          type: 'object',
          description: 'Document information',
          properties: {
            id: {
              type: 'string',
              description: 'Document ID',
            },
            title: {
              type: 'string',
              description: 'Document title',
            },
            mimeType: {
              type: 'string',
              description: 'MIME type (should be application/vnd.google-apps.document)',
            },
            createdTime: {
              type: 'string',
              description: 'Creation time in ISO 8601 format',
            },
            modifiedTime: {
              type: 'string',
              description: 'Last modification time in ISO 8601 format',
            },
            webViewLink: {
              type: 'string',
              description: 'Link to view the document in a browser',
            },
            webContentLink: {
              type: 'string',
              description: 'Link to download the document',
            },
            owners: {
              type: 'array',
              description: 'Document owners',
              items: {
                type: 'object',
                description: 'Owner information',
                properties: {
                  displayName: {
                    type: 'string',
                    description: 'Owner display name',
                  },
                  emailAddress: {
                    type: 'string',
                    description: 'Owner email address',
                  },
                },
              },
            },
            size: {
              type: 'number',
              description: 'Document size in bytes',
            },
          },
        },
        folderId: {
          type: 'string',
          description: 'Parent folder ID where the document was created',
        },
      },
      required: ['document'],
    },
    metadata: {
      category: 'Google Docs',
      tags: ['document', 'docs', 'created'],
      requiresAuth: true,
      webhookPattern: 'docs.document.created',
      sharedEvents: true,
      sharedEventFilter: (event, mapping) => {
        const folderId = (event.payload as { folderId?: string })?.folderId;
        const configFolderId = mapping.action.config?.folderId || 'root';
        return folderId ? configFolderId === folderId : true;
      },
    },
  },
  {
    id: 'google.drive.file_uploaded',
    name: 'Google Drive File Uploaded',
    description: 'Triggers when a new file is uploaded to Google Drive',
    configSchema: googleDriveFileUploadedSchema,
    inputSchema: {
      type: 'object',
      properties: {
        file: {
          type: 'object',
          description: 'File information',
          properties: {
            id: {
              type: 'string',
              description: 'File ID',
            },
            name: {
              type: 'string',
              description: 'File name',
            },
            mimeType: {
              type: 'string',
              description: 'MIME type of the file',
            },
            size: {
              type: 'number',
              description: 'File size in bytes',
            },
            createdTime: {
              type: 'string',
              description: 'Creation time in ISO 8601 format',
            },
            modifiedTime: {
              type: 'string',
              description: 'Last modification time in ISO 8601 format',
            },
            webViewLink: {
              type: 'string',
              description: 'Link to view the file in a browser',
            },
            webContentLink: {
              type: 'string',
              description: 'Link to download the file',
            },
            thumbnailLink: {
              type: 'string',
              description: 'Link to the file thumbnail',
            },
            owners: {
              type: 'array',
              description: 'File owners',
              items: {
                type: 'object',
                description: 'Owner information',
                properties: {
                  displayName: {
                    type: 'string',
                    description: 'Owner display name',
                  },
                  emailAddress: {
                    type: 'string',
                    description: 'Owner email address',
                  },
                  photoLink: {
                    type: 'string',
                    description: 'Link to owner photo',
                  },
                },
              },
            },
            parents: {
              type: 'array',
              description: 'Parent folder IDs',
              items: {
                type: 'string',
                description: 'Parent folder ID',
              },
            },
          },
        },
        folderId: {
          type: 'string',
          description: 'Parent folder ID where the file was uploaded',
        },
      },
      required: ['file'],
    },
    metadata: {
      category: 'Google Drive',
      tags: ['drive', 'file', 'upload'],
      requiresAuth: true,
      webhookPattern: 'drive.file.uploaded',
      sharedEvents: true,
      sharedEventFilter: (event, mapping) => {
        const file = (event.payload as { file?: { mimeType?: string; parents?: string[] } })?.file;
        const folderId = (event.payload as { folderId?: string })?.folderId;
        const configFolderId = mapping.action.config?.folderId as string | undefined;
        const configMimeType = mapping.action.config?.mimeType as string | undefined;

        // Check folder filter
        if (configFolderId && configFolderId !== 'root') {
          const parentMatch = file?.parents?.includes(configFolderId) || folderId === configFolderId;
          if (!parentMatch) {
            return false;
          }
        }

        // Check MIME type filter
        if (configMimeType && file?.mimeType) {
          return file.mimeType === configMimeType;
        }

        return true;
      },
    },
  },
];
