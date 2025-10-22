import { redditReactions } from '../../../src/services/services/reddit/reactions';

describe('Reddit Reactions', () => {
  it('should have 2 reactions defined', () => {
    expect(redditReactions).toHaveLength(2);
  });

  describe('upvote_post reaction', () => {
    const upvoteReaction = redditReactions.find(
      r => r.id === 'reddit.upvote_post'
    );

    it('should be defined', () => {
      expect(upvoteReaction).toBeDefined();
    });

    it('should have correct properties', () => {
      expect(upvoteReaction?.name).toBe('Upvote Post');
      expect(upvoteReaction?.description).toBe(
        'Upvotes a specific Reddit post'
      );
    });

    it('should have correct configSchema', () => {
      expect(upvoteReaction?.configSchema).toBeDefined();
      expect(upvoteReaction?.configSchema.name).toBe('Upvote Post');
      expect(upvoteReaction?.configSchema.fields).toHaveLength(1);

      const postIdField = upvoteReaction?.configSchema.fields[0];
      expect(postIdField?.name).toBe('post_id');
      expect(postIdField?.type).toBe('text');
      expect(postIdField?.required).toBe(true);
    });

    it('should have correct outputSchema', () => {
      expect(upvoteReaction?.outputSchema).toBeDefined();
      expect(upvoteReaction?.outputSchema.type).toBe('object');
      expect(upvoteReaction?.outputSchema.properties).toBeDefined();
      expect(upvoteReaction?.outputSchema.properties?.success).toBeDefined();
      expect(upvoteReaction?.outputSchema.properties?.post_id).toBeDefined();
    });

    it('should have correct metadata', () => {
      expect(upvoteReaction?.metadata).toBeDefined();
      expect(upvoteReaction?.metadata.category).toBe('Reddit');
      expect(upvoteReaction?.metadata.tags).toContain('reddit');
      expect(upvoteReaction?.metadata.tags).toContain('upvote');
      expect(upvoteReaction?.metadata.icon).toBe('FaArrowUp');
      expect(upvoteReaction?.metadata.color).toBe('#FF4500');
      expect(upvoteReaction?.metadata.requiresAuth).toBe(true);
    });
  });

  describe('post_comment reaction', () => {
    const commentReaction = redditReactions.find(
      r => r.id === 'reddit.post_comment'
    );

    it('should be defined', () => {
      expect(commentReaction).toBeDefined();
    });

    it('should have correct properties', () => {
      expect(commentReaction?.name).toBe('Post Comment');
      expect(commentReaction?.description).toBe(
        'Posts a comment on a specific Reddit post'
      );
    });

    it('should have correct configSchema', () => {
      expect(commentReaction?.configSchema).toBeDefined();
      expect(commentReaction?.configSchema.name).toBe('Post Comment');
      expect(commentReaction?.configSchema.fields).toHaveLength(2);

      const postIdField = commentReaction?.configSchema.fields[0];
      expect(postIdField?.name).toBe('post_id');
      expect(postIdField?.required).toBe(true);

      const commentTextField = commentReaction?.configSchema.fields[1];
      expect(commentTextField?.name).toBe('comment_text');
      expect(commentTextField?.type).toBe('textarea');
      expect(commentTextField?.required).toBe(true);
    });

    it('should have correct outputSchema', () => {
      expect(commentReaction?.outputSchema).toBeDefined();
      expect(commentReaction?.outputSchema.type).toBe('object');
      expect(commentReaction?.outputSchema.properties).toBeDefined();
      expect(commentReaction?.outputSchema.properties?.success).toBeDefined();
      expect(
        commentReaction?.outputSchema.properties?.comment_id
      ).toBeDefined();
      expect(
        commentReaction?.outputSchema.properties?.comment_url
      ).toBeDefined();
    });

    it('should have correct metadata', () => {
      expect(commentReaction?.metadata).toBeDefined();
      expect(commentReaction?.metadata.category).toBe('Reddit');
      expect(commentReaction?.metadata.tags).toContain('reddit');
      expect(commentReaction?.metadata.tags).toContain('comment');
      expect(commentReaction?.metadata.icon).toBe('FaComment');
      expect(commentReaction?.metadata.color).toBe('#FF4500');
      expect(commentReaction?.metadata.requiresAuth).toBe(true);
    });
  });
});
