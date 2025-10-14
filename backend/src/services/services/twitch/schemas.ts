import type { ActionReactionSchema } from '../../../types/mapping';

export const twitchUpdateChannelSchema: ActionReactionSchema = {
  name: 'Update Channel Description',
  description:
    "Updates the title/description of the authenticated user's own Twitch channel",
  fields: [
    {
      name: 'title',
      type: 'text',
      label: 'New Channel Title',
      required: true,
      placeholder: 'My Awesome Stream Title!',
    },
  ],
};
