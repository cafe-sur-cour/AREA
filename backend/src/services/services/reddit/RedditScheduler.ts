import * as cron from 'node-cron';
import { AppDataSource } from '../../../config/db';
import { WebhookConfigs } from '../../../config/entity/WebhookConfigs';
import { Raw } from 'typeorm';
import { WebhookEvents } from '../../../config/entity/WebhookEvents';
import { redditOAuth } from './oauth';

interface RedditPost {
  id: string;
  name: string;
  title: string;
  author: string;
  subreddit: string;
  url: string;
  permalink: string;
  created_utc: number;
  score: number;
  num_comments: number;
  selftext?: string;
  is_self: boolean;
}

interface RedditListingResponse {
  data: {
    children: Array<{
      data: RedditPost;
    }>;
  };
}

export class RedditScheduler {
  private cronJobs: Map<string, cron.ScheduledTask> = new Map();
  private isRunning = false;
  private userSubredditStates = new Map<
    number,
    Map<
      string,
      {
        lastPostIds: string[];
        isInitialized: boolean;
      }
    >
  >();
  private lastRequestTime = new Map<number, number>();
  private activeUserIdsCache: number[] = [];
  private lastCacheUpdate = 0;
  private readonly CACHE_TTL = 5 * 1000;

  private readonly MIN_REQUEST_INTERVAL = 2000;
  private readonly REDDIT_API_BASE_URL =
    process.env.SERVICE_REDDIT_AUTH_API_BASE_URL || 'https://oauth.reddit.com';
  private readonly MAX_CONCURRENT_USERS = 3;

  async start(): Promise<void> {
    if (this.isRunning) {
      console.log('Reddit scheduler is already running');
      return;
    }

    this.isRunning = true;
    console.log('🚀 [Reddit Scheduler] Starting...');

    const pollJob = cron.schedule('*/5 * * * * *', async () => {
      await this.pollActiveUsers();
    });

    this.cronJobs.set('reddit-poll', pollJob);
    console.log(
      '✅ [Reddit Scheduler] Started successfully (polling every 5 seconds)'
    );
  }

  async stop(): Promise<void> {
    if (!this.isRunning) {
      console.log('Reddit scheduler is not running');
      return;
    }

    this.isRunning = false;
    console.log('🛑 [Reddit Scheduler] Stopping...');

    for (const job of this.cronJobs.values()) {
      job.destroy();
    }
    this.cronJobs.clear();
    this.userSubredditStates.clear();
    console.log('✅ [Reddit Scheduler] Stopped');
  }

  private async pollActiveUsers(): Promise<void> {
    try {
      const now = Date.now();

      let userIds: number[];
      if (
        now - this.lastCacheUpdate < this.CACHE_TTL &&
        this.activeUserIdsCache.length > 0
      ) {
        userIds = this.activeUserIdsCache;
      } else {
        const mappingRepository = AppDataSource.getRepository(WebhookConfigs);

        const activeMappings = await mappingRepository.find({
          where: {
            is_active: true,
            action: Raw(alias => `${alias} ->> 'type' LIKE :type`, {
              type: 'reddit.%',
            }),
          },
          select: ['created_by', 'action'],
        });

        userIds = [
          ...new Set(
            activeMappings
              .map(mapping => mapping.created_by)
              .filter((id): id is number => id != null)
          ),
        ];

        this.activeUserIdsCache = userIds;
        this.lastCacheUpdate = now;
      }

      if (userIds.length === 0) {
        return;
      }

      console.log(
        `🔍 [Reddit Scheduler] Polling ${userIds.length} active user(s)`
      );

      const chunks = this.chunkArray(userIds, this.MAX_CONCURRENT_USERS);
      for (const chunk of chunks) {
        const promises = chunk.map((userId: number) =>
          this.pollUser(userId).catch(error => {
            console.error(
              `❌ [Reddit Scheduler] Error polling user ${userId}:`,
              error
            );
          })
        );
        await Promise.allSettled(promises);
      }
    } catch (error) {
      console.error('❌ [Reddit Scheduler] Error polling active users:', error);
    }
  }

