import type { ActionReactionSchema } from '../../../types/mapping';

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
