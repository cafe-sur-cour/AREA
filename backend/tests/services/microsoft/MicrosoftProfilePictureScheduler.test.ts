import { MicrosoftProfilePictureScheduler } from '../../../src/services/services/microsoft/MicrosoftProfilePictureScheduler';
import { AppDataSource } from '../../../src/config/db';
import { WebhookConfigs } from '../../../src/config/entity/WebhookConfigs';
import { WebhookEvents } from '../../../src/config/entity/WebhookEvents';
import { UserServiceSubscriptions } from '../../../src/config/entity/UserServiceSubscriptions';
import { microsoftOAuth } from '../../../src/services/services/microsoft/oauth';

jest.mock('../../../src/config/db');
jest.mock('../../../src/services/services/microsoft/oauth');
jest.mock('node-fetch', () => jest.fn());

describe('MicrosoftProfilePictureScheduler', () => {
  let scheduler: MicrosoftProfilePictureScheduler;
  let mockWebhookConfigsRepo: any;
  let mockWebhookEventsRepo: any;
  let mockUserServiceSubscriptionsRepo: any;

  beforeEach(() => {
    jest.clearAllMocks();
    scheduler = new MicrosoftProfilePictureScheduler();

    mockWebhookConfigsRepo = {
      find: jest.fn(),
    };

    mockWebhookEventsRepo = {
      create: jest.fn(),
      save: jest.fn(),
    };

    mockUserServiceSubscriptionsRepo = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    };

    (AppDataSource.getRepository as jest.Mock).mockImplementation(entity => {
      if (entity === WebhookConfigs) return mockWebhookConfigsRepo;
      if (entity === WebhookEvents) return mockWebhookEventsRepo;
      if (entity === UserServiceSubscriptions)
        return mockUserServiceSubscriptionsRepo;
      return {};
    });
  });

  afterEach(async () => {
    await scheduler.stop();
  });

  describe('start/stop', () => {
    it('should start the scheduler successfully', async () => {
      mockWebhookConfigsRepo.find.mockResolvedValue([]);
      (microsoftOAuth.getUserToken as jest.Mock).mockResolvedValue(null);

      await scheduler.start();

      expect(scheduler['isRunning']).toBe(true);
      expect(scheduler['intervalId']).not.toBeNull();
    });

    it('should stop the scheduler successfully', async () => {
      mockWebhookConfigsRepo.find.mockResolvedValue([]);
      (microsoftOAuth.getUserToken as jest.Mock).mockResolvedValue(null);

      await scheduler.start();
      expect(scheduler['isRunning']).toBe(true);

      await scheduler.stop();

      expect(scheduler['isRunning']).toBe(false);
      expect(scheduler['intervalId']).toBeNull();
    });
  });

  describe('checkProfilePictureChanges', () => {
    beforeEach(async () => {
      await scheduler.start();
    });

    it('should handle no active mappings', async () => {
      mockWebhookConfigsRepo.find.mockResolvedValue([]);

      await scheduler['checkProfilePictureChanges']();

      expect(mockWebhookConfigsRepo.find).toHaveBeenCalled();
    });

    it('should process mappings for multiple users', async () => {
      const mappings = [
        {
          id: 1,
          created_by: 1,
          action: { type: 'microsoft.profile_picture_changed' },
        },
        {
          id: 2,
          created_by: 2,
          action: { type: 'microsoft.profile_picture_changed' },
        },
      ];

      mockWebhookConfigsRepo.find.mockResolvedValue(mappings);
      (microsoftOAuth.getUserToken as jest.Mock).mockResolvedValue(null);

      await scheduler['checkProfilePictureChanges']();

      expect(microsoftOAuth.getUserToken).toHaveBeenCalledTimes(2);
    });
  });
});
