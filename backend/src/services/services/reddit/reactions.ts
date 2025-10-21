import type { ReactionDefinition } from '../../../types/service';
import { upvotePostSchema, postCommentSchema } from './schemas';

export const redditReactions: ReactionDefinition[] = [
  {
    id: 'reddit.upvote_post',
    name: 'Upvote Post',
    description: 'Upvotes a specific Reddit post',
    configSchema: upvotePostSchema,
    outputSchema: {
      type: 'object',
      properties: {
        success: {
          type: 'boolean',
          description: 'Whether the upvote was successful',
        },
        post_id: {
          type: 'string',
          description: 'The ID of the upvoted post',
        },
      },
    },
    metadata: {
      category: 'Reddit',
      tags: ['reddit', 'upvote', 'vote'],
      icon: 'FaArrowUp',
      color: '#FF4500',
      requiresAuth: true,
    },
  },
  {
    id: 'reddit.post_comment',
    name: 'Post Comment',
    description: 'Posts a comment on a specific Reddit post',
    configSchema: postCommentSchema,
    outputSchema: {
      type: 'object',
      properties: {
        success: {
          type: 'boolean',
          description: 'Whether the comment was posted successfully',
        },
        comment_id: {
          type: 'string',
          description: 'The ID of the posted comment',
        },
        comment_url: {
          type: 'string',
          description: 'The URL of the posted comment',
        },
      },
    },
    metadata: {
      category: 'Reddit',
      tags: ['reddit', 'comment', 'post'],
      icon: 'FaComment',
      color: '#FF4500',
      requiresAuth: true,
    },
  },
];
