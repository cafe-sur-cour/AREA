import * as cron from 'node-cron';
import { AppDataSource } from '../../../config/db';
import { WebhookConfigs } from '../../../config/entity/WebhookConfigs';
import { Raw } from 'typeorm';
import { WebhookEvents } from '../../../config/entity/WebhookEvents';
import { UserToken } from '../../../config/entity/UserToken';
import { spotifyOAuth } from './oauth';

interface SpotifyTrack {
  id: string;
  name: string;
  artists: Array<{ name: string }>;
  album: { name: string };
  uri: string;
  duration_ms: number;
}

interface SpotifyPlaybackState {
  is_playing: boolean;
  currently_playing_type: string;
  item: SpotifyTrack | null;
  device: {
    id: string;
    name: string;
    type: string;
  } | null;
}

interface SpotifyLikedTracksResponse {
  items: Array<{
    added_at: string;
    track: SpotifyTrack;
  }>;
  total: number;
}

export class SpotifyScheduler {
  private cronJobs: Map<string, cron.ScheduledTask> = new Map();
  private isRunning = false;
  private userStates = new Map<
    number,
    {
      lastTrack: SpotifyTrack | null;
      lastPlaybackState: boolean | null;
      lastLikedTracks: string[];
      isInitialized: boolean;
    }
  >();
  private lastRequestTime = new Map<number, number>();
  private requestCounts = new Map<
    number,
    { count: number; windowStart: number }
  >();
  private activeUserIdsCache: number[] = [];
  private lastCacheUpdate = 0;
  private readonly CACHE_TTL = 5 * 1000; // 5 seconds

  private readonly MIN_REQUEST_INTERVAL = 1000; // 1 second
  private readonly MAX_REQUESTS_PER_WINDOW = 180;
  private readonly RATE_LIMIT_WINDOW = 30 * 1000; // 30 seconds
  private readonly SPOTIFY_API_BASE_URL =
    (process.env.SERVICE_SPOTIFY_API_BASE_URL || '') + '/v1';
  private readonly MAX_CONCURRENT_USERS = 5;

  async start(): Promise<void> {
    if (this.isRunning) {
      console.log('Spotify scheduler is already running');
      return;
    }

    this.isRunning = true;

    const pollJob = cron.schedule('*/10 * * * * *', async () => {
      await this.pollActiveUsers();
    });

    this.cronJobs.set('spotify-poll', pollJob);
  }

  async stop(): Promise<void> {
    if (!this.isRunning) {
      console.log('Spotify scheduler is not running');
      return;
    }

    this.isRunning = false;

    for (const job of this.cronJobs.values()) {
      job.destroy();
    }
    this.cronJobs.clear();
    this.userStates.clear();
  }

  private async pollActiveUsers(): Promise<void> {
    try {
      const now = Date.now();
      console.log(`[Spotify Poll] 🚀 Starting poll cycle at ${new Date(now).toISOString()}`);

      let userIds: number[];
      if (
        now - this.lastCacheUpdate < this.CACHE_TTL &&
        this.activeUserIdsCache.length > 0
      ) {
        userIds = this.activeUserIdsCache;
        console.log(`[Spotify Poll] 💾 Using cached users: [${userIds.join(', ')}]`);
      } else {
        console.log(`[Spotify Poll] 🔄 Cache expired or empty (${now - this.lastCacheUpdate}ms since last update), refreshing...`);
        const mappingRepository = AppDataSource.getRepository(WebhookConfigs);
        console.log(`[Spotify Poll] 🔍 Searching for active Spotify mappings...`);

        const activeMappings = await mappingRepository.find({
          where: {
            is_active: true,
            action: Raw(alias => `${alias} ->> 'type' LIKE :type`, {
              type: 'spotify.%',
            }),
          },
          select: ['created_by'],
        });

        console.log(`[Spotify Poll] 📋 Found ${activeMappings.length} active Spotify mappings:`);
        activeMappings.forEach(mapping => {
          console.log(`  - Mapping created_by user ${mapping.created_by}`);
        });

        userIds = [
          ...new Set(
            activeMappings
              .map(mapping => mapping.created_by)
              .filter((id): id is number => id != null)
          ),
        ];

        console.log(`[Spotify Poll] 👥 Deduplicated to ${userIds.length} unique users: [${userIds.join(', ')}]`);

        this.activeUserIdsCache = userIds;
        this.lastCacheUpdate = now;
      }

      if (userIds.length === 0) {
        console.log(`[Spotify Poll] ⚠️ No users to poll, skipping cycle`);
        return;
      }

      console.log(`[Spotify Poll] 🎯 Polling ${userIds.length} users: [${userIds.join(', ')}]`);

      const chunks = this.chunkArray(userIds, this.MAX_CONCURRENT_USERS);
      for (const chunk of chunks) {
        const promises = chunk.map((userId: number) =>
          this.pollUser(userId).catch(error => {
            console.error(`Error polling user ${userId}:`, error);
          })
        );
        await Promise.allSettled(promises);
      }
    } catch (error) {
      console.error('Error polling active users:', error);
    }
  }

