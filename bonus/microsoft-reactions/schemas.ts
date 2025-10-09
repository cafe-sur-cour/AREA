import type { ActionReactionSchema } from '../../backend/src/types/mapping';

export const microsoftPostTeamsMessageSchema: ActionReactionSchema = {
  name: 'Send Message in Teams Chat',
  description:
    'Sends a message to a Microsoft Teams chat (1-to-1 or group chat)',
  fields: [
    {
      name: 'chat_id',
      type: 'text',
      label: 'Chat ID',
      required: true,
      placeholder:
        '19:xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx_yyyyyyyyyyyyyyyyyyyyyyyy@unq.gbl.spaces',
    },
    {
      name: 'message',
      type: 'textarea',
      label: 'Message Content',
      required: true,
      placeholder: 'Enter the message to send...',
    },
  ],
};

export const microsoftSendTeamsChatToUserSchema: ActionReactionSchema = {
  name: 'Send Direct Message to User',
  description: 'Sends a direct message to a specific user in Teams',
  fields: [
    {
      name: 'user_email',
      type: 'text',
      label: 'User Email',
      required: true,
      placeholder: 'user@example.com',
    },
    {
      name: 'message',
      type: 'textarea',
      label: 'Message Content',
      required: true,
      placeholder: 'Enter the message to send...',
    },
  ],
};

export const microsoftSendEmailSchema: ActionReactionSchema = {
  name: 'Send Email',
  description: 'Sends an email via Outlook',
  fields: [
    {
      name: 'to',
      type: 'text',
      label: 'To (Email Address)',
      required: true,
      placeholder: 'recipient@example.com',
    },
    {
      name: 'subject',
      type: 'text',
      label: 'Subject',
      required: true,
      placeholder: 'Email subject',
    },
    {
      name: 'body',
      type: 'textarea',
      label: 'Body',
      required: true,
      placeholder: 'Email body content',
    },
    {
      name: 'cc',
      type: 'text',
      label: 'CC (Optional)',
      required: false,
      placeholder: 'cc@example.com',
    },
  ],
};

export const microsoftCreateCalendarEventSchema: ActionReactionSchema = {
  name: 'Create Calendar Event',
  description: 'Creates a new event in Outlook Calendar',
  fields: [
    {
      name: 'subject',
      type: 'text',
      label: 'Event Title',
      required: true,
      placeholder: 'Meeting with team',
    },
    {
      name: 'start_datetime',
      type: 'text',
      label: 'Start Date & Time (ISO 8601)',
      required: true,
      placeholder: '2025-10-09T14:00:00',
    },
    {
      name: 'end_datetime',
      type: 'text',
      label: 'End Date & Time (ISO 8601)',
      required: true,
      placeholder: '2025-10-09T15:00:00',
    },
    {
      name: 'location',
      type: 'text',
      label: 'Location (Optional)',
      required: false,
      placeholder: 'Conference Room A',
    },
    {
      name: 'body',
      type: 'textarea',
      label: 'Description (Optional)',
      required: false,
      placeholder: 'Event description',
    },
    {
      name: 'attendees',
      type: 'text',
      label: 'Attendees (Optional, comma-separated)',
      required: false,
      placeholder: 'user1@example.com, user2@example.com',
    },
  ],
};

export const microsoftPostTeamsChannelMessageSchema: ActionReactionSchema = {
  name: 'Post Message in Teams Channel',
  description: 'Posts a message to a Microsoft Teams channel',
  fields: [
    {
      name: 'team_id',
      type: 'text',
      label: 'Team ID',
      required: true,
      placeholder: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
    },
    {
      name: 'channel_id',
      type: 'text',
      label: 'Channel ID',
      required: true,
      placeholder: '19:xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx@thread.tacv2',
    },
    {
      name: 'message',
      type: 'textarea',
      label: 'Message Content',
      required: true,
      placeholder: 'Enter the message to post...',
    },
  ],
};

export const microsoftReplyToEmailSchema: ActionReactionSchema = {
  name: 'Reply to Email',
  description: 'Replies to a specific email in Outlook',
  fields: [
    {
      name: 'message_id',
      type: 'text',
      label: 'Message ID',
      required: true,
      placeholder: 'AAMkAGI2TG93AAA=',
    },
    {
      name: 'reply_body',
      type: 'textarea',
      label: 'Reply Content',
      required: true,
      placeholder: 'Your reply message',
    },
  ],
};

export const microsoftUpdatePresenceSchema: ActionReactionSchema = {
  name: 'Update User Presence',
  description: 'Updates your presence status in Microsoft Teams',
  fields: [
    {
      name: 'availability',
      type: 'select',
      label: 'Availability',
      required: true,
      placeholder: 'Select availability',
      options: [
        { value: 'Available', label: 'Available' },
        { value: 'Busy', label: 'Busy' },
        { value: 'DoNotDisturb', label: 'Do Not Disturb' },
        { value: 'BeRightBack', label: 'Be Right Back' },
        { value: 'Away', label: 'Away' },
      ],
    },
    {
      name: 'activity',
      type: 'select',
      label: 'Activity',
      required: true,
      placeholder: 'Select activity',
      options: [
        { value: 'Available', label: 'Available' },
        { value: 'InACall', label: 'In a call' },
        { value: 'InAMeeting', label: 'In a meeting' },
        { value: 'Busy', label: 'Busy' },
        { value: 'Away', label: 'Away' },
      ],
    },
    {
      name: 'expiration_duration',
      type: 'text',
      label: 'Duration (ISO 8601, Optional)',
      required: false,
      placeholder: 'PT1H (1 hour)',
    },
  ],
};
