import type { ActionDefinition } from '../../../types/service';
import {
  googleCalendarEventInviteSchema,
  googleDriveFileAddedSchema,
} from './schemas';

export const googleActions: ActionDefinition[] = [
  {
    id: 'google.calendar_event_invite',
    name: 'Calendar Event Invite',
    description: 'Triggers when you are invited to a new calendar event',
    configSchema: googleCalendarEventInviteSchema,
    inputSchema: {
      type: 'object',
      properties: {
        event_id: {
          type: 'string',
          description: 'The ID of the calendar event',
        },
        summary: {
          type: 'string',
          description: 'Event title/summary',
        },
        description: {
          type: 'string',
          description: 'Event description',
        },
        start_datetime: {
          type: 'string',
          description: 'Start date/time of the event',
        },
        end_datetime: {
          type: 'string',
          description: 'End date/time of the event',
        },
        location: {
          type: 'string',
          description: 'Event location',
        },
        organizer: {
          type: 'object',
          properties: {
            email: {
              type: 'string',
              description: 'Organizer email address',
            },
            display_name: {
              type: 'string',
              description: 'Organizer display name',
            },
          },
          description: 'Event organizer information',
        },
        attendees: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              email: {
                type: 'string',
                description: 'Attendee email',
              },
              response_status: {
                type: 'string',
                description: 'Response status (accepted, declined, tentative)',
              },
              display_name: {
                type: 'string',
                description: 'Attendee display name',
              },
            },
            description: 'Attendee information',
          },
          description: 'List of event attendees',
        },
        html_link: {
          type: 'string',
          description: 'Link to the event in Google Calendar',
        },
      },
      required: ['event_id', 'summary', 'start_datetime', 'end_datetime'],
    },
    metadata: {
      category: 'Calendar',
      tags: ['calendar', 'event', 'invite'],
      requiresAuth: true,
      webhookPattern: 'calendar_event',
      sharedEvents: true,
      sharedEventFilter: (event, mapping) => {
        const calendarId = mapping.action.config?.calendar_id || 'primary';
        const eventCalendarId =
          (event.payload as { calendar_id?: string })?.calendar_id || 'primary';
        return calendarId === eventCalendarId;
      },
    },
  },
  {
    id: 'google.drive_file_added',
    name: 'Drive File Added',
    description: 'Triggers when a new file is added to Google Drive',
    configSchema: googleDriveFileAddedSchema,
    inputSchema: {
      type: 'object',
      properties: {
        file_id: {
          type: 'string',
          description: 'The ID of the file',
        },
        name: {
          type: 'string',
          description: 'File name',
        },
        mime_type: {
          type: 'string',
          description: 'MIME type of the file',
        },
        size: {
          type: 'number',
          description: 'File size in bytes',
        },
        created_time: {
          type: 'string',
          description: 'When the file was created',
        },
        modified_time: {
          type: 'string',
          description: 'When the file was last modified',
        },
        web_view_link: {
          type: 'string',
          description: 'Link to view the file in a browser',
        },
        web_content_link: {
          type: 'string',
          description: 'Link to download the file',
        },
        owner: {
          type: 'object',
          properties: {
            email: {
              type: 'string',
              description: 'Owner email address',
            },
            display_name: {
              type: 'string',
              description: 'Owner display name',
            },
          },
          description: 'File owner information',
        },
        parents: {
          type: 'array',
          items: {
            type: 'string',
            description: 'Folder ID',
          },
          description: 'Parent folder IDs',
        },
      },
      required: ['file_id', 'name', 'mime_type', 'created_time'],
    },
    metadata: {
      category: 'Drive',
      tags: ['drive', 'file', 'storage'],
      requiresAuth: true,
      webhookPattern: 'drive_file',
      sharedEvents: true,
      sharedEventFilter: (event, mapping) => {
        const folderId = (mapping.action.config?.folder_id as string) || 'root';
        const parents =
          (event.payload as { parents?: string[] })?.parents || [];
        if (folderId === 'root') return true;
        return parents.includes(folderId);
      },
    },
  },
];