  private async pollUser(userId: number): Promise<void> {
    try {
      console.log(`[Spotify Poll] 🔍 Starting to poll user ${userId}`);
      const userToken = await spotifyOAuth.getUserToken(userId);
      if (!userToken) {
        console.warn(
          `[Spotify Poll] ❌ User ${userId} - Token not found or invalid. Possible causes: token not in database, token expired without refresh_token, or token revoked by user.`
        );
        return;
      }

      const hasPlaybackScope = userToken.scopes?.includes(
        'user-read-playback-state'
      );
      const hasLibraryScope = userToken.scopes?.includes('user-library-read');

      if (!hasPlaybackScope && !hasLibraryScope) {
        console.warn(
          `[Spotify Poll] ❌ User ${userId} - Token missing required scopes. Current scopes: [${userToken.scopes?.join(', ') || 'NONE'}]. Required: 'user-read-playback-state' OR 'user-library-read'. User needs to re-authorize Spotify connection.`
        );
        return;
      }

      console.log(`[Spotify Poll] ✅ User ${userId} - Token valid, scopes: [${userToken.scopes?.join(', ') || 'NONE'}]`);

      await this.checkPlaybackState(userId);
      await this.checkLikedTracks(userId);
      console.log(`[Spotify Poll] ✅ User ${userId} - Polling completed`);
    } catch (error) {
      console.error(`Error polling user ${userId}:`, error);
    }
  }

  private async checkPlaybackState(userId: number): Promise<void> {
    try {
      console.log(`[Spotify Poll] 🎵 User ${userId} - Checking playback state...`);
      const response = await this.makeSpotifyRequest(
        userId,
        `${this.SPOTIFY_API_BASE_URL}/me/player`
      );
      if (!response) {
        console.log(`[Spotify Poll] ❌ User ${userId} - No response from Spotify API`);
        return;
      }

      if (response.status === 204) {
        const userState = this.getUserState(userId);
        console.log(`[Spotify Poll] 💤 User ${userId} - No active playback (204 response)`);
        if (userState.isInitialized && userState.lastPlaybackState === true) {
          console.log(`[Spotify Poll] ⏸️ User ${userId} - Triggering playback paused (was playing)`);
          await this.triggerPlaybackPaused(userId, userState.lastTrack, null);
        }
        userState.lastPlaybackState = false;
        userState.lastTrack = null;
        userState.isInitialized = true;
        return;
      }

      const playbackState: SpotifyPlaybackState = await response.json();
      console.log(`[Spotify Poll] 🎶 User ${userId} - Playback state: playing=${playbackState.is_playing}, track=${playbackState.item?.name || 'none'}`);

      const userState = this.getUserState(userId);
      const currentTrack = playbackState.item;
      const isPlaying = playbackState.is_playing;

      if (userState.isInitialized) {
        if (
          userState.lastTrack?.id !== currentTrack?.id &&
          currentTrack
        ) {
          console.log(`[Spotify Poll] 🔄 User ${userId} - Track changed: "${userState.lastTrack?.name || 'none'}" → "${currentTrack.name}" (playing: ${isPlaying})`);
          await this.triggerTrackChanged(
            userId,
            userState.lastTrack,
            currentTrack
          );
        }

        if (
          userState.lastPlaybackState !== null &&
          userState.lastPlaybackState !== isPlaying
        ) {
          if (isPlaying) {
            console.log(`[Spotify Poll] ▶️ User ${userId} - Playback started`);
            await this.triggerPlaybackStarted(
              userId,
              currentTrack,
              playbackState.device
            );
          } else {
            console.log(`[Spotify Poll] ⏸️ User ${userId} - Playback paused`);
            await this.triggerPlaybackPaused(
              userId,
              currentTrack,
              playbackState.device
            );
          }
        }
      } else {
        console.log(`[Spotify Poll] 🆕 User ${userId} - Initializing state: playing=${isPlaying}, track="${currentTrack?.name || 'none'}"`);
      }

      this.updateUserState(userId, {
        lastTrack: currentTrack,
        lastPlaybackState: isPlaying,
        isInitialized: true,
      });
    } catch (error) {
      if (error instanceof Response && error.status === 204) {
        this.updateUserState(userId, {
          lastTrack: null,
          lastPlaybackState: null,
        });
        return;
      }
      console.error(`Error checking playback state for user ${userId}:`, error);
    }
  }

