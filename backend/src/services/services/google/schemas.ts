import type { ActionReactionSchema } from '../../../types/mapping';

export const googleSendEmailSchema: ActionReactionSchema = {
  name: 'Send Email',
  description: 'Sends an email via Gmail',
  fields: [
    {
      name: 'to',
      type: 'text',
      label: 'Recipient Email Address',
      required: true,
      placeholder: 'recipient@example.com',
      dynamic: true,
      dynamicPlaceholder: '{{action.payload.from}}',
    },
    {
      name: 'subject',
      type: 'text',
      label: 'Email Subject',
      required: true,
      placeholder: 'Subject of the email',
      dynamic: true,
      dynamicPlaceholder: 'Re: {{action.payload.subject}}',
    },
    {
      name: 'body',
      type: 'textarea',
      label: 'Email Body',
      required: true,
      placeholder: 'Body of the email',
      dynamic: true,
      dynamicPlaceholder: 'Response to: {{action.payload.snippet}}',
    },
  ],
};

export const googleCreateCalendarEventSchema: ActionReactionSchema = {
  name: 'Create Calendar Event',
  description: 'Creates a new event in Google Calendar',
  fields: [
    {
      name: 'summary',
      type: 'text',
      label: 'Event Title',
      required: true,
      placeholder: 'Meeting with team',
      dynamic: true,
      dynamicPlaceholder: 'Follow-up: {{action.payload.summary}}',
    },
    {
      name: 'description',
      type: 'textarea',
      label: 'Event Description',
      required: false,
      placeholder: 'Discuss project progress',
      dynamic: true,
      dynamicPlaceholder: 'Event details: {{action.payload.description}}',
    },
    {
      name: 'start_datetime',
      type: 'text',
      label: 'Start Date/Time (ISO 8601 format)',
      required: true,
      placeholder: '2025-10-10T10:00:00Z',
      dynamic: true,
      dynamicPlaceholder: '{{action.payload.end_datetime}}',
    },
    {
      name: 'end_datetime',
      type: 'text',
      label: 'End Date/Time (ISO 8601 format)',
      required: true,
      placeholder: '2025-10-10T11:00:00Z',
    },
    {
      name: 'attendees',
      type: 'text',
      label: 'Attendees (comma-separated emails)',
      required: false,
      placeholder: 'john@example.com, jane@example.com',
      dynamic: true,
      dynamicPlaceholder: '{{action.payload.organizer.email}}',
    },
  ],
};

export const googleCreateDocumentSchema: ActionReactionSchema = {
  name: 'Create Google Doc',
  description: 'Creates a new Google Document',
  fields: [
    {
      name: 'title',
      type: 'text',
      label: 'Document Title',
      required: true,
      placeholder: 'My Document',
      dynamic: true,
      dynamicPlaceholder: 'Notes - {{action.payload.file_name}}',
    },
    {
      name: 'content',
      type: 'textarea',
      label: 'Initial Content',
      required: false,
      placeholder: 'Document content...',
      dynamic: true,
      dynamicPlaceholder:
        '{{action.payload.description}}\n\nCreated from: {{action.payload.file_name}}',
    },
  ],
};
