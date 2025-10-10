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

export const googleAddLabelToEmailSchema: ActionReactionSchema = {
  name: 'Add Label to Latest Email',
  description: 'Adds a label to the most recent email',
  fields: [
    {
      name: 'label_name',
      type: 'text',
      label: 'Label Name',
      required: true,
      placeholder: 'Important',
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

export const googleDeleteNextCalendarEventSchema: ActionReactionSchema = {
  name: 'Delete Next Calendar Event',
  description: 'Deletes the next upcoming event in Google Calendar',
  fields: [],
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

export const googleUploadFileToDriveSchema: ActionReactionSchema = {
  name: 'Upload File to Drive',
  description: 'Uploads a file to Google Drive',
  fields: [
    {
      name: 'file_name',
      type: 'text',
      label: 'File Name',
      required: true,
      placeholder: 'document.txt',
    },
    {
      name: 'file_content',
      type: 'text',
      label: 'File Content',
      required: true,
      placeholder: 'Content of the file',
    },
    {
      name: 'mime_type',
      type: 'text',
      label: 'MIME Type',
      required: false,
      placeholder: 'text/plain',
    },
    {
      name: 'folder_id',
      type: 'text',
      label: 'Folder ID (optional, root if empty)',
      required: false,
      placeholder: '1a2b3c4d5e6f',
    },
  ],
};

export const googleShareFileSchema: ActionReactionSchema = {
  name: 'Share File',
  description: 'Shares a file or folder with specific users',
  fields: [
    {
      name: 'file_id',
      type: 'text',
      label: 'File/Folder ID',
      required: true,
      placeholder: '1a2b3c4d5e6f',
    },
    {
      name: 'email',
      type: 'text',
      label: 'Email to Share With',
      required: true,
      placeholder: 'user@example.com',
    },
    {
      name: 'role',
      type: 'text',
      label: 'Permission Role (reader, writer, commenter)',
      required: false,
      placeholder: 'reader',
    },
  ],
};
