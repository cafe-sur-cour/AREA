import type { ActionReactionSchema } from '../../../types/mapping';

export const upvotePostSchema: ActionReactionSchema = {
  name: 'Upvote Post',
  description: 'Upvotes a specific Reddit post',
  fields: [
    {
      name: 'post_id',
      type: 'text',
      label: 'Post ID (fullname format: t3_xxxxx)',
      required: true,
      placeholder: 't3_abc123',
    },
  ],
};

export const postCommentSchema: ActionReactionSchema = {
  name: 'Post Comment',
  description: 'Posts a comment on a specific Reddit post',
  fields: [
    {
      name: 'post_id',
      type: 'text',
      label: 'Post ID (fullname format: t3_xxxxx)',
      required: true,
      placeholder: 't3_abc123',
    },
    {
      name: 'comment_text',
      type: 'textarea',
      label: 'Comment Text',
      required: true,
      placeholder: 'Enter your comment here...',
    },
  ],
};
