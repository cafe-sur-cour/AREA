// Set environment variables before imports
process.env.SERVICE_SPOTIFY_API_BASE_URL = 'https://api.spotify.com';

// Mock global fetch
global.fetch = jest.fn();

import { SpotifyReactionExecutor } from '../../../src/services/services/spotify/executor';
import type { ReactionExecutionContext } from '../../../src/types/service';

describe('SpotifyReactionExecutor', () => {
  let executor: SpotifyReactionExecutor;
  let mockFetch: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    executor = new SpotifyReactionExecutor();
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
    it('should return error if no access token', async () => {
      const context: ReactionExecutionContext = {
        ...createContext('spotify.skip_track'),
        serviceConfig: { credentials: {} },
      };

      const result = await executor.execute(context);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Spotify access token not configured');
    });

    it('should return error for unknown reaction type', async () => {
      const context = createContext('spotify.unknown_action');

      const result = await executor.execute(context);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Unknown reaction type');
    });

    it('should handle general execution errors', async () => {
      const context = createContext('spotify.skip_track');
      mockFetch.mockRejectedValue(new Error('Network error'));

      const result = await executor.execute(context);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Network error');
    });
  });

  describe('skipTrack', () => {
    it('should skip track successfully with 204 response', async () => {
      mockFetch.mockResolvedValue({
        status: 204,
        ok: true,
      });

      const context = createContext('spotify.skip_track');
      const result = await executor.execute(context);

      expect(result.success).toBe(true);
      expect(result.output).toEqual({ success: true });
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.spotify.com/v1/me/player/next',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            Authorization: 'Bearer test-access-token',
          }),
        })
      );
    });

    it('should handle no active device error (403)', async () => {
      mockFetch.mockResolvedValue({
        status: 403,
        ok: false,
      });

      const context = createContext('spotify.skip_track');
      const result = await executor.execute(context);

      expect(result.success).toBe(false);
      expect(result.error).toContain('No active device found');
    });

    it('should handle API errors', async () => {
      mockFetch.mockResolvedValue({
        status: 500,
        ok: false,
        json: jest.fn().mockResolvedValue({
          error: { message: 'Internal server error' },
        }),
      });

      const context = createContext('spotify.skip_track');
      const result = await executor.execute(context);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Spotify API error');
      expect(result.error).toContain('500');
    });

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValue(new Error('Connection refused'));

      const context = createContext('spotify.skip_track');
      const result = await executor.execute(context);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Network error while skipping track');
    });
  });

  describe('pauseResumePlayback', () => {
    it('should pause playback when currently playing', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: jest.fn().mockResolvedValue({
            is_playing: true,
            item: { id: 'track-123' },
          }),
        })
        .mockResolvedValueOnce({
          status: 204,
          ok: true,
        });

      const context = createContext('spotify.pause_resume_playback');
      const result = await executor.execute(context);

      expect(result.success).toBe(true);
      expect(result.output).toEqual({ action: 'pause', success: true });
      expect(mockFetch).toHaveBeenNthCalledWith(
        2,
        'https://api.spotify.com/v1/me/player/pause',
        expect.any(Object)
      );
    });

    it('should resume playback when currently paused', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: jest.fn().mockResolvedValue({
            is_playing: false,
            item: { id: 'track-123' },
          }),
        })
        .mockResolvedValueOnce({
          status: 204,
          ok: true,
        });

      const context = createContext('spotify.pause_resume_playback');
      const result = await executor.execute(context);

      expect(result.success).toBe(true);
      expect(result.output).toEqual({ action: 'resume', success: true });
      expect(mockFetch).toHaveBeenNthCalledWith(
        2,
        'https://api.spotify.com/v1/me/player/play',
        expect.any(Object)
      );
    });

    it('should handle no active playback (204)', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 204,
      });

      const context = createContext('spotify.pause_resume_playback');
      const result = await executor.execute(context);

      expect(result.success).toBe(false);
      expect(result.error).toBe('No active playback found');
    });

    it('should handle invalid JSON response', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: jest.fn().mockRejectedValue(new Error('Invalid JSON')),
      });

      const context = createContext('spotify.pause_resume_playback');
      const result = await executor.execute(context);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Failed to parse playback state response');
    });

    it('should handle no active device during toggle (403)', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: jest.fn().mockResolvedValue({
            is_playing: true,
            item: { id: 'track-123' },
          }),
        })
        .mockResolvedValueOnce({
          status: 403,
          ok: false,
        });

      const context = createContext('spotify.pause_resume_playback');
      const result = await executor.execute(context);

      expect(result.success).toBe(false);
      expect(result.error).toContain('No active device found');
    });
  });

  describe('addSongToPlaylist', () => {
    it('should add specified track to playlist', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({}),
      });

      const context = createContext('spotify.add_song_to_playlist', {
        playlist_id: 'playlist-123',
        track_uri: 'spotify:track:abc123',
      });
      const result = await executor.execute(context);

      expect(result.success).toBe(true);
      expect(result.output).toEqual({
        playlist_id: 'playlist-123',
        added_to_liked: false,
        track_uri: 'spotify:track:abc123',
        success: true,
      });
    });

    it('should add currently playing track when no URI provided', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: jest.fn().mockResolvedValue({
            item: { uri: 'spotify:track:current' },
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: jest.fn().mockResolvedValue({}),
        });

      const context = createContext('spotify.add_song_to_playlist', {
        playlist_id: 'playlist-123',
      });
      const result = await executor.execute(context);

      expect(result.success).toBe(true);
      expect(result.output?.track_uri).toBe('spotify:track:current');
    });

    it('should add to Liked Songs when no playlist specified', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({}),
      });

      const context = createContext('spotify.add_song_to_playlist', {
        track_uri: 'spotify:track:abc123',
      });
      const result = await executor.execute(context);

      expect(result.success).toBe(true);
      expect(result.output).toEqual({
        playlist_id: null,
        added_to_liked: true,
        track_uri: 'spotify:track:abc123',
        success: true,
      });
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.spotify.com/v1/me/tracks',
        expect.objectContaining({
          method: 'PUT',
        })
      );
    });

    it('should handle no currently playing track', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 204,
      });

      const context = createContext('spotify.add_song_to_playlist', {});
      const result = await executor.execute(context);

      expect(result.success).toBe(false);
      expect(result.error).toContain('No currently playing track found');
    });

    it('should handle invalid playback state JSON', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: jest.fn().mockRejectedValue(new Error('Parse error')),
      });

      const context = createContext('spotify.add_song_to_playlist', {});
      const result = await executor.execute(context);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Failed to parse playback state response');
    });

    it('should handle API errors when adding to playlist', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 404,
        json: jest.fn().mockResolvedValue({
          error: { message: 'Playlist not found' },
        }),
      });

      const context = createContext('spotify.add_song_to_playlist', {
        playlist_id: 'invalid',
        track_uri: 'spotify:track:abc',
      });
      const result = await executor.execute(context);

      expect(result.success).toBe(false);
      expect(result.error).toContain('404');
    });
  });

  describe('playSpecificTrack', () => {
    it('should play track successfully', async () => {
      mockFetch.mockResolvedValue({
        status: 204,
        ok: true,
      });

      const context = createContext('spotify.play_specific_track', {
        uri: 'spotify:track:abc123',
      });
      const result = await executor.execute(context);

      expect(result.success).toBe(true);
      expect(result.output).toEqual({
        uri: 'spotify:track:abc123',
        device_id: null,
        success: true,
      });
    });

    it('should play track on specified device', async () => {
      mockFetch.mockResolvedValue({
        status: 204,
        ok: true,
      });

      const context = createContext('spotify.play_specific_track', {
        uri: 'spotify:track:abc123',
        device_id: 'device-456',
      });
      const result = await executor.execute(context);

      expect(result.success).toBe(true);
      expect(result.output?.device_id).toBe('device-456');
    });

    it('should require URI parameter', async () => {
      const context = createContext('spotify.play_specific_track', {});
      const result = await executor.execute(context);

      expect(result.success).toBe(false);
      expect(result.error).toBe('URI is required');
    });

    it('should handle no active device (403)', async () => {
      mockFetch.mockResolvedValue({
        status: 403,
        ok: false,
      });

      const context = createContext('spotify.play_specific_track', {
        uri: 'spotify:track:abc123',
      });
      const result = await executor.execute(context);

      expect(result.success).toBe(false);
      expect(result.error).toContain('No active device found');
    });

    it('should handle device not found (404)', async () => {
      mockFetch.mockResolvedValue({
        status: 404,
        ok: false,
      });

      const context = createContext('spotify.play_specific_track', {
        uri: 'spotify:track:abc123',
        device_id: 'invalid',
      });
      const result = await executor.execute(context);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Device not found');
    });

    it('should handle API errors', async () => {
      mockFetch.mockResolvedValue({
        status: 500,
        ok: false,
        json: jest.fn().mockResolvedValue({
          error: { message: 'Server error' },
        }),
      });

      const context = createContext('spotify.play_specific_track', {
        uri: 'spotify:track:abc123',
      });
      const result = await executor.execute(context);

      expect(result.success).toBe(false);
      expect(result.error).toContain('500');
    });
  });

  describe('setVolume', () => {
    it('should set volume successfully', async () => {
      mockFetch.mockResolvedValue({
        status: 204,
        ok: true,
      });

      const context = createContext('spotify.set_volume', {
        volume_percent: 50,
      });
      const result = await executor.execute(context);

      expect(result.success).toBe(true);
      expect(result.output).toEqual({
        volume_percent: 50,
        device_id: null,
        success: true,
      });
    });

    it('should set volume on specified device', async () => {
      mockFetch.mockResolvedValue({
        status: 204,
        ok: true,
      });

      const context = createContext('spotify.set_volume', {
        volume_percent: 75,
        device_id: 'device-123',
      });
      const result = await executor.execute(context);

      expect(result.success).toBe(true);
      expect(result.output?.device_id).toBe('device-123');
    });

    it('should round volume to integer', async () => {
      mockFetch.mockResolvedValue({
        status: 204,
        ok: true,
      });

      const context = createContext('spotify.set_volume', {
        volume_percent: 75.7,
      });
      const result = await executor.execute(context);

      expect(result.output?.volume_percent).toBe(76);
    });

    it('should validate volume range - too low', async () => {
      const context = createContext('spotify.set_volume', {
        volume_percent: -10,
      });
      const result = await executor.execute(context);

      expect(result.success).toBe(false);
      expect(result.error).toContain('between 0 and 100');
    });

    it('should validate volume range - too high', async () => {
      const context = createContext('spotify.set_volume', {
        volume_percent: 150,
      });
      const result = await executor.execute(context);

      expect(result.success).toBe(false);
      expect(result.error).toContain('between 0 and 100');
    });

    it('should validate volume undefined', async () => {
      const context = createContext('spotify.set_volume', {});
      const result = await executor.execute(context);

      expect(result.success).toBe(false);
      expect(result.error).toContain('between 0 and 100');
    });

    it('should handle no active device (403)', async () => {
      mockFetch.mockResolvedValue({
        status: 403,
        ok: false,
      });

      const context = createContext('spotify.set_volume', {
        volume_percent: 50,
      });
      const result = await executor.execute(context);

      expect(result.success).toBe(false);
      expect(result.error).toContain('No active device found');
    });

    it('should handle device not found (404)', async () => {
      mockFetch.mockResolvedValue({
        status: 404,
        ok: false,
      });

      const context = createContext('spotify.set_volume', {
        volume_percent: 50,
        device_id: 'invalid',
      });
      const result = await executor.execute(context);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Device not found');
    });

    it('should handle API errors', async () => {
      mockFetch.mockResolvedValue({
        status: 500,
        ok: false,
        json: jest.fn().mockResolvedValue({
          error: { message: 'Server error' },
        }),
      });

      const context = createContext('spotify.set_volume', {
        volume_percent: 50,
      });
      const result = await executor.execute(context);

      expect(result.success).toBe(false);
      expect(result.error).toContain('500');
    });
  });
});