  private lastLikedTrackDetection = new Map<number, number>();

  private async checkLikedTracks(userId: number): Promise<void> {
    try {
      const response = await this.makeSpotifyRequest(
        userId,
        `${this.SPOTIFY_API_BASE_URL}/me/tracks?limit=50`
      );
      if (!response) return;

      const likedTracks: SpotifyLikedTracksResponse = await response.json();
      const currentLikedTrackIds = likedTracks.items.map(item => item.track.id);

      const userState = this.getUserState(userId);
      const previousLikedTrackIds = userState.lastLikedTracks || [];

      if (userState.isInitialized && previousLikedTrackIds.length > 0) {
        // Anti-spam: don't check for new tracks more than once every 10 seconds
        const now = Date.now();
        const lastDetection = this.lastLikedTrackDetection.get(userId) || 0;
        if (now - lastDetection < 10000) {
          return;
        }

        const newTrackIds = currentLikedTrackIds.filter(
          id => !previousLikedTrackIds.includes(id)
        );

        if (newTrackIds.length > 0) {
          console.log(
            `🎵 [Spotify] User ${userId} has ${newTrackIds.length} new liked tracks`
          );
          this.lastLikedTrackDetection.set(userId, now);

          const newTracks = likedTracks.items.filter(item =>
            newTrackIds.includes(item.track.id)
          );

          for (const newTrack of newTracks) {
            await this.triggerLikedSongAdded(
              userId,
              newTrack.track,
              newTrack.added_at
            );
          }
        }
      }

      this.updateUserState(userId, {
        lastLikedTracks: currentLikedTrackIds,
        isInitialized: true,
      });
    } catch (error) {
      console.error(`Error checking liked tracks for user ${userId}:`, error);
    }
  }

