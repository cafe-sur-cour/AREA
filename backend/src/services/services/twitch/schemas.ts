import type { ActionReactionSchema } from '../../../types/mapping';

export const twitchNewFollowerSchema: ActionReactionSchema = {
  name: 'Twitch New Follower',
  description: 'Triggers when someone follows your Twitch channel',
  fields: [],
};

export const twitchNewSubscriptionSchema: ActionReactionSchema = {
  name: 'Twitch New Subscription',
  description:
    'Triggers when someone subscribes or renews a subscription to your channel',
  fields: [],
};

export const twitchUpdateChannelSchema: ActionReactionSchema = {
  name: 'Update Channel Description',
  description:
    "Updates the description of the authenticated user's own Twitch channel",
  fields: [
    {
      name: 'description',
      type: 'textarea',
      label: 'New Channel Description',
      required: true,
      placeholder:
        'Welcome to my channel! I stream games and have fun with viewers.',
      dynamic: true,
      dynamicPlaceholder: 'Now playing: {{action.payload.track.name}}',
    },
  ],
};

export const twitchBanUserSchema: ActionReactionSchema = {
  name: 'Ban User',
  description:
    "Bans or times out a user from the authenticated user's Twitch channel chat",
  fields: [
    {
      name: 'username',
      type: 'text',
      label: 'Username to Ban/Timeout',
      required: true,
      placeholder: 'twitchuser123',
      dynamic: true,
      dynamicPlaceholder: '{{action.payload.user.login}}',
    },
    {
      name: 'duration',
      type: 'number',
      label: 'Timeout Duration (seconds, optional for permanent ban)',
      required: false,
      placeholder: '300',
    },
    {
      name: 'reason',
      type: 'text',
      label: 'Reason (optional)',
      required: false,
      placeholder: 'Violation of chat rules',
    },
  ],
};

export const twitchUnbanUserSchema: ActionReactionSchema = {
  name: 'Unban User',
  description:
    "Unbans a user from the authenticated user's Twitch channel chat",
  fields: [
    {
      name: 'username',
      type: 'text',
      label: 'Username to Unban',
      required: true,
      placeholder: 'twitchuser123',
      dynamic: true,
      dynamicPlaceholder: '{{action.payload.user.login}}',
    },
  ],
};
