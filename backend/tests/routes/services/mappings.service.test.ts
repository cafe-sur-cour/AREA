import { MappingService } from '../../../src/routes/services/mappings.service';
import { AppDataSource } from '../../../src/config/db';
import { WebhookConfigs } from '../../../src/config/entity/WebhookConfigs';
import { Not } from 'typeorm';

// Mock dependencies
jest.mock('../../../src/config/db', () => ({
  AppDataSource: {
    getRepository: jest.fn(),
  },
}));

jest.mock('typeorm', () => ({
  ...jest.requireActual('typeorm'),
  Not: jest.fn(val => ({ _type: 'not', value: val })),
}));

const mockRepository = {
  findOne: jest.fn(),
  find: jest.fn(),
  save: jest.fn(),
  remove: jest.fn(),
  count: jest.fn(),
  createQueryBuilder: jest.fn(),
};

describe('MappingService', () => {
  let mappingService: MappingService;

  beforeEach(() => {
    jest.clearAllMocks();
    (AppDataSource.getRepository as jest.Mock).mockReturnValue(mockRepository);
    mappingService = new MappingService();
  });

  describe('generateDefaultName', () => {
    it('should generate name with single reaction', () => {
      const action = { type: 'github.push' } as any;
      const reactions = [{ type: 'slack.send_message' }] as any;

      const result = mappingService.generateDefaultName(action, reactions);

      expect(result).toBe('github push → slack send message');
    });

    it('should generate name with multiple reactions', () => {
      const action = { type: 'github.push' } as any;
      const reactions = [
        { type: 'slack.send_message' },
        { type: 'discord.send_message' },
      ] as any;

      const result = mappingService.generateDefaultName(action, reactions);

      expect(result).toBe('github push → 2 reactions');
    });

    it('should replace dots and underscores with spaces', () => {
      const action = { type: 'service_name.event_type' } as any;
      const reactions = [{ type: 'other_service.action_name' }] as any;

      const result = mappingService.generateDefaultName(action, reactions);

      expect(result).toBe(
        'service name event type → other service action name'
      );
    });

    it('should handle empty reactions array', () => {
      const action = { type: 'github.push' } as any;
      const reactions = [] as any;

      const result = mappingService.generateDefaultName(action, reactions);

      expect(result).toBe('github push → 0 reactions');
    });
  });

  describe('isNameTaken', () => {
    it('should return true if name is taken', async () => {
      mockRepository.findOne.mockResolvedValue({ id: 1, name: 'Test Mapping' });

      const result = await mappingService.isNameTaken('Test Mapping', 123);

      expect(result).toBe(true);
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: {
          name: 'Test Mapping',
          created_by: 123,
        },
      });
    });

    it('should return false if name is not taken', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      const result = await mappingService.isNameTaken('Available Name', 123);

      expect(result).toBe(false);
    });

    it('should exclude specific ID when provided', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await mappingService.isNameTaken('Test Mapping', 123, 456);

      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: {
          name: 'Test Mapping',
          created_by: 123,
          id: expect.objectContaining({ _type: 'not', value: 456 }),
        },
      });
    });
  });

  describe('generateUniqueName', () => {
    it('should return base name if not taken', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      const result = await mappingService.generateUniqueName(
        'Unique Name',
        123
      );

      expect(result).toBe('Unique Name');
    });

    it('should append counter if name is taken', async () => {
      mockRepository.findOne
        .mockResolvedValueOnce({ id: 1 }) // Base name is taken
        .mockResolvedValueOnce({ id: 2 }) // (1) is taken
        .mockResolvedValueOnce(null); // (2) is available

      const result = await mappingService.generateUniqueName('Test Name', 123);

      expect(result).toBe('Test Name (2)');
      expect(mockRepository.findOne).toHaveBeenCalledTimes(3);
    });

    it('should exclude specific ID when provided', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await mappingService.generateUniqueName('Test Name', 123, 456);

      expect(mockRepository.findOne).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            name: 'Test Name',
            created_by: 123,
            id: expect.objectContaining({ _type: 'not', value: 456 }),
          }),
        })
      );
    });

    it('should handle multiple iterations', async () => {
      mockRepository.findOne
        .mockResolvedValueOnce({ id: 1 })
        .mockResolvedValueOnce({ id: 2 })
        .mockResolvedValueOnce({ id: 3 })
        .mockResolvedValueOnce({ id: 4 })
        .mockResolvedValueOnce(null);

      const result = await mappingService.generateUniqueName(
        'Popular Name',
        123
      );

      expect(result).toBe('Popular Name (4)');
      expect(mockRepository.findOne).toHaveBeenCalledTimes(5);
    });
  });

  describe('getUserMappings', () => {
    it('should return all mappings for a user ordered by creation date', async () => {
      const mockMappings = [
        { id: 1, created_by: 1, created_at: new Date() },
        { id: 2, created_by: 1, created_at: new Date() },
      ];

      mockRepository.find.mockResolvedValue(mockMappings);

      const result = await mappingService.getUserMappings(1);

      expect(result).toEqual(mockMappings);
      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { created_by: 1 },
        order: { created_at: 'DESC' },
      });
    });

    it('should return empty array if user has no mappings', async () => {
      mockRepository.find.mockResolvedValue([]);

      const result = await mappingService.getUserMappings(999);

      expect(result).toEqual([]);
    });
  });

  describe('getMappingById', () => {
    it('should return mapping if found and belongs to user', async () => {
      const mockMapping = { id: 1, created_by: 1, name: 'Test Mapping' };

      mockRepository.findOne.mockResolvedValue(mockMapping);

      const result = await mappingService.getMappingById(1, 1);

      expect(result).toEqual(mockMapping);
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1, created_by: 1 },
      });
    });

    it('should return null if mapping not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      const result = await mappingService.getMappingById(999, 1);

      expect(result).toBeNull();
    });
  });

  describe('deleteMapping', () => {
    it('should delete mapping and cleanup webhooks if found', async () => {
      const mockMapping = {
        id: 1,
        created_by: 1,
        action: {
          type: 'github.push',
          config: { repository: 'owner/repo' },
        },
      };

      mockRepository.findOne.mockResolvedValue(mockMapping);
      mockRepository.find.mockResolvedValue([]);
      mockRepository.remove.mockResolvedValue(mockMapping);

      const result = await mappingService.deleteMapping(1, 1);

      expect(result).toBe(true);
      expect(mockRepository.remove).toHaveBeenCalledWith(mockMapping);
    });

    it('should return false if mapping not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      const result = await mappingService.deleteMapping(999, 1);

      expect(result).toBe(false);
      expect(mockRepository.remove).not.toHaveBeenCalled();
    });
  });

  describe('createMapping', () => {
    it('should create mapping with provided name', async () => {
      const mockData = {
        name: 'Custom Name',
        description: 'Test description',
        action: { type: 'github.push' } as any,
        reactions: [{ type: 'slack.send_message' }] as any,
        is_active: true,
        created_by: 1,
      };

      mockRepository.findOne.mockResolvedValue(null);
      mockRepository.save.mockImplementation(entity =>
        Promise.resolve({ ...entity, id: 1 })
      );

      const result = await mappingService.createMapping(mockData);

      expect(result.name).toBe('Custom Name');
      expect(result.description).toBe('Test description');
      expect(mockRepository.save).toHaveBeenCalled();
    });

    it('should create mapping with default name if name not provided', async () => {
      const mockData = {
        action: { type: 'github.push' } as any,
        reactions: [{ type: 'slack.send_message' }] as any,
        created_by: 1,
      };

      mockRepository.findOne.mockResolvedValue(null);
      mockRepository.save.mockImplementation(entity =>
        Promise.resolve({ ...entity, id: 1 })
      );

      const result = await mappingService.createMapping(mockData);

      expect(result.name).toContain('github push');
      expect(result.name).toContain('slack send message');
      expect(mockRepository.save).toHaveBeenCalled();
    });

    it('should generate unique name if name already taken', async () => {
      const mockData = {
        name: 'Taken Name',
        action: { type: 'github.push' } as any,
        reactions: [{ type: 'slack.send_message' }] as any,
        created_by: 1,
      };

      mockRepository.findOne
        .mockResolvedValueOnce({ id: 2 }) // First check: name exists
        .mockResolvedValueOnce(null); // Second check: generated name available
      mockRepository.save.mockImplementation(entity =>
        Promise.resolve({ ...entity, id: 1 })
      );

      const result = await mappingService.createMapping(mockData);

      expect(result.name).toBe('Taken Name (1)');
      expect(mockRepository.save).toHaveBeenCalled();
    });
  });

  describe('updateMapping', () => {
    it('should update mapping with new values', async () => {
      const existingMapping = {
        id: 1,
        created_by: 1,
        name: 'Old Name',
        description: 'Old description',
        action: { type: 'github.push' } as any,
        reactions: [{ type: 'slack.send_message' }] as any,
        is_active: true,
      };

      const updates = {
        name: 'New Name',
        description: 'New description',
        is_active: false,
      };

      mockRepository.findOne
        .mockResolvedValueOnce(existingMapping) // getMappingById
        .mockResolvedValueOnce(null); // isNameTaken check
      mockRepository.save.mockImplementation(entity => Promise.resolve(entity));

      const result = await mappingService.updateMapping(1, 1, updates);

      expect(result).toBeDefined();
      expect(result!.name).toBe('New Name');
      expect(result!.description).toBe('New description');
      expect(result!.is_active).toBe(false);
      expect(mockRepository.save).toHaveBeenCalled();
    });

    it('should return null if mapping not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      const result = await mappingService.updateMapping(999, 1, {
        name: 'New Name',
      });

      expect(result).toBeNull();
      expect(mockRepository.save).not.toHaveBeenCalled();
    });

    it('should update only provided fields', async () => {
      const existingMapping = {
        id: 1,
        created_by: 1,
        name: 'Old Name',
        description: 'Old description',
        action: { type: 'github.push' } as any,
        reactions: [{ type: 'slack.send_message' }] as any,
        is_active: true,
      };

      mockRepository.findOne.mockResolvedValue(existingMapping);
      mockRepository.save.mockImplementation(entity => Promise.resolve(entity));

      const result = await mappingService.updateMapping(1, 1, {
        is_active: false,
      });

      expect(result).toBeDefined();
      expect(result!.name).toBe('Old Name'); // unchanged
      expect(result!.description).toBe('Old description'); // unchanged
      expect(result!.is_active).toBe(false); // updated
      expect(mockRepository.save).toHaveBeenCalled();
    });
  });
});
