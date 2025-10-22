import { redditActions } from '../../../src/services/services/reddit/actions';

describe('Reddit Actions', () => {
  it('should have 1 action defined', () => {
    expect(redditActions).toHaveLength(1);
  });

  describe('new_post_in_subreddit action', () => {
    const newPostAction = redditActions.find(
      a => a.id === 'reddit.new_post_in_subreddit'
    );

    it('should be defined', () => {
      expect(newPostAction).toBeDefined();
    });

    it('should have correct properties', () => {
      expect(newPostAction?.name).toBe('New Post in Subreddit');
      expect(newPostAction?.description).toBe(
        'Triggered when a new post is made in a specified subreddit'
      );
    });

    it('should have correct configSchema', () => {
      expect(newPostAction?.configSchema).toBeDefined();
      expect(newPostAction?.configSchema.name).toBe('New Post in Subreddit');
      expect(newPostAction?.configSchema.fields).toHaveLength(1);

      const subredditField = newPostAction?.configSchema.fields[0];
      expect(subredditField?.name).toBe('subreddit');
      expect(subredditField?.type).toBe('text');
      expect(subredditField?.required).toBe(true);
    });

    it('should have correct inputSchema', () => {
      expect(newPostAction?.inputSchema).toBeDefined();
      expect(newPostAction?.inputSchema.type).toBe('object');
      expect(newPostAction?.inputSchema.properties).toBeDefined();

      const properties = newPostAction?.inputSchema.properties;
      expect(properties?.post).toBeDefined();
      expect(properties?.subreddit).toBeDefined();
      expect(properties?.timestamp).toBeDefined();

      expect(newPostAction?.inputSchema.required).toContain('post');
      expect(newPostAction?.inputSchema.required).toContain('subreddit');
      expect(newPostAction?.inputSchema.required).toContain('timestamp');
    });

    it('should have post object properties', () => {
      const postProperties =
        newPostAction?.inputSchema.properties?.post.properties;
      expect(postProperties).toBeDefined();
      expect(postProperties?.id).toBeDefined();
      expect(postProperties?.name).toBeDefined();
      expect(postProperties?.title).toBeDefined();
      expect(postProperties?.author).toBeDefined();
      expect(postProperties?.subreddit).toBeDefined();
      expect(postProperties?.url).toBeDefined();
      expect(postProperties?.permalink).toBeDefined();
      expect(postProperties?.created_utc).toBeDefined();
      expect(postProperties?.score).toBeDefined();
      expect(postProperties?.num_comments).toBeDefined();
      expect(postProperties?.selftext).toBeDefined();
      expect(postProperties?.is_self).toBeDefined();
    });

    it('should have correct metadata', () => {
      expect(newPostAction?.metadata).toBeDefined();
      expect(newPostAction?.metadata.category).toBe('Social Media');
      expect(newPostAction?.metadata.tags).toContain('reddit');
      expect(newPostAction?.metadata.tags).toContain('social');
      expect(newPostAction?.metadata.tags).toContain('post');
      expect(newPostAction?.metadata.requiresAuth).toBe(true);
    });
  });
});
