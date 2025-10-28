import type { ReactionDefinition } from '../../../types/service';
import { facebookLikePostSchema } from './schemas';

export const facebookReactions: ReactionDefinition[] = [
  {
    id: 'facebook.like_post',
    name: 'Like Post',
    description: 'Likes a Facebook post',
    configSchema: facebookLikePostSchema,
    outputSchema: {
      type: 'object',
      properties: {
        success: {
          type: 'boolean',
          description: 'Whether the post was liked successfully',
        },
        post_id: {
          type: 'string',
          description: 'The ID of the post that was liked',
        },
      },
      required: ['success'],
    },
    metadata: {
      category: 'Facebook',
      tags: ['facebook', 'like', 'post', 'social'],
      requiresAuth: true,
      estimatedDuration: 1000,
    },
  },
];
