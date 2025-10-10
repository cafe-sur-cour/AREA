// Slack service schemas
import type { ActionReactionSchema } from '../../../types/mapping';

export const slackNewMessageSchema: ActionReactionSchema = {
  name: 'New Message in Channel',
  description: 'Triggers when a new message is posted in a specific channel',
  fields: [
    {
      name: 'channel',
      type: 'text',
      label: 'Channel Name or ID (optional, leave empty for all channels)',
      required: false,
      placeholder: '#general or C1234567890',
    },
  ],
};

export const slackNewDMSchema: ActionReactionSchema = {
  name: 'New Direct Message',
  description: 'Triggers when the user receives a new private message',
  fields: [],
};

export const slackChannelCreatedSchema: ActionReactionSchema = {
  name: 'Channel Created',
  description: 'Triggers when a new channel is created in the workspace',
  fields: [
    {
      name: 'creator',
      type: 'text',
      label: 'Creator User ID (optional, leave empty for all channel creations)',
      required: false,
      placeholder: 'U1234567890',
    },
  ],
};

export const slackReactionAddedSchema: ActionReactionSchema = {
  name: 'Reaction Added to Message',
  description: 'Triggers when someone adds a reaction (emoji) to a message',
  fields: [
    {
      name: 'channel',
      type: 'text',
      label: 'Channel Name or ID (optional, leave empty for all channels)',
      required: false,
      placeholder: '#general or C1234567890',
    },
    {
      name: 'emoji',
      type: 'text',
      label: 'Emoji Name (optional, leave empty for any reaction)',
      required: false,
      placeholder: 'thumbsup or :thumbsup:',
    },
  ],
};
