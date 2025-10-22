import { ReactionExecutorRegistryImpl } from '../../src/services/ReactionExecutorRegistry';
import type {
  ReactionExecutor,
  ReactionExecutionContext,
  ReactionExecutionResult,
} from '../../src/types/service';

describe('ReactionExecutorRegistry', () => {
  let registry: ReactionExecutorRegistryImpl;
  let mockExecutor: ReactionExecutor;

  beforeEach(() => {
    registry = new ReactionExecutorRegistryImpl();
    mockExecutor = {
      execute: jest.fn().mockResolvedValue({
        success: true,
        output: { result: 'ok' },
      }),
    };
  });

  describe('register', () => {
    it('should register a new executor', () => {
      registry.register('testService', mockExecutor);

      const executor = registry.getExecutor('testService');
      expect(executor).toBe(mockExecutor);
    });

    it('should throw error when registering duplicate service', () => {
      registry.register('testService', mockExecutor);

      expect(() => {
        registry.register('testService', mockExecutor);
      }).toThrow("Executor for service 'testService' is already registered");
    });
  });

  describe('unregister', () => {
    it('should unregister an existing executor', () => {
      registry.register('testService', mockExecutor);
      registry.unregister('testService');

      const executor = registry.getExecutor('testService');
      expect(executor).toBeUndefined();
    });

    it('should handle unregistering non-existent service', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      registry.unregister('nonExistent');

      expect(consoleSpy).toHaveBeenCalledWith(
        "Executor for service 'nonExistent' is not registered"
      );

      consoleSpy.mockRestore();
    });
  });

  describe('getExecutor', () => {
    it('should return executor for registered service', () => {
      registry.register('testService', mockExecutor);

      const executor = registry.getExecutor('testService');
      expect(executor).toBe(mockExecutor);
    });

    it('should return undefined for unregistered service', () => {
      const executor = registry.getExecutor('nonExistent');
      expect(executor).toBeUndefined();
    });
  });

  describe('executeReaction', () => {
    it('should execute reaction successfully', async () => {
      const mockContext: ReactionExecutionContext = {
        reaction: {
          type: 'testService.action',
          config: { key: 'value' },
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
        serviceConfig: {
          credentials: {},
          settings: {},
          env: process.env,
        },
      };

      registry.register('testService', mockExecutor);

      const result = await registry.executeReaction(
        'testService.action',
        mockContext
      );

      expect(result.success).toBe(true);
      expect(result.output).toEqual({ result: 'ok' });
      expect(mockExecutor.execute).toHaveBeenCalledWith(mockContext);
    });

    it('should handle invalid reaction type', async () => {
      const mockContext = {} as ReactionExecutionContext;

      const result = await registry.executeReaction('', mockContext);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid reaction type: ');
    });

    it('should handle unregistered service', async () => {
      const mockContext = {} as ReactionExecutionContext;

      const result = await registry.executeReaction(
        'unregistered.action',
        mockContext
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe(
        'No executor registered for service: unregistered'
      );
    });

    it('should handle executor execution errors', async () => {
      const errorExecutor: ReactionExecutor = {
        execute: jest.fn().mockRejectedValue(new Error('Execution failed')),
      };

      const mockContext = {} as ReactionExecutionContext;

      registry.register('errorService', errorExecutor);

      const result = await registry.executeReaction(
        'errorService.action',
        mockContext
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('Execution failed');
    });

    it('should handle executor that returns failure result', async () => {
      const failureExecutor: ReactionExecutor = {
        execute: jest.fn().mockResolvedValue({
          success: false,
          error: 'Operation failed',
        }),
      };

      const mockContext = {} as ReactionExecutionContext;

      registry.register('failService', failureExecutor);

      const result = await registry.executeReaction(
        'failService.action',
        mockContext
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('Operation failed');
    });

    it('should handle reaction type with multiple dots', async () => {
      const mockContext: ReactionExecutionContext = {
        reaction: {
          type: 'testService.sub.action',
          config: {},
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
          name: 'Test',
          created_by: 1,
        },
        serviceConfig: {
          credentials: {},
          settings: {},
          env: process.env,
        },
      };

      registry.register('testService', mockExecutor);

      const result = await registry.executeReaction(
        'testService.sub.action',
        mockContext
      );

      expect(result.success).toBe(true);
      expect(mockExecutor.execute).toHaveBeenCalledWith(mockContext);
    });
  });
});
