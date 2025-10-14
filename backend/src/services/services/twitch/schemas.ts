import type { ActionReactionSchema } from '../../../types/mapping';

export const twitchFollowChannelSchema: ActionReactionSchema = {
  name: 'Follow a Channel',
  description:
    'Follows a specified Twitch channel on behalf of the authenticated user',
  fields: [
    {
      name: 'broadcaster_login',
      type: 'text',
      label: 'Streamer Username',
      required: true,
      placeholder: 'ninja (the streamer username to follow)',
    },
  ],
};

export const twitchUnfollowChannelSchema: ActionReactionSchema = {
  name: 'Unfollow a Channel',
  description:
    'Unfollows a specified Twitch channel on behalf of the authenticated user',
  fields: [
    {
      name: 'broadcaster_login',
      type: 'text',
      label: 'Streamer Username',
      required: true,
      placeholder: 'ninja (the streamer username to unfollow)',
    },
  ],
};
