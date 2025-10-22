// Set environment variables
process.env.SERVICE_REDDIT_AUTH_API_BASE_URL = 'https://oauth.reddit.com';

// Mock global fetch
global.fetch = jest.fn();

// Mock redditOAuth
jest.mock('../../../src/services/services/reddit/oauth', () => ({
  redditOAuth: {
    getUserToken: jest.fn(),
  },
}));

import { redditReactionExecutor } from '../../../src/services/services/reddit/executor';
import { redditOAuth } from '../../../src/services/services/reddit/oauth';
import type { ReactionExecutionContext } from '../../../src/types/service';

describe('Reddit Reaction Executor', () => {
  let mockFetch: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch = global.fetch as jest.Mock;
  });

  const createContext = (
    reactionType: string,
    config: Record<string, unknown> = {}
  ): ReactionExecutionContext => ({
    reaction: {
      type: reactionType,
      config,
    },
    serviceConfig: {
      credentials: {
        access_token: 'test-access-token',
      },
    },
    event: {
      id: 1,
      action_type: 'test.action',
      user_id: 1,
      payload: {},
      created_at: new Date(),
    },
    mapping: {
      id: 1,
      name: 'Test Mapping',
      created_by: 1,
    },
  });

  describe('execute', () => {
    it('should return error if user not authenticated', async () => {
      (redditOAuth.getUserToken as jest.Mock).mockResolvedValue(null);

      const context = createContext('reddit.upvote_post', {
        post_id: 't3_abc123',
      });

      const result = await redditReactionExecutor.execute(context);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Reddit authentication required');
    });

    it('should return error for unknown reaction type', async () => {
      (redditOAuth.getUserToken as jest.Mock).mockResolvedValue({
        token_value: 'test_token',
        scopes: ['identity', 'read'],
      });

      const context = createContext('reddit.unknown_action');

      const result = await redditReactionExecutor.execute(context);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Unknown Reddit reaction type');
    });
  });

  describe('upvotePost', () => {
    it('should upvote post successfully', async () => {
      (redditOAuth.getUserToken as jest.Mock).mockResolvedValue({
        token_value: 'test_token',
        scopes: ['vote'],
      });

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({}),
      } as any);

      const context = createContext('reddit.upvote_post', {
        post_id: 't3_abc123',
      });

      const result = await redditReactionExecutor.execute(context);

      expect(result.success).toBe(true);
      expect(result.output).toMatchObject({
        success: true,
        post_id: 't3_abc123',
      });
      expect(mockFetch).toHaveBeenCalledWith(
        'https://oauth.reddit.com/api/vote',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            Authorization: 'Bearer test_token',
            'User-Agent': 'AREA-App/1.0',
          }),
        })
      );
    });

    it('should handle missing post_id', async () => {
      (redditOAuth.getUserToken as jest.Mock).mockResolvedValue({
        token_value: 'test_token',
        scopes: ['vote'],
      });

      const context = createContext('reddit.upvote_post', {});

      const result = await redditReactionExecutor.execute(context);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Missing required field: post_id');
    });

    it('should handle API errors', async () => {
      (redditOAuth.getUserToken as jest.Mock).mockResolvedValue({
        token_value: 'test_token',
        scopes: ['vote'],
      });

      mockFetch.mockResolvedValue({
        ok: false,
        status: 403,
        text: () => Promise.resolve('Forbidden'),
      } as any);

      const context = createContext('reddit.upvote_post', {
        post_id: 't3_abc123',
      });

      const result = await redditReactionExecutor.execute(context);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Reddit API error');
    });
  });

  describe('postComment', () => {
    it('should post comment successfully', async () => {
      (redditOAuth.getUserToken as jest.Mock).mockResolvedValue({
        token_value: 'test_token',
        scopes: ['submit'],
      });

      mockFetch.mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            json: {
              data: {
                things: [
                  {
                    data: {
                      id: 'comment123',
                      permalink: '/r/test/comments/abc/test/comment123',
                    },
                  },
                ],
              },
            },
          }),
      } as any);

      const context = createContext('reddit.post_comment', {
        post_id: 't3_abc123',
        comment_text: 'Great post!',
      });

      const result = await redditReactionExecutor.execute(context);

      expect(result.success).toBe(true);
      expect(result.output).toMatchObject({
        success: true,
        comment_id: 'comment123',
      });
      expect(mockFetch).toHaveBeenCalledWith(
        'https://oauth.reddit.com/api/comment',
        expect.objectContaining({
          method: 'POST',
        })
      );
    });

    it('should handle missing comment_text', async () => {
      (redditOAuth.getUserToken as jest.Mock).mockResolvedValue({
        token_value: 'test_token',
        scopes: ['submit'],
      });

      const context = createContext('reddit.post_comment', {
        post_id: 't3_abc123',
      });

      const result = await redditReactionExecutor.execute(context);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Missing required fields');
    });

    it('should handle API errors', async () => {
      (redditOAuth.getUserToken as jest.Mock).mockResolvedValue({
        token_value: 'test_token',
        scopes: ['submit'],
      });

      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        text: () => Promise.resolve('Internal Server Error'),
      } as any);

      const context = createContext('reddit.post_comment', {
        post_id: 't3_abc123',
        comment_text: 'Test comment',
      });

      const result = await redditReactionExecutor.execute(context);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Reddit API error');
    });
  });
});
