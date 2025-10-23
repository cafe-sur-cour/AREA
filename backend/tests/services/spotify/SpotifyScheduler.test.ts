// Mock node-cron and other dependencies BEFORE imports
const mockCronSchedule = jest.fn();
const mockCronTask = {
  destroy: jest.fn(),
};

jest.mock('node-cron', () => ({
  schedule: mockCronSchedule,
}));

// Mock AppDataSource
const mockWebhookConfigsRepository = {
  find: jest.fn(),
};
const mockWebhookEventsRepository = {
  create: jest.fn(data => data),
  save: jest.fn(),
};
const mockUserTokenRepository = {
  findOne: jest.fn(),
};

jest.mock('../../../src/config/db', () => ({
  AppDataSource: {
    getRepository: jest.fn(entity => {
      if (entity.name === 'WebhookConfigs') return mockWebhookConfigsRepository;
      if (entity.name === 'WebhookEvents') return mockWebhookEventsRepository;
      if (entity.name === 'UserToken') return mockUserTokenRepository;
      return {};
    }),
  },
}));

// Mock spotifyOAuth
const mockGetUserToken = jest.fn();
jest.mock('../../../src/services/services/spotify/oauth', () => ({
  spotifyOAuth: {
    getUserToken: mockGetUserToken,
  },
}));

// Mock global fetch
global.fetch = jest.fn();

import { SpotifyScheduler } from '../../../src/services/services/spotify/SpotifyScheduler';

describe('SpotifyScheduler', () => {
  let scheduler: SpotifyScheduler;
  let mockFetch: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    scheduler = new SpotifyScheduler();
    mockFetch = global.fetch as jest.Mock;
    mockCronSchedule.mockReturnValue(mockCronTask);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('start', () => {
    it('should start the scheduler', async () => {
      await scheduler.start();

      expect(mockCronSchedule).toHaveBeenCalledWith(
        '*/10 * * * * *',
        expect.any(Function)
      );
    });

    it('should not start if already running', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      await scheduler.start();
      await scheduler.start();

      expect(consoleSpy).toHaveBeenCalledWith(
        'Spotify scheduler is already running'
      );
      expect(mockCronSchedule).toHaveBeenCalledTimes(1);

      consoleSpy.mockRestore();
    });
  });

  describe('stop', () => {
    it('should stop the scheduler', async () => {
      await scheduler.start();
      await scheduler.stop();

      expect(mockCronTask.destroy).toHaveBeenCalled();
    });

    it('should not stop if not running', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      await scheduler.stop();

      expect(consoleSpy).toHaveBeenCalledWith(
        'Spotify scheduler is not running'
      );
      expect(mockCronTask.destroy).not.toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });

  describe('checkPlaybackState', () => {
    beforeEach(() => {
      mockGetUserToken.mockResolvedValue({
        token_value: 'test-token',
        scopes: ['user-read-playback-state'],
      });
    });

    it('should handle 204 no content (no playback)', async () => {
      mockWebhookConfigsRepository.find.mockResolvedValue([{ created_by: 1 }]);
      mockFetch.mockResolvedValue({ status: 204, ok: false });

      await scheduler.start();
      const cronCallback = mockCronSchedule.mock.calls[0][1];
      await cronCallback();

      // Should not throw
      expect(mockWebhookEventsRepository.save).not.toHaveBeenCalled();
    });
  });
});
