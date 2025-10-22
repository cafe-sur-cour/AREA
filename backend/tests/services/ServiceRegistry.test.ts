import { ServiceRegistryImpl } from '../../src/services/ServiceRegistry';
import type { Service } from '../../src/types/service';

describe('ServiceRegistry', () => {
  let registry: ServiceRegistryImpl;

  const createMockService = (id: string, name: string, actionsCount = 0, reactionsCount = 0): Service => ({
    id,
    name,
    description: 'Test service description',
    version: '1.0.0',
    actions: Array.from({ length: actionsCount }, (_, i) => ({
      id: `${id}.action${i + 1}`,
      name: `Action ${i + 1}`,
      description: 'Action description',
      configSchema: { name: 'config', fields: [] },
      inputSchema: { type: 'object' as const, properties: {} },
      metadata: {
        category: 'test' as const,
        tags: ['test'],
        requiresAuth: false,
      },
    })),
    reactions: Array.from({ length: reactionsCount }, (_, i) => ({
      id: `${id}.reaction${i + 1}`,
      name: `Reaction ${i + 1}`,
      description: 'Reaction description',
      configSchema: { name: 'config', fields: [] },
      outputSchema: { type: 'object' as const, properties: {} },
      metadata: {
        category: 'test' as const,
        tags: ['test'],
        requiresAuth: false,
      },
    })),
  });

  beforeEach(() => {
    registry = new ServiceRegistryImpl();
  });

  describe('register', () => {
    it('should register a valid service', () => {
      const mockService = createMockService('testService', 'Test Service', 1, 1);

      registry.register(mockService);

      const retrieved = registry.getService('testService');
      expect(retrieved).toBe(mockService);
    });

    it('should throw error when registering duplicate service', () => {
      const mockService = createMockService('testService', 'Test Service');

      registry.register(mockService);

      expect(() => {
        registry.register(mockService);
      }).toThrow("Service with id 'testService' is already registered");
    });

    it('should throw error when service has no id', () => {
      const mockService = {
        name: 'Test Service',
        description: 'Test',
        version: '1.0.0',
        actions: [],
        reactions: [],
      } as any;

      expect(() => {
        registry.register(mockService);
      }).toThrow('Service must have a valid id');
    });

    it('should throw error when service id is not a string', () => {
      const mockService = {
        id: 123,
        name: 'Test Service',
        description: 'Test',
        version: '1.0.0',
        actions: [],
        reactions: [],
      } as any;

      expect(() => {
        registry.register(mockService);
      }).toThrow('Service must have a valid id');
    });

    it('should throw error when service has no name', () => {
      const mockService = {
        id: 'testService',
        description: 'Test',
        version: '1.0.0',
        actions: [],
        reactions: [],
      } as any;

      expect(() => {
        registry.register(mockService);
      }).toThrow('Service must have a valid name');
    });

    it('should throw error when service name is not a string', () => {
      const mockService = {
        id: 'testService',
        name: 123,
        description: 'Test',
        version: '1.0.0',
        actions: [],
        reactions: [],
      } as any;

      expect(() => {
        registry.register(mockService);
      }).toThrow('Service must have a valid name');
    });

    it('should throw error when actions is not an array', () => {
      const mockService = {
        id: 'testService',
        name: 'Test Service',
        description: 'Test',
        version: '1.0.0',
        actions: 'not an array',
        reactions: [],
      } as any;

      expect(() => {
        registry.register(mockService);
      }).toThrow('Service actions must be an array');
    });

    it('should throw error when reactions is not an array', () => {
      const mockService = {
        id: 'testService',
        name: 'Test Service',
        description: 'Test',
        version: '1.0.0',
        actions: [],
        reactions: 'not an array',
      } as any;

      expect(() => {
        registry.register(mockService);
      }).toThrow('Service reactions must be an array');
    });

    it('should throw error for duplicate action ids', () => {
      const mockService = createMockService('testService', 'Test Service', 2, 0);
      // Manually set duplicate IDs
      mockService.actions[1].id = mockService.actions[0].id;

      expect(() => {
        registry.register(mockService);
      }).toThrow(`Duplicate action id '${mockService.actions[0].id}' in service 'testService'`);
    });

    it('should throw error for duplicate reaction ids', () => {
      const mockService = createMockService('testService', 'Test Service', 0, 2);
      // Manually set duplicate IDs
      mockService.reactions[1].id = mockService.reactions[0].id;

      expect(() => {
        registry.register(mockService);
      }).toThrow(`Duplicate reaction id '${mockService.reactions[0].id}' in service 'testService'`);
    });
  });

  describe('unregister', () => {
    it('should unregister an existing service', () => {
      const mockService = createMockService('testService', 'Test Service');

      registry.register(mockService);
      registry.unregister('testService');

      const retrieved = registry.getService('testService');
      expect(retrieved).toBeUndefined();
    });

    it('should handle unregistering non-existent service', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      registry.unregister('nonExistent');

      expect(consoleSpy).toHaveBeenCalledWith(
        "Service with id 'nonExistent' is not registered"
      );

      consoleSpy.mockRestore();
    });
  });

  describe('getService', () => {
    it('should return registered service', () => {
      const mockService = createMockService('testService', 'Test Service');

      registry.register(mockService);

      const retrieved = registry.getService('testService');
      expect(retrieved).toBe(mockService);
    });

    it('should return undefined for non-existent service', () => {
      const retrieved = registry.getService('nonExistent');
      expect(retrieved).toBeUndefined();
    });
  });

  describe('getAllServices', () => {
    it('should return all registered services', () => {
      const service1 = createMockService('service1', 'Service 1');
      const service2 = createMockService('service2', 'Service 2');

      registry.register(service1);
      registry.register(service2);

      const services = registry.getAllServices();
      expect(services).toHaveLength(2);
      expect(services).toContain(service1);
      expect(services).toContain(service2);
    });

    it('should return empty array when no services registered', () => {
      const services = registry.getAllServices();
      expect(services).toEqual([]);
    });
  });

  describe('getAllActions', () => {
    it('should return all actions from all services', () => {
      const service1 = createMockService('service1', 'Service 1', 2, 0);
      const service2 = createMockService('service2', 'Service 2', 1, 0);

      registry.register(service1);
      registry.register(service2);

      const actions = registry.getAllActions();
      expect(actions).toHaveLength(3);
      expect(actions.map(a => a.id)).toContain('service1.action1');
      expect(actions.map(a => a.id)).toContain('service1.action2');
      expect(actions.map(a => a.id)).toContain('service2.action1');
    });

    it('should return empty array when no actions registered', () => {
      const actions = registry.getAllActions();
      expect(actions).toEqual([]);
    });
  });

  describe('getAllReactions', () => {
    it('should return all reactions from all services', () => {
      const service1 = createMockService('service1', 'Service 1', 0, 2);
      const service2 = createMockService('service2', 'Service 2', 0, 1);

      registry.register(service1);
      registry.register(service2);

      const reactions = registry.getAllReactions();
      expect(reactions).toHaveLength(3);
      expect(reactions.map(r => r.id)).toContain('service1.reaction1');
      expect(reactions.map(r => r.id)).toContain('service1.reaction2');
      expect(reactions.map(r => r.id)).toContain('service2.reaction1');
    });

    it('should return empty array when no reactions registered', () => {
      const reactions = registry.getAllReactions();
      expect(reactions).toEqual([]);
    });
  });

  describe('getActionByType', () => {
    it('should return action by type', () => {
      const mockService = createMockService('testService', 'Test Service', 2, 0);

      registry.register(mockService);

      const action = registry.getActionByType('testService.action1');
      expect(action).toBeDefined();
      expect(action?.id).toBe('testService.action1');
    });

    it('should return undefined for non-existent action', () => {
      const action = registry.getActionByType('nonExistent.action');
      expect(action).toBeUndefined();
    });

    it('should find action across multiple services', () => {
      const service1 = createMockService('service1', 'Service 1', 1, 0);
      const service2 = createMockService('service2', 'Service 2', 1, 0);

      registry.register(service1);
      registry.register(service2);

      const action = registry.getActionByType('service2.action1');
      expect(action?.id).toBe('service2.action1');
    });
  });

  describe('getReactionByType', () => {
    it('should return reaction by type', () => {
      const mockService = createMockService('testService', 'Test Service', 0, 2);

      registry.register(mockService);

      const reaction = registry.getReactionByType('testService.reaction1');
      expect(reaction).toBeDefined();
      expect(reaction?.id).toBe('testService.reaction1');
    });

    it('should return undefined for non-existent reaction', () => {
      const reaction = registry.getReactionByType('nonExistent.reaction');
      expect(reaction).toBeUndefined();
    });

    it('should find reaction across multiple services', () => {
      const service1 = createMockService('service1', 'Service 1', 0, 1);
      const service2 = createMockService('service2', 'Service 2', 0, 1);

      registry.register(service1);
      registry.register(service2);

      const reaction = registry.getReactionByType('service2.reaction1');
      expect(reaction?.id).toBe('service2.reaction1');
    });
  });
});
