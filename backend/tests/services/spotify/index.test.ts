// Mock all dependencies BEFORE importing
const mockSchedulerStart = jest.fn();
const mockSchedulerStop = jest.fn();
const mockInitializeSpotifyPassport = jest.fn();
const mockSpotifyOAuthGetUserToken = jest.fn();

jest.mock('../../../src/services/services/spotify/SpotifyScheduler', () => ({
  spotifyScheduler: {
    start: mockSchedulerStart,
    stop: mockSchedulerStop,
  },
}));

jest.mock('../../../src/services/services/spotify/passport', () => ({
  initializeSpotifyPassport: mockInitializeSpotifyPassport,
}));

jest.mock('../../../src/services/services/spotify/oauth', () => ({
  spotifyOAuth: {
    getUserToken: mockSpotifyOAuthGetUserToken,
  },
}));

jest.mock('../../../src/services/services/spotify/executor', () => ({
  spotifyReactionExecutor: {},
}));

import spotifyService, {
  initialize,
  cleanup,
  executor,
} from '../../../src/services/services/spotify/index';

describe('Spotify Service Index', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset mock implementations
    mockSchedulerStart.mockResolvedValue(undefined);
    mockSchedulerStop.mockResolvedValue(undefined);
    mockInitializeSpotifyPassport.mockReturnValue(undefined);
  });

  describe('spotifyService', () => {
    it('should export a service object', () => {
      expect(spotifyService).toBeDefined();
      expect(typeof spotifyService).toBe('object');
    });

    it('should have correct service id', () => {
      expect(spotifyService.id).toBe('spotify');
    });

    it('should have correct service name', () => {
      expect(spotifyService.name).toBe('Spotify');
    });

    it('should have correct service description', () => {
      expect(spotifyService.description).toBe(
        'Spotify service for music streaming integration'
      );
    });

    it('should have correct version', () => {
      expect(spotifyService.version).toBe('1.0.0');
    });

    it('should have an icon', () => {
      expect(spotifyService.icon).toBeDefined();
      expect(typeof spotifyService.icon).toBe('string');
      expect(spotifyService.icon).toContain('svg');
      expect(spotifyService.icon).toContain('#1DB954'); // Spotify green color
    });

    it('should have actions array', () => {
      expect(Array.isArray(spotifyService.actions)).toBe(true);
      expect(spotifyService.actions.length).toBeGreaterThan(0);
    });

    it('should have reactions array', () => {
      expect(Array.isArray(spotifyService.reactions)).toBe(true);
      expect(spotifyService.reactions.length).toBeGreaterThan(0);
    });

    it('should have OAuth configuration', () => {
      expect(spotifyService.oauth).toBeDefined();
      expect(spotifyService.oauth?.enabled).toBe(true);
      expect(spotifyService.oauth?.supportsLogin).toBe(false);
    });

    it('should have getCredentials function', () => {
      expect(spotifyService.getCredentials).toBeDefined();
      expect(typeof spotifyService.getCredentials).toBe('function');
    });
  });

  describe('getCredentials', () => {
    it('should return credentials when token exists', async () => {
      const mockToken = {
        token_value: 'test-access-token',
        user_id: 1,
        token_type: 'spotify_access_token',
      };

      mockSpotifyOAuthGetUserToken.mockResolvedValue(mockToken);

      const credentials = await spotifyService.getCredentials?.(1);

      expect(mockSpotifyOAuthGetUserToken).toHaveBeenCalledWith(1);
      expect(credentials).toEqual({ access_token: 'test-access-token' });
    });

    it('should return empty object when no token exists', async () => {
      mockSpotifyOAuthGetUserToken.mockResolvedValue(null);

      const credentials = await spotifyService.getCredentials?.(1);

      expect(mockSpotifyOAuthGetUserToken).toHaveBeenCalledWith(1);
      expect(credentials).toEqual({});
    });

    it('should handle errors gracefully', async () => {
      mockSpotifyOAuthGetUserToken.mockRejectedValue(
        new Error('Database error')
      );

      await expect(spotifyService.getCredentials?.(1)).rejects.toThrow(
        'Database error'
      );
    });
  });

  describe('initialize', () => {
    it('should initialize passport and start scheduler', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      await initialize();

      expect(mockInitializeSpotifyPassport).toHaveBeenCalled();
      expect(mockSchedulerStart).toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalledWith(
        'Initializing Spotify service...'
      );
      expect(consoleSpy).toHaveBeenCalledWith('Spotify service initialized');

      consoleSpy.mockRestore();
    });

    it('should handle initialization errors', async () => {
      mockSchedulerStart.mockRejectedValue(new Error('Start failed'));

      await expect(initialize()).rejects.toThrow('Start failed');
    });
  });

  describe('cleanup', () => {
    it('should stop scheduler', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      await cleanup();

      expect(mockSchedulerStop).toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalledWith('Cleaning up Spotify service...');
      expect(consoleSpy).toHaveBeenCalledWith('Spotify service cleaned up');

      consoleSpy.mockRestore();
    });

    it('should handle cleanup errors', async () => {
      mockSchedulerStop.mockRejectedValue(new Error('Stop failed'));

      await expect(cleanup()).rejects.toThrow('Stop failed');
    });
  });

  describe('executor', () => {
    it('should export executor', () => {
      expect(executor).toBeDefined();
      expect(typeof executor).toBe('object');
    });
  });

  describe('Service lifecycle', () => {
    it('should initialize and cleanup successfully', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      await initialize();
      await cleanup();

      expect(mockInitializeSpotifyPassport).toHaveBeenCalledTimes(1);
      expect(mockSchedulerStart).toHaveBeenCalledTimes(1);
      expect(mockSchedulerStop).toHaveBeenCalledTimes(1);

      consoleSpy.mockRestore();
    });

    it('should handle multiple initialize calls', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      await initialize();
      await initialize();

      expect(mockInitializeSpotifyPassport).toHaveBeenCalledTimes(2);
      expect(mockSchedulerStart).toHaveBeenCalledTimes(2);

      consoleSpy.mockRestore();
    });

    it('should handle multiple cleanup calls', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      await cleanup();
      await cleanup();

      expect(mockSchedulerStop).toHaveBeenCalledTimes(2);

      consoleSpy.mockRestore();
    });
  });

  describe('Service integration', () => {
    it('should have actions referencing config schemas', () => {
      spotifyService.actions.forEach(action => {
        expect(action.configSchema).toBeDefined();
        expect(action.configSchema.name).toBeDefined();
      });
    });

    it('should have reactions referencing config schemas', () => {
      spotifyService.reactions.forEach(reaction => {
        expect(reaction.configSchema).toBeDefined();
        expect(reaction.configSchema.name).toBeDefined();
      });
    });

    it('should have all actions with required metadata', () => {
      spotifyService.actions.forEach(action => {
        expect(action.id).toBeDefined();
        expect(action.name).toBeDefined();
        expect(action.description).toBeDefined();
        expect(action.metadata).toBeDefined();
        expect(action.metadata.requiresAuth).toBe(true);
      });
    });

    it('should have all reactions with required metadata', () => {
      spotifyService.reactions.forEach(reaction => {
        expect(reaction.id).toBeDefined();
        expect(reaction.name).toBeDefined();
        expect(reaction.description).toBeDefined();
        expect(reaction.metadata).toBeDefined();
        expect(reaction.metadata.requiresAuth).toBe(true);
      });
    });

    it('should have unique action IDs', () => {
      const actionIds = spotifyService.actions.map(a => a.id);
      const uniqueIds = new Set(actionIds);
      expect(uniqueIds.size).toBe(actionIds.length);
    });

    it('should have unique reaction IDs', () => {
      const reactionIds = spotifyService.reactions.map(r => r.id);
      const uniqueIds = new Set(reactionIds);
      expect(uniqueIds.size).toBe(reactionIds.length);
    });

    it('should have all action IDs starting with spotify.', () => {
      spotifyService.actions.forEach(action => {
        expect(action.id).toMatch(/^spotify\./);
      });
    });

    it('should have all reaction IDs starting with spotify.', () => {
      spotifyService.reactions.forEach(reaction => {
        expect(reaction.id).toMatch(/^spotify\./);
      });
    });
  });
});