  private async pollUser(userId: number): Promise<void> {
    try {
      const userToken = await redditOAuth.getUserToken(userId);
      if (!userToken) {
        console.log(`⚠️ [Reddit Scheduler] No token found for user ${userId}`);
        return;
      }

      const mappingRepository = AppDataSource.getRepository(WebhookConfigs);
      const userMappings = await mappingRepository.find({
        where: {
          created_by: userId,
          is_active: true,
          action: Raw(alias => `${alias} ->> 'type' = :type`, {
            type: 'reddit.new_post_in_subreddit',
          }),
        },
      });

      console.log(
        `📋 [Reddit Scheduler] User ${userId} has ${userMappings.length} active mapping(s)`
      );

      if (userMappings.length === 0) {
        return;
      }

      const subreddits = new Set<string>();
      for (const mapping of userMappings) {
        const config = mapping.action as {
          type: string;
          config?: { subreddit?: string };
        };
        let subreddit = config.config?.subreddit;
        if (subreddit) {
          // Normalize: trim and lowercase, keep r/ or u/ prefix
          subreddit = subreddit.trim().toLowerCase();
          subreddits.add(subreddit);
        }
      }

      console.log(
        `🎯 [Reddit Scheduler] Monitoring subreddits for user ${userId}: ${Array.from(subreddits).join(', ')}`
      );

      for (const subreddit of subreddits) {
        await this.checkSubredditForNewPosts(userId, subreddit);
      }
    } catch (error) {
      console.error(
        `❌ [Reddit Scheduler] Error polling user ${userId}:`,
        error
      );
    }
  }

  private async checkSubredditForNewPosts(
    userId: number,
    subreddit: string
  ): Promise<void> {
    try {
      let apiPath: string;
      if (subreddit.startsWith('u/') || subreddit.startsWith('user/')) {
        apiPath = `/${subreddit}/submitted`;
      } else if (subreddit.startsWith('r/')) {
        apiPath = `/${subreddit}/new`;
      } else {
        apiPath = `/r/${subreddit}/new`;
      }

      const url = `${this.REDDIT_API_BASE_URL}${apiPath}.json?limit=10`;
      console.log(`🔗 [Reddit Scheduler] Fetching: ${url}`);

      const response = await this.makeRedditRequest(userId, url);

      if (!response) {
        console.log(
          `⚠️ [Reddit Scheduler] No response from Reddit API for ${subreddit}`
        );
        return;
      }

      const data: RedditListingResponse = await response.json();
      const posts = data.data.children.map(child => child.data);

      console.log(
        `📊 [Reddit Scheduler] Found ${posts.length} posts in ${subreddit}`
      );

      if (posts.length === 0) {
        return;
      }

      const currentPostIds = posts.map(post => post.name);
      const userState = this.getUserSubredditState(userId, subreddit);

      console.log(
        `🗂️ [Reddit Scheduler] Current posts: ${currentPostIds.join(', ')}`
      );
      console.log(
        `🗂️ [Reddit Scheduler] Previous posts: ${userState.lastPostIds.join(', ')}`
      );
      console.log(
        `🔄 [Reddit Scheduler] Is initialized: ${userState.isInitialized}`
      );

      if (userState.isInitialized && userState.lastPostIds.length > 0) {
        const newPostIds = currentPostIds.filter(
          id => !userState.lastPostIds.includes(id)
        );

        console.log(
          `🆕 [Reddit Scheduler] New post IDs: ${newPostIds.join(', ') || 'none'}`
        );

        if (newPostIds.length > 0) {
          const newPosts = posts.filter(post => newPostIds.includes(post.name));

          const location =
            subreddit.startsWith('u/') || subreddit.startsWith('user/')
              ? subreddit
              : `r/${subreddit}`;

          console.log(
            `🆕 [Reddit Scheduler] Found ${newPosts.length} new post(s) in ${location} for user ${userId}`
          );

          for (const post of newPosts.reverse()) {
            await this.triggerNewPostEvent(userId, subreddit, post);
          }
        }
      } else {
        const location =
          subreddit.startsWith('u/') || subreddit.startsWith('user/')
            ? subreddit
            : `r/${subreddit}`;
        console.log(
          `📌 [Reddit Scheduler] Initializing ${location} state for user ${userId}`
        );
      }

      this.updateUserSubredditState(userId, subreddit, {
        lastPostIds: currentPostIds,
        isInitialized: true,
      });
    } catch (error) {
      console.error(
        `❌ [Reddit Scheduler] Error checking r/${subreddit} for user ${userId}:`,
        error
      );
    }
  }

