import type { ActionReactionSchema } from '../../../types/mapping';

export const newPostInSubredditSchema: ActionReactionSchema = {
  name: 'New Post in Subreddit',
  description: 'Triggered when a new post is made in a specified subreddit',
  fields: [
    {
      name: 'subreddit',
      type: 'text',
      label: 'Subreddit Name (without r/)',
      required: true,
      placeholder: 'AskReddit',
    },
  ],
};

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
