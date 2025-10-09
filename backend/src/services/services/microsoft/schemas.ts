// Microsoft service schemas
import type { ActionReactionSchema } from '../../../types/mapping';

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
