import type { ActionDefinition } from '../../../types/service';
import {
  googleCalendarEventCreatedSchema,
  googleGmailNewEmailSchema,
  googleDocsDocumentCreatedSchema,
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
];
