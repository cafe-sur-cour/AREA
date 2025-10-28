import type { ActionReactionSchema } from '../../../types/mapping';

export const facebookLikePostSchema: ActionReactionSchema = {
  name: 'Like a Facebook Post',
  description: 'Likes a specific post on Facebook',
  fields: [
    {
      name: 'post_id',
      type: 'text',
      label: 'Post ID',
      required: true,
      placeholder: 'Enter the Facebook post ID to like',
    },
  ],
};
