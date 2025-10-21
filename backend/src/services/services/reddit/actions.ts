import type { ActionDefinition } from '../../../types/service';
import { newPostInSubredditSchema } from './schemas';

export const redditActions: ActionDefinition[] = [
  {
    id: 'reddit.new_post_in_subreddit',
    name: 'New Post in Subreddit',
    description:
      'Triggered when a new post is made in a specified subreddit or user profile',
    configSchema: newPostInSubredditSchema,
    inputSchema: {
      type: 'object',
      properties: {
        post: {
          type: 'object',
          description: 'Information about the new post',
          properties: {
            id: {
              type: 'string',
              description: 'Reddit post ID (without prefix)',
            },
            name: { type: 'string', description: 'Full Reddit ID (t3_xxxxx)' },
            title: { type: 'string', description: 'Post title' },
            author: { type: 'string', description: 'Post author username' },
            subreddit: { type: 'string', description: 'Subreddit name' },
            url: { type: 'string', description: 'Post URL' },
            permalink: { type: 'string', description: 'Reddit permalink' },
            created_utc: { type: 'number', description: 'Unix timestamp' },
            score: {
              type: 'number',
              description: 'Post score (upvotes - downvotes)',
            },
            num_comments: { type: 'number', description: 'Number of comments' },
            selftext: {
              type: 'string',
              description: 'Post text content (if text post)',
            },
            is_self: {
              type: 'boolean',
              description: 'Whether this is a text post',
            },
          },
        },
        subreddit: {
          type: 'string',
          description: 'Subreddit where the post was made',
        },
        timestamp: {
          type: 'string',
          description: 'ISO timestamp when the post was detected',
        },
      },
      required: ['post', 'subreddit', 'timestamp'],
    },
    metadata: {
      category: 'Social Media',
      tags: ['reddit', 'social', 'post', 'subreddit'],
      requiresAuth: true,
    },
  },
];