  private async makeSpotifyRequest(
    userId: number,
    url: string
  ): Promise<Response | null> {
    if (!this.checkRateLimit(userId)) {
      console.warn(`Rate limit exceeded for user ${userId}`);
      return null;
    }

    const userToken = await spotifyOAuth.getUserToken(userId);
    if (!userToken) {
      console.warn(
        `[Spotify API] ❌ User ${userId} - Cannot make request: token not available (expired, revoked, or missing from database).`
      );
      return null;
    }

    if (!this.hasRequiredScopes(userToken, url)) {
      const requiredScopes = this.getRequiredScopesForUrl(url);
      console.error(
        `[Spotify API] ❌ User ${userId} - Token missing required scopes [${requiredScopes.join(', ')}] for ${url}. Current scopes: [${userToken.scopes?.join(', ') || 'NONE'}]. User must re-authorize.`
      );
      return null;
    }

    const now = Date.now();
    const lastRequest = this.lastRequestTime.get(userId) || 0;
    const timeSinceLastRequest = now - lastRequest;

    if (timeSinceLastRequest < this.MIN_REQUEST_INTERVAL) {
      const waitTime = this.MIN_REQUEST_INTERVAL - timeSinceLastRequest;
      await new Promise<void>(resolve => {
        setImmediate(() => {
          setTimeout(() => resolve(), Math.min(waitTime, 100));
        });
      });
    }

    this.lastRequestTime.set(userId, Date.now());

    try {
      console.log(`[Spotify API] 🌐 User ${userId} - Making request to: ${url}`);
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${userToken.token_value}`,
          'Content-Type': 'application/json',
        },
      });

      this.updateRequestCount(userId);

      if (response.status === 401) {
        console.warn(
          `[Spotify API] ⚠️ User ${userId} - Token rejected by Spotify (401 Unauthorized). Attempting token refresh...`
        );
        const refreshedToken = await spotifyOAuth.getUserToken(userId);
        if (refreshedToken) {
          const retryResponse = await fetch(url, {
            headers: {
              Authorization: `Bearer ${refreshedToken.token_value}`,
              'Content-Type': 'application/json',
            },
          });
          this.updateRequestCount(userId);
          if (retryResponse.status === 401) {
            console.error(
              `[Spotify API] ❌ User ${userId} - Token refresh failed. Spotify still rejects the token. User needs to re-authorize the Spotify connection.`
            );
          }
          return retryResponse;
        }
        console.error(
          `[Spotify API] ❌ User ${userId} - Token refresh failed: no refresh_token available or refresh returned null. User must re-connect Spotify.`
        );
        return null;
      }

      if (response.status === 429) {
        console.warn(`Spotify rate limit hit for user ${userId}`);
        const retryAfter = response.headers.get('Retry-After');
        if (retryAfter) {
          const waitTime = parseInt(retryAfter) * 1000;
          await new Promise<void>(resolve => {
            setImmediate(() => {
              setTimeout(() => resolve(), Math.min(waitTime, 5000));
            });
          });
          return this.makeSpotifyRequest(userId, url);
        }
        return null;
      }

      if (!response.ok) {
        if (response.status === 403) {
          console.error(
            `[Spotify API] ❌ User ${userId} - Access forbidden (403). Token may lack required scopes or Spotify Premium subscription may be required for this endpoint.`
          );
        } else {
          console.error(
            `Spotify API error for user ${userId}: ${response.status} ${response.statusText}`
          );
        }
        return null;
      }

      console.log(`[Spotify API] ✅ User ${userId} - Request successful (${response.status})`);
      return response;
    } catch (error) {
      console.error(`Network error for user ${userId}:`, error);
      return null;
    }
  }

  private checkRateLimit(userId: number): boolean {
    const now = Date.now();
    const userRequests = this.requestCounts.get(userId);

    if (!userRequests) {
      return true;
    }

    if (now - userRequests.windowStart > this.RATE_LIMIT_WINDOW) {
      this.requestCounts.set(userId, { count: 0, windowStart: now });
      return true;
    }

    return userRequests.count < this.MAX_REQUESTS_PER_WINDOW;
  }

  private updateRequestCount(userId: number): void {
    const now = Date.now();
    const userRequests = this.requestCounts.get(userId);

    if (
      !userRequests ||
      now - userRequests.windowStart > this.RATE_LIMIT_WINDOW
    ) {
      this.requestCounts.set(userId, { count: 1, windowStart: now });
    } else {
      userRequests.count++;
    }
  }

  private hasRequiredScopes(userToken: UserToken, url: string): boolean {
    if (!userToken.scopes) return false;

    const scopes = userToken.scopes;
    const requiredScopes = this.getRequiredScopesForUrl(url);

    return requiredScopes.every(scope => scopes.includes(scope));
  }

  private getRequiredScopesForUrl(url: string): string[] {
    if (url.includes('/me/player')) {
      return ['user-read-playback-state'];
    }

    if (url.includes('/me/tracks')) {
      return ['user-library-read'];
    }

    return [];
  }

  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  private getUserState(userId: number) {
    if (!this.userStates.has(userId)) {
      this.userStates.set(userId, {
        lastTrack: null,
        lastPlaybackState: null,
        lastLikedTracks: [],
        isInitialized: false,
      });
    }
    return this.userStates.get(userId)!;
  }

  private updateUserState(
    userId: number,
    updates: Partial<ReturnType<typeof this.getUserState>>
  ) {
    const currentState = this.getUserState(userId);
    this.userStates.set(userId, { ...currentState, ...updates });
  }

  private async triggerTrackChanged(
    userId: number,
    previousTrack: SpotifyTrack | null,
    currentTrack: SpotifyTrack
  ): Promise<void> {
    await this.createEvent(userId, 'spotify.track_changed', {
      previous_track: previousTrack
        ? {
            id: previousTrack.id,
            name: previousTrack.name,
            artist: previousTrack.artists?.[0]?.name || 'Unknown',
            album: previousTrack.album?.name || 'Unknown',
            uri: previousTrack.uri,
          }
        : null,
      current_track: {
        id: currentTrack.id,
        name: currentTrack.name,
        artist: currentTrack.artists?.[0]?.name || 'Unknown',
        album: currentTrack.album?.name || 'Unknown',
        uri: currentTrack.uri,
      },
      timestamp: new Date().toISOString(),
    });
  }

  private async triggerPlaybackStarted(
    userId: number,
    track: SpotifyTrack | null,
    device: SpotifyPlaybackState['device']
  ): Promise<void> {
    if (!track) return;

    await this.createEvent(userId, 'spotify.playback_started', {
      track: {
        id: track.id,
        name: track.name,
        artist: track.artists?.[0]?.name || 'Unknown',
        album: track.album?.name || 'Unknown',
        uri: track.uri,
      },
      device: device
        ? {
            id: device.id,
            name: device.name,
            type: device.type,
          }
        : null,
      timestamp: new Date().toISOString(),
    });
  }

  private async triggerPlaybackPaused(
    userId: number,
    track: SpotifyTrack | null,
    device: SpotifyPlaybackState['device']
  ): Promise<void> {
    if (!track) return;

    await this.createEvent(userId, 'spotify.playback_paused', {
      track: {
        id: track.id,
        name: track.name,
        artist: track.artists?.[0]?.name || 'Unknown',
        album: track.album?.name || 'Unknown',
        uri: track.uri,
      },
      device: device
        ? {
            id: device.id,
            name: device.name,
            type: device.type,
          }
        : null,
      timestamp: new Date().toISOString(),
    });
  }

  private async triggerLikedSongAdded(
    userId: number,
    track: SpotifyTrack,
    addedAt: string
  ): Promise<void> {
    await this.createEvent(userId, 'spotify.liked_song_added', {
      track: {
        id: track.id,
        name: track.name,
        artist: track.artists?.[0]?.name || 'Unknown',
        album: track.album?.name || 'Unknown',
        uri: track.uri,
        duration_ms: track.duration_ms,
      },
      added_at: addedAt,
      timestamp: new Date().toISOString(),
    });
  }

  private async createEvent(
    userId: number,
    actionType: string,
    payload: Record<string, unknown>
  ): Promise<void> {
    const eventRepository = AppDataSource.getRepository(WebhookEvents);

    console.log(`[Spotify Poll] 📝 User ${userId} - Creating event: ${actionType}`);

    const event = eventRepository.create({
      action_type: actionType,
      user_id: userId,
      payload: payload,
      source: 'spotify-polling',
      status: 'received',
    });

    await eventRepository.save(event);
    console.log(`[Spotify Poll] ✅ User ${userId} - Event created: ${actionType} (ID: ${event.id})`);
  }
}

export const spotifyScheduler = new SpotifyScheduler();