  private async makeRedditRequest(
    userId: number,
    url: string
  ): Promise<Response | null> {
    const userToken = await redditOAuth.getUserToken(userId);
    if (!userToken) {
      return null;
    }

    // Respect rate limiting
    const now = Date.now();
    const lastRequest = this.lastRequestTime.get(userId) || 0;
    const timeSinceLastRequest = now - lastRequest;

    if (timeSinceLastRequest < this.MIN_REQUEST_INTERVAL) {
      const waitTime = this.MIN_REQUEST_INTERVAL - timeSinceLastRequest;
      await new Promise<void>(resolve => setTimeout(resolve, waitTime));
    }

    this.lastRequestTime.set(userId, Date.now());

    try {
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${userToken.token_value}`,
          'User-Agent': 'AREA-App/1.0',
        },
      });

      if (response.status === 401) {
        console.warn(`⚠️ [Reddit Scheduler] Token expired for user ${userId}`);
        return null;
      }

      if (response.status === 429) {
        console.warn(`⚠️ [Reddit Scheduler] Rate limit hit for user ${userId}`);
        const retryAfter = response.headers.get('Retry-After');
        if (retryAfter) {
          const waitTime = parseInt(retryAfter) * 1000;
          await new Promise<void>(resolve =>
            setTimeout(resolve, Math.min(waitTime, 10000))
          );
        }
        return null;
      }

      if (!response.ok) {
        console.error(
          `❌ [Reddit Scheduler] API error for user ${userId}: ${response.status} ${response.statusText}`
        );
        return null;
      }

      return response;
    } catch (error) {
      console.error(
        `❌ [Reddit Scheduler] Network error for user ${userId}:`,
        error
      );
      return null;
    }
  }

  private async triggerNewPostEvent(
    userId: number,
    subreddit: string,
    post: RedditPost
  ): Promise<void> {
    await this.createEvent(userId, 'reddit.new_post_in_subreddit', {
      post: {
        id: post.id,
        name: post.name, // Full ID (t3_xxxxx)
        title: post.title,
        author: post.author,
        subreddit: post.subreddit,
        url: post.url,
        permalink: `https://reddit.com${post.permalink}`,
        created_utc: post.created_utc,
        score: post.score,
        num_comments: post.num_comments,
        selftext: post.selftext || '',
        is_self: post.is_self,
      },
      subreddit: subreddit,
      timestamp: new Date().toISOString(),
    });

    const location =
      subreddit.startsWith('u/') || subreddit.startsWith('user/')
        ? subreddit
        : `r/${subreddit}`;

    console.log(
      `✅ [Reddit Scheduler] Triggered event for new post "${post.title}" in ${location}`
    );
  }

  private async createEvent(
    userId: number,
    actionType: string,
    payload: Record<string, unknown>
  ): Promise<void> {
    const eventRepository = AppDataSource.getRepository(WebhookEvents);

    const event = eventRepository.create({
      action_type: actionType,
      user_id: userId,
      payload: payload,
      source: 'reddit-polling',
      status: 'received',
    });

    await eventRepository.save(event);
  }

  private getUserSubredditState(userId: number, subreddit: string) {
    if (!this.userSubredditStates.has(userId)) {
      this.userSubredditStates.set(userId, new Map());
    }

    const userStates = this.userSubredditStates.get(userId)!;
    if (!userStates.has(subreddit)) {
      userStates.set(subreddit, {
        lastPostIds: [],
        isInitialized: false,
      });
    }

    return userStates.get(subreddit)!;
  }

  private updateUserSubredditState(
    userId: number,
    subreddit: string,
    updates: Partial<ReturnType<typeof this.getUserSubredditState>>
  ) {
    const currentState = this.getUserSubredditState(userId, subreddit);
    const userStates = this.userSubredditStates.get(userId)!;
    userStates.set(subreddit, { ...currentState, ...updates });
  }

  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }
}

export const redditScheduler = new RedditScheduler();
