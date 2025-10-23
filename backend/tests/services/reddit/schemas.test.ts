import {
  newPostInSubredditSchema,
  upvotePostSchema,
  postCommentSchema,
} from '../../../src/services/services/reddit/schemas';

describe('Reddit Schemas', () => {
  describe('newPostInSubredditSchema', () => {
    it('should have correct structure', () => {
      expect(newPostInSubredditSchema).toBeDefined();
      expect(newPostInSubredditSchema.name).toBe('New Post in Subreddit');
      expect(newPostInSubredditSchema.description).toBe(
        'Triggered when a new post is made in a specified subreddit'
      );
    });

    it('should have correct fields', () => {
      expect(newPostInSubredditSchema.fields).toHaveLength(1);

      const subredditField = newPostInSubredditSchema.fields[0];
      expect(subredditField.name).toBe('subreddit');
      expect(subredditField.type).toBe('text');
      expect(subredditField.label).toBe('Subreddit');
      expect(subredditField.required).toBe(true);
      expect(subredditField.placeholder).toBe('r/programming');
    });
  });

  describe('upvotePostSchema', () => {
    it('should have correct structure', () => {
      expect(upvotePostSchema).toBeDefined();
      expect(upvotePostSchema.name).toBe('Upvote Post');
      expect(upvotePostSchema.description).toBe(
        'Upvotes a specific Reddit post'
      );
    });

    it('should have correct fields', () => {
      expect(upvotePostSchema.fields).toHaveLength(1);

      const postIdField = upvotePostSchema.fields[0];
      expect(postIdField.name).toBe('post_id');
      expect(postIdField.type).toBe('text');
      expect(postIdField.label).toBe('Post ID (fullname format: t3_xxxxx)');
      expect(postIdField.required).toBe(true);
      expect(postIdField.placeholder).toBe('t3_abc123');
    });
  });

  describe('postCommentSchema', () => {
    it('should have correct structure', () => {
      expect(postCommentSchema).toBeDefined();
      expect(postCommentSchema.name).toBe('Post Comment');
      expect(postCommentSchema.description).toBe(
        'Posts a comment on a specific Reddit post'
      );
    });

    it('should have correct fields', () => {
      expect(postCommentSchema.fields).toHaveLength(2);

      const postIdField = postCommentSchema.fields[0];
      expect(postIdField.name).toBe('post_id');
      expect(postIdField.type).toBe('text');
      expect(postIdField.label).toBe('Post ID (fullname format: t3_xxxxx)');
      expect(postIdField.required).toBe(true);

      const commentTextField = postCommentSchema.fields[1];
      expect(commentTextField.name).toBe('comment_text');
      expect(commentTextField.type).toBe('textarea');
      expect(commentTextField.label).toBe('Comment Text');
      expect(commentTextField.required).toBe(true);
      expect(commentTextField.placeholder).toBe('Enter your comment here...');
    });
  });
});
