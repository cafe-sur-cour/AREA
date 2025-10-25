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

jest.mock('../../../src/config/db', () => ({
  AppDataSource: {
    getRepository: jest.fn(entity => {
      if (entity.name === 'WebhookConfigs') return mockWebhookConfigsRepository;
      if (entity.name === 'WebhookEvents') return mockWebhookEventsRepository;
      return {};
    }),
  },
}));

// Mock redditOAuth
const mockGetUserToken = jest.fn();
jest.mock('../../../src/services/services/reddit/oauth', () => ({
  redditOAuth: {
    getUserToken: mockGetUserToken,
  },
}));

// Mock global fetch
global.fetch = jest.fn();

import { RedditScheduler } from '../../../src/services/services/reddit/RedditScheduler';

describe('RedditScheduler', () => {
  let scheduler: RedditScheduler;
  let mockFetch: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    scheduler = new RedditScheduler();
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
        '*/5 * * * * *',
        expect.any(Function)
      );
    });

    it('should not start if already running', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      await scheduler.start();
      await scheduler.start();

      expect(consoleSpy).toHaveBeenCalledWith(
        'Reddit scheduler is already running'
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
        'Reddit scheduler is not running'
      );
      expect(mockCronTask.destroy).not.toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });
});
