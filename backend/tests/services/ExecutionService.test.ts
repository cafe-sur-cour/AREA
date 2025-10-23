import { ExecutionService } from '../../src/services/ExecutionService';
import { AppDataSource } from '../../src/config/db';
import { WebhookEvents } from '../../src/config/entity/WebhookEvents';
import { WebhookConfigs } from '../../src/config/entity/WebhookConfigs';
import { WebhookReactions } from '../../src/config/entity/WebhookReactions';
import { WebhookFailures } from '../../src/config/entity/WebhookFailures';
import { serviceRegistry } from '../../src/services/ServiceRegistry';
import { reactionExecutorRegistry } from '../../src/services/ReactionExecutorRegistry';
import { interpolatePayload } from '../../src/utils/payloadInterpolation';

jest.mock('../../src/config/db', () => ({
  AppDataSource: {
    getRepository: jest.fn(),
  },
}));

jest.mock('../../src/services/ServiceRegistry');
jest.mock('../../src/services/ReactionExecutorRegistry');
jest.mock('../../src/utils/payloadInterpolation');

describe('ExecutionService', () => {
  let service: ExecutionService;
  let mockEventRepository: any;
  let mockMappingRepository: any;
  let mockReactionRepository: any;
  let mockFailureRepository: any;

  beforeEach(() => {
    jest.clearAllMocks();

    mockEventRepository = {
      find: jest.fn(),
      findOne: jest.fn(),
      findOneBy: jest.fn(),
      save: jest.fn(),
      create: jest.fn(),
    };

    mockMappingRepository = {
      find: jest.fn(),
      findOne: jest.fn(),
    };

    mockReactionRepository = {
      create: jest.fn(),
      save: jest.fn(),
    };

    mockFailureRepository = {
      create: jest.fn(),
      save: jest.fn(),
    };

    (AppDataSource.getRepository as jest.Mock).mockImplementation(entity => {
      if (entity === WebhookEvents) return mockEventRepository;
      if (entity === WebhookConfigs) return mockMappingRepository;
      if (entity === WebhookReactions) return mockReactionRepository;
      if (entity === WebhookFailures) return mockFailureRepository;
      return {};
    });

    (interpolatePayload as jest.Mock).mockImplementation(config => config);

    service = new ExecutionService();
  });

  afterEach(async () => {
    await service.stop();
  });

  describe('start and stop', () => {
    it('should start the execution service', async () => {
      mockEventRepository.find.mockResolvedValue([]);

      await service.start();

      expect(mockEventRepository.find).toHaveBeenCalled();
    });

    it('should not start if already running', async () => {
      mockEventRepository.find.mockResolvedValue([]);

      await service.start();
      const firstCallCount = mockEventRepository.find.mock.calls.length;

      await service.start();

      expect(mockEventRepository.find.mock.calls.length).toBe(firstCallCount);
    });

    it('should stop the execution service', async () => {
      mockEventRepository.find.mockResolvedValue([]);

      await service.start();
      await service.stop();

      expect(service['isRunning']).toBe(false);
    });

    it('should clear scheduled reactions on stop', async () => {
      mockEventRepository.find.mockResolvedValue([]);

      await service.start();
      await service.stop();

      expect(service.getScheduledReactions().length).toBe(0);
    });

    it('should do nothing if stop called when not running', async () => {
      await service.stop();

      expect(mockEventRepository.find).not.toHaveBeenCalled();
    });
  });

  describe('cancelScheduledReaction', () => {
    it('should return false for non-existent reaction', () => {
      const result = service.cancelScheduledReaction('non-existent');
      expect(result).toBe(false);
    });
  });

  describe('getScheduledReactions', () => {
    it('should return empty array when no reactions scheduled', () => {
      const reactions = service.getScheduledReactions();
      expect(reactions).toEqual([]);
    });
  });

  describe('loadMappingsForAction', () => {
    it('should load specific mapping when mappingId provided', async () => {
      const mockMapping = {
        id: 1,
        name: 'Test',
        created_by: 1,
        is_active: true,
        action: { type: 'test.action' },
        reactions: [],
      };

      mockMappingRepository.findOne.mockResolvedValue(mockMapping);

      const result = await service['loadMappingsForAction'](
        { action_type: 'test.action', user_id: 1 } as any,
        1
      );

      expect(result).toEqual([mockMapping]);
      expect(mockMappingRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1, created_by: 1, is_active: true },
      });
    });

    it('should return empty array when specific mapping not found', async () => {
      mockMappingRepository.findOne.mockResolvedValue(null);

      const result = await service['loadMappingsForAction'](
        { action_type: 'test.action', user_id: 1 } as any,
        999
      );

      expect(result).toEqual([]);
    });

    it('should load shared event mappings', async () => {
      const mockMappings = [
        {
          id: 1,
          created_by: 1,
          is_active: true,
          action: { type: 'test.action' },
          reactions: [],
        },
        {
          id: 2,
          created_by: 2,
          is_active: true,
          action: { type: 'test.action' },
          reactions: [],
        },
      ];

      mockMappingRepository.find.mockResolvedValue(mockMappings);
      (serviceRegistry.getActionByType as jest.Mock).mockReturnValue({
        metadata: { sharedEvents: true },
      });

      const result = await service['loadMappingsForAction']({
        action_type: 'test.action',
        user_id: 1,
        source: 'webhook',
        payload: {},
      } as any);

      expect(result).toEqual(mockMappings);
    });

    it('should filter shared events with sync filter', async () => {
      const mockMappings = [
        {
          id: 1,
          created_by: 1,
          is_active: true,
          action: { type: 'test.action', config: { filter: 'A' } },
          reactions: [],
        },
        {
          id: 2,
          created_by: 2,
          is_active: true,
          action: { type: 'test.action', config: { filter: 'B' } },
          reactions: [],
        },
      ];

      mockMappingRepository.find.mockResolvedValue(mockMappings);
      (serviceRegistry.getActionByType as jest.Mock).mockReturnValue({
        metadata: {
          sharedEvents: true,
          sharedEventFilter: (event: any, mapping: any) =>
            mapping.action.config?.filter === 'A',
        },
      });

      const result = await service['loadMappingsForAction']({
        action_type: 'test.action',
        user_id: 1,
        source: 'webhook',
        payload: {},
      } as any);

      expect(result).toHaveLength(1);
      expect(result[0]?.id).toBe(1);
    });

    it('should filter shared events with async filter', async () => {
      const mockMappings = [
        {
          id: 1,
          created_by: 1,
          is_active: true,
          action: { type: 'test.action', config: { filter: 'A' } },
          reactions: [],
        },
        {
          id: 2,
          created_by: 2,
          is_active: true,
          action: { type: 'test.action', config: { filter: 'B' } },
          reactions: [],
        },
      ];

      mockMappingRepository.find.mockResolvedValue(mockMappings);
      (serviceRegistry.getActionByType as jest.Mock).mockReturnValue({
        metadata: {
          sharedEvents: true,
          sharedEventFilter: async (event: any, mapping: any) => {
            return mapping.action.config?.filter === 'A';
          },
        },
      });

      const result = await service['loadMappingsForAction']({
        action_type: 'test.action',
        user_id: 1,
        source: 'webhook',
        payload: {},
      } as any);

      expect(result).toHaveLength(1);
      expect(result[0]?.id).toBe(1);
    });

    it('should handle filter errors gracefully', async () => {
      const mockMappings = [
        {
          id: 1,
          created_by: 1,
          is_active: true,
          action: { type: 'test.action' },
          reactions: [],
        },
      ];

      mockMappingRepository.find.mockResolvedValue(mockMappings);
      (serviceRegistry.getActionByType as jest.Mock).mockReturnValue({
        metadata: {
          sharedEvents: true,
          sharedEventFilter: () => {
            throw new Error('Filter error');
          },
        },
      });

      const result = await service['loadMappingsForAction']({
        action_type: 'test.action',
        user_id: 1,
        source: 'webhook',
        payload: {},
      } as any);

      expect(result).toEqual([]);
    });

    it('should handle async filter errors gracefully', async () => {
      const mockMappings = [
        {
          id: 1,
          created_by: 1,
          is_active: true,
          action: { type: 'test.action' },
          reactions: [],
        },
      ];

      mockMappingRepository.find.mockResolvedValue(mockMappings);
      (serviceRegistry.getActionByType as jest.Mock).mockReturnValue({
        metadata: {
          sharedEvents: true,
          sharedEventFilter: async () => {
            throw new Error('Async filter error');
          },
        },
      });

      const result = await service['loadMappingsForAction']({
        action_type: 'test.action',
        user_id: 1,
        source: 'webhook',
        payload: {},
      } as any);

      expect(result).toEqual([]);
    });

    it('should load user-specific mappings', async () => {
      const mockMappings = [
        {
          id: 1,
          created_by: 1,
          is_active: true,
          action: { type: 'test.action' },
          reactions: [],
        },
      ];

      mockMappingRepository.find.mockResolvedValue(mockMappings);
      (serviceRegistry.getActionByType as jest.Mock).mockReturnValue({
        metadata: { sharedEvents: false },
      });

      const result = await service['loadMappingsForAction']({
        action_type: 'test.action',
        user_id: 1,
      } as any);

      expect(result).toEqual(mockMappings);
    });
  });

  describe('loadServiceConfig', () => {
    it('should load service credentials', async () => {
      const mockService = {
        getCredentials: jest.fn().mockResolvedValue({ token: 'test-token' }),
      };

      (serviceRegistry.getService as jest.Mock).mockReturnValue(mockService);

      const result = await service['loadServiceConfig']('test.reaction', 1);

      expect(result.credentials).toEqual({ token: 'test-token' });
      expect(result.env).toBeDefined();
    });

    it('should return empty credentials when service not found', async () => {
      (serviceRegistry.getService as jest.Mock).mockReturnValue(null);

      const result = await service['loadServiceConfig']('test.reaction', 1);

      expect(result.credentials).toEqual({});
    });

    it('should handle errors loading credentials', async () => {
      const mockService = {
        getCredentials: jest.fn().mockRejectedValue(new Error('Auth error')),
      };

      (serviceRegistry.getService as jest.Mock).mockReturnValue(mockService);

      const result = await service['loadServiceConfig']('test.reaction', 1);

      expect(result.credentials).toEqual({});
    });

    it('should handle reaction type without service name', async () => {
      const result = await service['loadServiceConfig']('', 1);

      expect(result.credentials).toEqual({});
    });
  });

  describe('ensureExternalWebhooksForMapping', () => {
    it('should ensure webhooks for mapping', async () => {
      const mockMapping = {
        id: 1,
        name: 'Test',
        action: { type: 'github.push' },
        reactions: [],
      };

      const mockAction = {
        metadata: { webhookPattern: 'push' },
      };

      const mockService = {
        ensureWebhookForMapping: jest.fn().mockResolvedValue(undefined),
      };

      (serviceRegistry.getActionByType as jest.Mock).mockReturnValue(
        mockAction
      );
      (serviceRegistry.getService as jest.Mock).mockReturnValue(mockService);

      await service.ensureExternalWebhooksForMapping(mockMapping as any, 1);

      expect(mockService.ensureWebhookForMapping).toHaveBeenCalledWith(
        mockMapping,
        1,
        mockAction
      );
    });

    it('should do nothing when action has no webhook pattern', async () => {
      const mockMapping = {
        id: 1,
        name: 'Test',
        action: { type: 'test.action' },
        reactions: [],
      };

      (serviceRegistry.getActionByType as jest.Mock).mockReturnValue({
        metadata: {},
      });

      await service.ensureExternalWebhooksForMapping(mockMapping as any, 1);

      expect(serviceRegistry.getService).not.toHaveBeenCalled();
    });

    it('should do nothing when action not found', async () => {
      const mockMapping = {
        id: 1,
        name: 'Test',
        action: { type: 'unknown.action' },
        reactions: [],
      };

      (serviceRegistry.getActionByType as jest.Mock).mockReturnValue(null);

      await service.ensureExternalWebhooksForMapping(mockMapping as any, 1);

      expect(serviceRegistry.getService).not.toHaveBeenCalled();
    });

    it('should do nothing when service has no ensureWebhookForMapping method', async () => {
      const mockMapping = {
        id: 1,
        name: 'Test',
        action: { type: 'test.action' },
        reactions: [],
      };

      const mockAction = {
        metadata: { webhookPattern: 'test' },
      };

      (serviceRegistry.getActionByType as jest.Mock).mockReturnValue(
        mockAction
      );
      (serviceRegistry.getService as jest.Mock).mockReturnValue({});

      await service.ensureExternalWebhooksForMapping(mockMapping as any, 1);

      expect(serviceRegistry.getService).toHaveBeenCalled();
    });
  });

  describe('processPendingEvents', () => {
    it('should process pending events', async () => {
      const mockEvent = {
        id: 1,
        action_type: 'test.action',
        user_id: 1,
        status: 'received',
        payload: {},
      };

      mockEventRepository.find.mockResolvedValue([mockEvent]);
      mockEventRepository.save.mockResolvedValue(mockEvent);
      mockMappingRepository.find.mockResolvedValue([]);
      (serviceRegistry.getActionByType as jest.Mock).mockReturnValue({
        metadata: {},
      });

      await service['processPendingEvents']();

      expect(mockEventRepository.find).toHaveBeenCalledWith({
        where: { status: 'received' },
        order: { created_at: 'ASC' },
        take: 10,
      });
    });

    it('should do nothing when no pending events', async () => {
      mockEventRepository.find.mockResolvedValue([]);

      await service['processPendingEvents']();

      expect(mockEventRepository.find).toHaveBeenCalled();
      expect(mockEventRepository.save).not.toHaveBeenCalled();
    });

    it('should handle errors during processing', async () => {
      mockEventRepository.find.mockRejectedValue(new Error('DB error'));

      await service['processPendingEvents']();

      expect(mockEventRepository.find).toHaveBeenCalled();
    });
  });

  describe('processEvent', () => {
    it('should process event successfully', async () => {
      const mockEvent = {
        id: 1,
        action_type: 'test.action',
        user_id: 1,
        status: 'received',
        payload: { data: 'test' },
      };

      mockEventRepository.save.mockResolvedValue(mockEvent);
      mockMappingRepository.find.mockResolvedValue([]);
      (serviceRegistry.getActionByType as jest.Mock).mockReturnValue({
        metadata: {},
      });

      await service['processEvent'](mockEvent as any);

      expect(mockEventRepository.save).toHaveBeenCalled();
      expect(mockEvent.status).toBe('completed');
    });

    it('should handle unknown action type', async () => {
      const mockEvent: any = {
        id: 1,
        action_type: 'unknown.action',
        user_id: 1,
        status: 'received',
        payload: {},
      };

      mockEventRepository.save.mockResolvedValue(mockEvent);
      (serviceRegistry.getActionByType as jest.Mock).mockReturnValue(null);

      await service['processEvent'](mockEvent);

      expect(mockEvent.status).toBe('failed');
      expect(mockEvent.error_message).toBe(
        'Unknown action type: unknown.action'
      );
    });

    it('should handle no active mappings', async () => {
      const mockEvent = {
        id: 1,
        action_type: 'test.action',
        user_id: 1,
        status: 'received',
        payload: {},
      };

      mockEventRepository.save.mockResolvedValue(mockEvent);
      mockMappingRepository.find.mockResolvedValue([]);
      (serviceRegistry.getActionByType as jest.Mock).mockReturnValue({
        metadata: {},
      });

      await service['processEvent'](mockEvent as any);

      expect(mockEvent.status).toBe('completed');
    });

    it('should process event with mapping', async () => {
      const mockEvent = {
        id: 1,
        action_type: 'test.action',
        user_id: 1,
        status: 'received',
        payload: { data: 'test' },
      };

      const mockMapping = {
        id: 1,
        name: 'Test',
        created_by: 1,
        is_active: true,
        action: { type: 'test.action' },
        reactions: [],
      };

      mockEventRepository.save.mockResolvedValue(mockEvent);
      mockMappingRepository.find.mockResolvedValue([mockMapping]);
      (serviceRegistry.getActionByType as jest.Mock).mockReturnValue({
        metadata: {},
      });
      (serviceRegistry.getReactionByType as jest.Mock).mockReturnValue({
        metadata: {},
      });

      await service['processEvent'](mockEvent as any);

      expect(mockEvent.status).toBe('completed');
    });

    it('should handle processing errors', async () => {
      const mockEvent: any = {
        id: 1,
        action_type: 'test.action',
        user_id: 1,
        status: 'received',
        payload: {},
      };

      (serviceRegistry.getActionByType as jest.Mock).mockReturnValue({
        metadata: {},
      });
      mockEventRepository.save.mockImplementation((event: any) => {
        if (event.status === 'processing') {
          throw new Error('Save error');
        }
        return Promise.resolve(event);
      });

      await service['processEvent'](mockEvent);

      expect(mockEventRepository.save).toHaveBeenCalled();
    });
  });

  describe('executeMappingReactions', () => {
    beforeEach(() => {
      jest.spyOn(global, 'setTimeout').mockImplementation(((cb: any) => {
        cb();
        return 0 as any;
      }) as any);
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('should execute immediate reaction', async () => {
      const mockEvent = {
        id: 1,
        action_type: 'test.action',
        user_id: 1,
        payload: {},
      };

      const mockMapping = {
        id: 1,
        name: 'Test',
        created_by: 1,
        action: { type: 'test.action' },
        reactions: [{ type: 'test.reaction', config: {}, delay: 0 }],
      };

      mockReactionRepository.create.mockReturnValue({});
      mockReactionRepository.save.mockResolvedValue({});
      (reactionExecutorRegistry.executeReaction as jest.Mock).mockResolvedValue(
        {
          success: true,
          output: { result: 'ok' },
        }
      );
      (interpolatePayload as jest.Mock).mockImplementation(config => config);

      await service['executeMappingReactions'](
        mockEvent as any,
        mockMapping as any
      );

      expect(reactionExecutorRegistry.executeReaction).toHaveBeenCalled();
    });

    it('should handle delayed reaction', async () => {
      const mockEvent = {
        id: 1,
        action_type: 'test.action',
        user_id: 1,
        payload: {},
      };

      const mockMapping = {
        id: 1,
        name: 'Test',
        created_by: 1,
        action: { type: 'test.action' },
        reactions: [{ type: 'test.reaction', config: {}, delay: 1 }],
      };

      await service['executeMappingReactions'](
        mockEvent as any,
        mockMapping as any
      );

      expect(service.getScheduledReactions().length).toBeGreaterThan(0);
    });

    it('should continue on reaction failure', async () => {
      const mockEvent = {
        id: 1,
        action_type: 'test.action',
        user_id: 1,
        payload: {},
      };

      const mockMapping = {
        id: 1,
        name: 'Test',
        created_by: 1,
        action: { type: 'test.action' },
        reactions: [{ type: 'test.reaction', config: {}, delay: 0 }],
      };

      mockReactionRepository.create.mockReturnValue({});
      mockReactionRepository.save.mockResolvedValue({});
      mockFailureRepository.create.mockReturnValue({});
      mockFailureRepository.save.mockResolvedValue({});

      (reactionExecutorRegistry.executeReaction as jest.Mock).mockRejectedValue(
        new Error('Reaction failed')
      );

      await service['executeMappingReactions'](
        mockEvent as any,
        mockMapping as any
      );

      expect(reactionExecutorRegistry.executeReaction).toHaveBeenCalledTimes(3);
      expect(mockFailureRepository.save).toHaveBeenCalled();
    });
  });

  describe('executeReaction', () => {
    beforeEach(() => {
      jest.spyOn(global, 'setTimeout').mockImplementation(((cb: any) => {
        cb();
        return 0 as any;
      }) as any);
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('should execute reaction successfully', async () => {
      const mockEvent = {
        id: 1,
        action_type: 'test.action',
        user_id: 1,
        payload: {},
        created_at: new Date(),
      };

      const mockMapping = {
        id: 1,
        name: 'Test',
        created_by: 1,
      };

      const mockReaction = {
        type: 'test.reaction',
        config: { key: 'value' },
      };

      mockReactionRepository.create.mockReturnValue({});
      mockReactionRepository.save.mockResolvedValue({});
      (reactionExecutorRegistry.executeReaction as jest.Mock).mockResolvedValue(
        {
          success: true,
          output: { result: 'ok' },
        }
      );
      (interpolatePayload as jest.Mock).mockImplementation(config => config);

      await service['executeReaction'](
        mockEvent as any,
        mockMapping as any,
        mockReaction as any
      );

      expect(reactionExecutorRegistry.executeReaction).toHaveBeenCalled();
    });

    it('should fail after max retries', async () => {
      const mockEvent = {
        id: 1,
        action_type: 'test.action',
        user_id: 1,
        payload: {},
        created_at: new Date(),
      };

      const mockMapping = {
        id: 1,
        name: 'Test',
        created_by: 1,
      };

      const mockReaction = {
        type: 'test.reaction',
        config: {},
      };

      mockReactionRepository.create.mockReturnValue({});
      mockReactionRepository.save.mockResolvedValue({});
      mockFailureRepository.create.mockReturnValue({});
      mockFailureRepository.save.mockResolvedValue({});
      (reactionExecutorRegistry.executeReaction as jest.Mock).mockRejectedValue(
        new Error('Always fails')
      );

      await expect(
        service['executeReaction'](
          mockEvent as any,
          mockMapping as any,
          mockReaction as any
        )
      ).rejects.toThrow('Always fails');

      expect(reactionExecutorRegistry.executeReaction).toHaveBeenCalledTimes(3);
      expect(mockFailureRepository.save).toHaveBeenCalled();
    });

    it('should handle reaction execution result failure', async () => {
      const mockEvent = {
        id: 1,
        action_type: 'test.action',
        user_id: 1,
        payload: {},
        created_at: new Date(),
      };

      const mockMapping = {
        id: 1,
        name: 'Test',
        created_by: 1,
      };

      const mockReaction = {
        type: 'test.reaction',
        config: {},
      };

      mockReactionRepository.create.mockReturnValue({});
      mockReactionRepository.save.mockResolvedValue({});
      mockFailureRepository.create.mockReturnValue({});
      mockFailureRepository.save.mockResolvedValue({});
      (reactionExecutorRegistry.executeReaction as jest.Mock).mockResolvedValue(
        {
          success: false,
          error: 'Execution failed',
        }
      );

      await expect(
        service['executeReaction'](
          mockEvent as any,
          mockMapping as any,
          mockReaction as any
        )
      ).rejects.toThrow('Execution failed');

      expect(mockFailureRepository.save).toHaveBeenCalled();
    });

    it('should handle mapping without owner', async () => {
      const mockEvent = {
        id: 1,
        action_type: 'test.action',
        user_id: 1,
        payload: {},
        created_at: new Date(),
      };

      const mockMapping = {
        id: 1,
        name: 'Test',
        created_by: null,
      };

      const mockReaction = {
        type: 'test.reaction',
        config: {},
      };

      mockReactionRepository.create.mockReturnValue({});
      mockReactionRepository.save.mockResolvedValue({});

      await expect(
        service['executeReaction'](
          mockEvent as any,
          mockMapping as any,
          mockReaction as any
        )
      ).rejects.toThrow('has no owner');
    });
  });
});
