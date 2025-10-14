import type { ActionReactionSchema } from '../../../types/mapping';

export const twitchNewFollowerSchema: ActionReactionSchema = {
  name: 'Twitch New Follower',
  description: 'Triggers when someone follows your Twitch channel',
  fields: [
    {
      name: 'broadcaster_username',
      type: 'text',
      label: 'Broadcaster Username',
      required: true,
      placeholder: 'shroud',
    },
  ],
};

export const twitchNewSubscriptionSchema: ActionReactionSchema = {
  name: 'Twitch New Subscription',
  description:
    'Triggers when someone subscribes or renews a subscription to your channel',
  fields: [
    {
      name: 'broadcaster_username',
      type: 'text',
      label: 'Broadcaster Username',
      required: true,
      placeholder: 'shroud',
    },
  ],
};

export const twitchStreamOnlineSchema: ActionReactionSchema = {
  name: 'Twitch Stream Online',
  description: 'Triggers when your Twitch stream goes online',
  fields: [
    {
      name: 'broadcaster_username',
      type: 'text',
      label: 'Broadcaster Username',
      required: true,
      placeholder: 'shroud',
    },
  ],
};

export const twitchStreamOfflineSchema: ActionReactionSchema = {
  name: 'Twitch Stream Offline',
  description: 'Triggers when your Twitch stream goes offline',
  fields: [
    {
      name: 'broadcaster_username',
      type: 'text',
      label: 'Broadcaster Username',
      required: true,
      placeholder: 'shroud',
    },
  ],
};
