import type { ActionReactionSchema } from '../../../types/mapping';

// ==================== ACTIONS (Triggers) ====================

export const googleCalendarEventCreatedSchema: ActionReactionSchema = {
  name: 'Google Calendar Event Created',
  description: 'Triggers when a new calendar event is created',
  fields: [
    {
      name: 'calendarId',
      type: 'text',
      label: 'Calendar ID (optional, defaults to primary)',
      required: false,
      placeholder: 'primary',
    },
  ],
};

export const googleGmailNewEmailSchema: ActionReactionSchema = {
  name: 'Google Gmail New Email',
  description: 'Triggers when a new email is received',
  fields: [
    {
      name: 'labelIds',
      type: 'text',
      label: 'Label IDs (comma-separated, optional)',
      required: false,
      placeholder: 'INBOX,IMPORTANT',
    },
    {
      name: 'query',
      type: 'text',
      label: 'Search Query (optional)',
      required: false,
      placeholder: 'from:example@gmail.com',
    },
  ],
};

export const googleDocsDocumentCreatedSchema: ActionReactionSchema = {
  name: 'Google Docs Document Created',
  description: 'Triggers when a new Google Docs document is created',
  fields: [
    {
      name: 'folderId',
      type: 'text',
      label: 'Folder ID (optional, defaults to My Drive)',
      required: false,
      placeholder: 'root',
    },
  ],
};

export const googleDriveFileUploadedSchema: ActionReactionSchema = {
  name: 'Google Drive File Uploaded',
  description: 'Triggers when a new file is uploaded to Google Drive',
  fields: [
    {
      name: 'folderId',
      type: 'text',
      label: 'Folder ID (optional, defaults to My Drive)',
      required: false,
      placeholder: 'root',
    },
    {
      name: 'mimeType',
      type: 'text',
      label: 'MIME Type Filter (optional, e.g., image/png)',
      required: false,
      placeholder: 'image/png',
    },
  ],
};

// ==================== REACTIONS (Actions to execute) ====================

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
    },
    {
      name: 'subject',
      type: 'text',
      label: 'Email Subject',
      required: true,
      placeholder: 'Subject of the email',
    },
    {
      name: 'body',
      type: 'text',
      label: 'Email Body',
      required: true,
      placeholder: 'Body of the email',
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
    },
    {
      name: 'description',
      type: 'text',
      label: 'Event Description',
      required: false,
      placeholder: 'Discuss project progress',
    },
    {
      name: 'start_datetime',
      type: 'text',
      label: 'Start Date/Time (ISO 8601 format)',
      required: true,
      placeholder: '2025-10-10T10:00:00Z',
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
    },
    {
      name: 'content',
      type: 'text',
      label: 'Initial Content',
      required: false,
      placeholder: 'Document content...',
    },
  ],
};

export const googleDriveUploadFileSchema: ActionReactionSchema = {
  name: 'Upload File to Google Drive',
  description: 'Uploads a file to Google Drive',
  fields: [
    {
      name: 'fileName',
      type: 'text',
      label: 'File Name',
      required: true,
      placeholder: 'document.pdf',
    },
    {
      name: 'fileContent',
      type: 'textarea',
      label: 'File Content (base64 or text)',
      required: true,
      placeholder: 'File content or base64 encoded data',
    },
    {
      name: 'mimeType',
      type: 'text',
      label: 'MIME Type',
      required: false,
      placeholder: 'application/pdf',
    },
    {
      name: 'folderId',
      type: 'text',
      label: 'Folder ID (optional, defaults to My Drive)',
      required: false,
      placeholder: 'root',
    },
  ],
};
