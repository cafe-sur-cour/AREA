import { ServiceSubscriptionManager } from '../../src/services/ServiceSubscriptionManager';
import { AppDataSource } from '../../src/config/db';
import { UserServiceSubscriptions } from '../../src/config/entity/UserServiceSubscriptions';
import { ExternalWebhooks } from '../../src/config/entity/ExternalWebhooks';
import { serviceRegistry } from '../../src/services/ServiceRegistry';

jest.mock('../../src/config/db');
jest.mock('../../src/services/ServiceRegistry', () => ({
  serviceRegistry: {
    getService: jest.fn(),
  },
}));

describe('ServiceSubscriptionManager', () => {
  let manager: ServiceSubscriptionManager;
  let mockRepo: any;
  let mockWebhookRepo: any;

  beforeEach(() => {
    jest.clearAllMocks();
    manager = new ServiceSubscriptionManager();

    mockRepo = {
      findOne: jest.fn(),
      find: jest.fn(),
      save: jest.fn(),
    };

    mockWebhookRepo = {
      find: jest.fn(),
      save: jest.fn(),
    };

    (AppDataSource.getRepository as jest.Mock).mockImplementation((entity) => {
      if (entity === UserServiceSubscriptions) {
        return mockRepo;
      }
      if (entity === ExternalWebhooks) {
        return mockWebhookRepo;
      }
      return {};
    });
  });

  describe('isUserSubscribed', () => {
    it('should return true for always subscribed services', async () => {
      (serviceRegistry.getService as jest.Mock).mockReturnValue({
        id: 'test-service',
        alwaysSubscribed: true,
      });

      const result = await manager.isUserSubscribed(1, 'test-service');

      expect(result).toBe(true);
      expect(mockRepo.findOne).not.toHaveBeenCalled();
    });

    it('should return true when user has active subscription', async () => {
      (serviceRegistry.getService as jest.Mock).mockReturnValue({
        id: 'test-service',
        alwaysSubscribed: false,
      });

      mockRepo.findOne.mockResolvedValue({
        user_id: 1,
        service: 'test-service',
        subscribed: true,
      });

      const result = await manager.isUserSubscribed(1, 'test-service');

      expect(result).toBe(true);
      expect(mockRepo.findOne).toHaveBeenCalledWith({
        where: {
          user_id: 1,
          service: 'test-service',
        },
      });
    });

    it('should return false when user has no subscription', async () => {
      (serviceRegistry.getService as jest.Mock).mockReturnValue({
        id: 'test-service',
        alwaysSubscribed: false,
      });

      mockRepo.findOne.mockResolvedValue(null);

      const result = await manager.isUserSubscribed(1, 'test-service');

      expect(result).toBe(false);
    });

    it('should return false when subscription is not active', async () => {
      (serviceRegistry.getService as jest.Mock).mockReturnValue({
        id: 'test-service',
        alwaysSubscribed: false,
      });

      mockRepo.findOne.mockResolvedValue({
        user_id: 1,
        service: 'test-service',
        subscribed: false,
      });

      const result = await manager.isUserSubscribed(1, 'test-service');

      expect(result).toBe(false);
    });

    it('should handle undefined service definition', async () => {
      (serviceRegistry.getService as jest.Mock).mockReturnValue(undefined);

      mockRepo.findOne.mockResolvedValue(null);

      const result = await manager.isUserSubscribed(1, 'unknown-service');

      expect(result).toBe(false);
    });
  });

  describe('getUserSubscription', () => {
    it('should return subscription when found', async () => {
      const mockSubscription = {
        user_id: 1,
        service: 'test-service',
        subscribed: true,
      };

      mockRepo.findOne.mockResolvedValue(mockSubscription);

      const result = await manager.getUserSubscription(1, 'test-service');

      expect(result).toBe(mockSubscription);
      expect(mockRepo.findOne).toHaveBeenCalledWith({
        where: {
          user_id: 1,
          service: 'test-service',
        },
      });
    });

    it('should return null when subscription not found', async () => {
      mockRepo.findOne.mockResolvedValue(null);

      const result = await manager.getUserSubscription(1, 'test-service');

      expect(result).toBeNull();
    });
  });

  describe('subscribeUser', () => {
    it('should update existing subscription', async () => {
      const existingSubscription = {
        user_id: 1,
        service: 'test-service',
        subscribed: false,
        subscribed_at: null,
        unsubscribed_at: new Date('2024-01-01'),
      };

      mockRepo.findOne.mockResolvedValue(existingSubscription);
      mockRepo.save.mockResolvedValue(existingSubscription);

      const result = await manager.subscribeUser(1, 'test-service');

      expect(result).toBe(existingSubscription);
      expect(existingSubscription.subscribed).toBe(true);
      expect(existingSubscription.subscribed_at).toBeInstanceOf(Date);
      expect(existingSubscription.unsubscribed_at).toBeNull();
      expect(mockRepo.save).toHaveBeenCalledWith(existingSubscription);
    });

    it('should create new subscription when none exists', async () => {
      mockRepo.findOne.mockResolvedValue(null);

      const newSubscription = {
        user_id: 1,
        service: 'test-service',
        subscribed: true,
        subscribed_at: expect.any(Date),
      };

      mockRepo.save.mockResolvedValue(newSubscription);

      const result = await manager.subscribeUser(1, 'test-service');

      expect(mockRepo.save).toHaveBeenCalled();
      const savedSubscription = mockRepo.save.mock.calls[0][0];
      expect(savedSubscription.user_id).toBe(1);
      expect(savedSubscription.service).toBe('test-service');
      expect(savedSubscription.subscribed).toBe(true);
      expect(savedSubscription.subscribed_at).toBeInstanceOf(Date);
    });
  });

  describe('unsubscribeUser', () => {
    it('should return null when subscription not found', async () => {
      mockRepo.findOne.mockResolvedValue(null);

      const result = await manager.unsubscribeUser(1, 'test-service');

      expect(result).toBeNull();
      expect(mockWebhookRepo.find).not.toHaveBeenCalled();
    });

    it('should unsubscribe user and delete webhooks', async () => {
      const subscription = {
        user_id: 1,
        service: 'test-service',
        subscribed: true,
        subscribed_at: new Date('2024-01-01'),
        unsubscribed_at: null,
      };

      mockRepo.findOne.mockResolvedValue(subscription);
      mockRepo.save.mockResolvedValue(subscription);

      const mockWebhook = {
        id: 123,
        user_id: 1,
        service: 'test-service',
        is_active: true,
      };

      mockWebhookRepo.find.mockResolvedValue([mockWebhook]);

      const mockDeleteWebhook = jest.fn().mockResolvedValue(undefined);
      (serviceRegistry.getService as jest.Mock).mockReturnValue({
        id: 'test-service',
        deleteWebhook: mockDeleteWebhook,
      });

      const result = await manager.unsubscribeUser(1, 'test-service');

      expect(result).toBe(subscription);
      expect(subscription.subscribed).toBe(false);
      expect(subscription.unsubscribed_at).toBeInstanceOf(Date);
      expect(mockWebhookRepo.find).toHaveBeenCalledWith({
        where: {
          user_id: 1,
          service: 'test-service',
          is_active: true,
        },
      });
      expect(mockDeleteWebhook).toHaveBeenCalledWith(1, 123);
      expect(mockRepo.save).toHaveBeenCalledWith(subscription);
    });

    it('should handle webhook deletion errors gracefully', async () => {
      const subscription = {
        user_id: 1,
        service: 'test-service',
        subscribed: true,
      };

      mockRepo.findOne.mockResolvedValue(subscription);
      mockRepo.save.mockResolvedValue(subscription);

      const mockWebhook = {
        id: 123,
        user_id: 1,
        service: 'test-service',
        is_active: true,
      };

      mockWebhookRepo.find.mockResolvedValue([mockWebhook]);
      mockWebhookRepo.save.mockResolvedValue(mockWebhook);

      const mockDeleteWebhook = jest
        .fn()
        .mockRejectedValue(new Error('Webhook deletion failed'));
      (serviceRegistry.getService as jest.Mock).mockReturnValue({
        id: 'test-service',
        deleteWebhook: mockDeleteWebhook,
      });

      const consoleErrorSpy = jest
        .spyOn(console, 'error')
        .mockImplementation();

      const result = await manager.unsubscribeUser(1, 'test-service');

      expect(result).toBe(subscription);
      expect(subscription.subscribed).toBe(false);
      expect(mockWebhook.is_active).toBe(false);
      expect(mockWebhookRepo.save).toHaveBeenCalledWith(mockWebhook);
      expect(consoleErrorSpy).toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });

    it('should handle webhook repo errors during unsubscribe', async () => {
      const subscription = {
        user_id: 1,
        service: 'test-service',
        subscribed: true,
      };

      mockRepo.findOne.mockResolvedValue(subscription);
      mockRepo.save.mockResolvedValue(subscription);
      mockWebhookRepo.find.mockRejectedValue(new Error('Database error'));

      const consoleErrorSpy = jest
        .spyOn(console, 'error')
        .mockImplementation();

      const result = await manager.unsubscribeUser(1, 'test-service');

      expect(result).toBe(subscription);
      expect(subscription.subscribed).toBe(false);
      expect(consoleErrorSpy).toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });

    it('should handle no active webhooks', async () => {
      const subscription = {
        user_id: 1,
        service: 'test-service',
        subscribed: true,
      };

      mockRepo.findOne.mockResolvedValue(subscription);
      mockRepo.save.mockResolvedValue(subscription);
      mockWebhookRepo.find.mockResolvedValue([]);

      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();

      const result = await manager.unsubscribeUser(1, 'test-service');

      expect(result).toBe(subscription);
      expect(consoleLogSpy).toHaveBeenCalledWith(
        'No active webhooks found for user 1 service test-service'
      );

      consoleLogSpy.mockRestore();
    });

    it('should handle service without deleteWebhook method', async () => {
      const subscription = {
        user_id: 1,
        service: 'test-service',
        subscribed: true,
      };

      mockRepo.findOne.mockResolvedValue(subscription);
      mockRepo.save.mockResolvedValue(subscription);

      const mockWebhook = {
        id: 123,
        user_id: 1,
        service: 'test-service',
        is_active: true,
      };

      mockWebhookRepo.find.mockResolvedValue([mockWebhook]);

      (serviceRegistry.getService as jest.Mock).mockReturnValue({
        id: 'test-service',
        // No deleteWebhook method
      });

      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();

      const result = await manager.unsubscribeUser(1, 'test-service');

      expect(result).toBe(subscription);
      expect(subscription.subscribed).toBe(false);
      expect(consoleLogSpy).toHaveBeenCalledWith(
        'Successfully deleted webhook 123 from test-service'
      );

      consoleLogSpy.mockRestore();
    });

    it('should delete multiple webhooks', async () => {
      const subscription = {
        user_id: 1,
        service: 'test-service',
        subscribed: true,
      };

      mockRepo.findOne.mockResolvedValue(subscription);
      mockRepo.save.mockResolvedValue(subscription);

      const mockWebhooks = [
        { id: 123, user_id: 1, service: 'test-service', is_active: true },
        { id: 456, user_id: 1, service: 'test-service', is_active: true },
        { id: 789, user_id: 1, service: 'test-service', is_active: true },
      ];

      mockWebhookRepo.find.mockResolvedValue(mockWebhooks);

      const mockDeleteWebhook = jest.fn().mockResolvedValue(undefined);
      (serviceRegistry.getService as jest.Mock).mockReturnValue({
        id: 'test-service',
        deleteWebhook: mockDeleteWebhook,
      });

      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();

      const result = await manager.unsubscribeUser(1, 'test-service');

      expect(result).toBe(subscription);
      expect(consoleLogSpy).toHaveBeenCalledWith(
        'Deleting 3 active webhooks for user 1 service test-service'
      );
      expect(mockDeleteWebhook).toHaveBeenCalledTimes(3);
      expect(mockDeleteWebhook).toHaveBeenCalledWith(1, 123);
      expect(mockDeleteWebhook).toHaveBeenCalledWith(1, 456);
      expect(mockDeleteWebhook).toHaveBeenCalledWith(1, 789);

      consoleLogSpy.mockRestore();
    });
  });

  describe('getUserSubscriptions', () => {
    it('should return all subscriptions for user', async () => {
      const mockSubscriptions = [
        { user_id: 1, service: 'service-a', subscribed: true },
        { user_id: 1, service: 'service-b', subscribed: false },
        { user_id: 1, service: 'service-c', subscribed: true },
      ];

      mockRepo.find.mockResolvedValue(mockSubscriptions);

      const result = await manager.getUserSubscriptions(1);

      expect(result).toBe(mockSubscriptions);
      expect(mockRepo.find).toHaveBeenCalledWith({
        where: {
          user_id: 1,
        },
        order: {
          service: 'ASC',
        },
      });
    });

    it('should return empty array when no subscriptions found', async () => {
      mockRepo.find.mockResolvedValue([]);

      const result = await manager.getUserSubscriptions(1);

      expect(result).toEqual([]);
    });
  });

  describe('autoSubscribeOnFirstLogin', () => {
    it('should return existing subscription if found', async () => {
      const existingSubscription = {
        user_id: 1,
        service: 'test-service',
        subscribed: true,
      };

      mockRepo.findOne.mockResolvedValue(existingSubscription);

      const result = await manager.autoSubscribeOnFirstLogin(1, 'test-service');

      expect(result).toBe(existingSubscription);
      expect(mockRepo.save).not.toHaveBeenCalled();
    });

    it('should create new subscription if none exists', async () => {
      mockRepo.findOne.mockResolvedValueOnce(null).mockResolvedValueOnce(null);

      const newSubscription = {
        user_id: 1,
        service: 'test-service',
        subscribed: true,
        subscribed_at: new Date(),
      };

      mockRepo.save.mockResolvedValue(newSubscription);

      const result = await manager.autoSubscribeOnFirstLogin(1, 'test-service');

      expect(mockRepo.save).toHaveBeenCalled();
      const savedSubscription = mockRepo.save.mock.calls[0][0];
      expect(savedSubscription.user_id).toBe(1);
      expect(savedSubscription.service).toBe('test-service');
      expect(savedSubscription.subscribed).toBe(true);
    });
  });
});
