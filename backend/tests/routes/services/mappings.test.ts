import request from 'supertest';
import express from 'express';
import mappingsRouter from '../../../src/routes/services/mappings';
import { mappingService } from '../../../src/routes/services/mappings.service';
import { serviceRegistry } from '../../../src/services/ServiceRegistry';
import { executionService } from '../../../src/services/ExecutionService';

// Mock dependencies
jest.mock('../../../src/middleware/token', () => {
  return (req: any, res: any, next: any) => {
    req.auth = { id: 1 };
    next();
  };
});

jest.mock('../../../src/routes/services/mappings.service');
jest.mock('../../../src/services/ServiceRegistry');
jest.mock('../../../src/services/ExecutionService');

const app = express();
app.use(express.json());
app.use('/api/mappings', mappingsRouter);

describe('Mappings Router', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /', () => {
    it('should create a mapping with valid data', async () => {
      const mockMapping = {
        id: 1,
        name: 'Test Mapping',
        description: 'Test description',
        action: { type: 'github.push', config: {} },
        reactions: [{ type: 'slack.send_message', config: {} }],
        is_active: true,
        created_by: 1,
      };

      (serviceRegistry.getActionByType as jest.Mock).mockReturnValue({
        type: 'github.push',
      });
      (serviceRegistry.getReactionByType as jest.Mock).mockReturnValue({
        type: 'slack.send_message',
      });
      (serviceRegistry.getService as jest.Mock).mockReturnValue({
        oauth: { enabled: false },
      });
      (mappingService.createMapping as jest.Mock).mockResolvedValue(
        mockMapping
      );
      (
        executionService.ensureExternalWebhooksForMapping as jest.Mock
      ).mockResolvedValue(undefined);

      const response = await request(app)
        .post('/api/mappings')
        .send({
          name: 'Test Mapping',
          description: 'Test description',
          action: { type: 'github.push', config: {} },
          reactions: [{ type: 'slack.send_message', config: {} }],
          is_active: true,
        });

      expect(response.status).toBe(201);
      expect(response.body.mapping).toEqual(mockMapping);
      expect(mappingService.createMapping).toHaveBeenCalledWith({
        name: 'Test Mapping',
        description: 'Test description',
        action: { type: 'github.push', config: {} },
        reactions: [{ type: 'slack.send_message', config: {} }],
        is_active: true,
        created_by: 1,
      });
    });

    it('should return 400 for invalid request body', async () => {
      const response = await request(app).post('/api/mappings').send({
        // Missing required fields
      });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Invalid request data');
      expect(response.body.details).toBeDefined();
    });

    it('should return 400 for empty reactions array', async () => {
      const response = await request(app)
        .post('/api/mappings')
        .send({
          name: 'Test',
          action: { type: 'github.push', config: {} },
          reactions: [],
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Invalid request data');
    });

    it('should return 404 for invalid action type', async () => {
      (serviceRegistry.getActionByType as jest.Mock).mockReturnValue(null);
      (serviceRegistry.getReactionByType as jest.Mock).mockReturnValue({
        type: 'slack.send_message',
      });

      const response = await request(app)
        .post('/api/mappings')
        .send({
          name: 'Test',
          action: { type: 'invalid.action', config: {} },
          reactions: [{ type: 'slack.send_message', config: {} }],
        });

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Invalid action or reaction types');
    });

    it('should return 404 for invalid reaction type', async () => {
      (serviceRegistry.getActionByType as jest.Mock).mockReturnValue({
        type: 'github.push',
      });
      (serviceRegistry.getReactionByType as jest.Mock).mockReturnValue(null);

      const response = await request(app)
        .post('/api/mappings')
        .send({
          name: 'Test',
          action: { type: 'github.push', config: {} },
          reactions: [{ type: 'invalid.reaction', config: {} }],
        });

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Invalid action or reaction types');
    });

    it('should validate reaction delay is positive number', async () => {
      const response = await request(app)
        .post('/api/mappings')
        .send({
          name: 'Test',
          action: { type: 'github.push', config: {} },
          reactions: [{ type: 'slack.send_message', config: {}, delay: -5 }],
        });

      expect(response.status).toBe(400);
      expect(response.body.details).toContain(
        'Reaction 1: delay must be a positive number (seconds)'
      );
    });
  });

  describe('GET /', () => {
    it('should return all user mappings', async () => {
      const mockMappings = [
        {
          id: 1,
          name: 'Mapping 1',
          description: 'Description 1',
          action: { type: 'github.push', config: {} },
          reactions: [{ type: 'slack.send_message', config: {} }],
          is_active: true,
          created_by: 1,
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          id: 2,
          name: 'Mapping 2',
          description: 'Description 2',
          action: { type: 'github.pull_request', config: {} },
          reactions: [{ type: 'discord.send_message', config: {} }],
          is_active: false,
          created_by: 1,
          created_at: new Date(),
          updated_at: new Date(),
        },
      ];

      (mappingService.getUserMappings as jest.Mock).mockResolvedValue(
        mockMappings
      );

      const response = await request(app).get('/api/mappings');

      expect(response.status).toBe(200);
      expect(response.body.mappings).toHaveLength(2);
      expect(response.body.mappings[0].name).toBe('Mapping 1');
      expect(mappingService.getUserMappings).toHaveBeenCalledWith(1);
    });

    it('should return empty array when user has no mappings', async () => {
      (mappingService.getUserMappings as jest.Mock).mockResolvedValue([]);

      const response = await request(app).get('/api/mappings');

      expect(response.status).toBe(200);
      expect(response.body.mappings).toEqual([]);
    });

    it('should return 500 on service error', async () => {
      (mappingService.getUserMappings as jest.Mock).mockRejectedValue(
        new Error('Database error')
      );

      const response = await request(app).get('/api/mappings');

      expect(response.status).toBe(500);
      expect(response.body.error).toBe(
        'Internal Server Error in fetching mappings'
      );
    });
  });

  describe('GET /:id', () => {
    it('should return a specific mapping by id', async () => {
      const mockMapping = {
        id: 1,
        name: 'Test Mapping',
        description: 'Test description',
        action: { type: 'github.push', config: {} },
        reactions: [{ type: 'slack.send_message', config: {} }],
        is_active: true,
        created_by: 1,
        created_at: new Date(),
        updated_at: new Date(),
      };

      (mappingService.getMappingById as jest.Mock).mockResolvedValue(
        mockMapping
      );

      const response = await request(app).get('/api/mappings/1');

      expect(response.status).toBe(200);
      expect(response.body.mapping.name).toBe('Test Mapping');
      expect(mappingService.getMappingById).toHaveBeenCalledWith(1, 1);
    });

    it('should return 404 if mapping not found', async () => {
      (mappingService.getMappingById as jest.Mock).mockResolvedValue(null);

      const response = await request(app).get('/api/mappings/999');

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Mapping not found');
    });

    it('should return 400 for invalid mapping id', async () => {
      const response = await request(app).get('/api/mappings/invalid');

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Invalid mapping ID');
    });

    it('should return 500 on service error', async () => {
      (mappingService.getMappingById as jest.Mock).mockRejectedValue(
        new Error('Database error')
      );

      const response = await request(app).get('/api/mappings/1');

      expect(response.status).toBe(500);
      expect(response.body.error).toBe(
        'Internal Server Error in get mapping by id'
      );
    });
  });

  describe('DELETE /:id', () => {
    it('should delete a mapping successfully', async () => {
      (mappingService.deleteMapping as jest.Mock).mockResolvedValue(true);

      const response = await request(app).delete('/api/mappings/1');

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Mapping deleted successfully');
      expect(mappingService.deleteMapping).toHaveBeenCalledWith(1, 1);
    });

    it('should return 404 if mapping not found', async () => {
      (mappingService.deleteMapping as jest.Mock).mockResolvedValue(false);

      const response = await request(app).delete('/api/mappings/999');

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Mapping not found');
    });

    it('should return 400 for invalid mapping id', async () => {
      const response = await request(app).delete('/api/mappings/invalid');

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Invalid mapping ID');
    });

    it('should return 500 on service error', async () => {
      (mappingService.deleteMapping as jest.Mock).mockRejectedValue(
        new Error('Database error')
      );

      const response = await request(app).delete('/api/mappings/1');

      expect(response.status).toBe(500);
      expect(response.body.error).toBe(
        'Internal Server Error in deleting mapping'
      );
    });
  });

  describe('PUT /:id/activate', () => {
    it('should activate a mapping successfully', async () => {
      const mockMapping = {
        id: 1,
        name: 'Test Mapping',
        is_active: true,
      };

      (mappingService.updateMapping as jest.Mock).mockResolvedValue(
        mockMapping
      );

      const response = await request(app).put('/api/mappings/1/activate');

      expect(response.status).toBe(200);
      expect(response.body.mapping.is_active).toBe(true);
      expect(mappingService.updateMapping).toHaveBeenCalledWith(1, 1, {
        is_active: true,
      });
    });

    it('should return 404 if mapping not found', async () => {
      (mappingService.updateMapping as jest.Mock).mockResolvedValue(null);

      const response = await request(app).put('/api/mappings/999/activate');

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Mapping not found');
    });

    it('should return 400 for invalid mapping id', async () => {
      const response = await request(app).put('/api/mappings/invalid/activate');

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Invalid mapping ID');
    });

    it('should return 500 on service error', async () => {
      (mappingService.updateMapping as jest.Mock).mockRejectedValue(
        new Error('Database error')
      );

      const response = await request(app).put('/api/mappings/1/activate');

      expect(response.status).toBe(500);
      expect(response.body.error).toBe(
        'Internal Server Error in activating mapping'
      );
    });
  });

  describe('PUT /:id/deactivate', () => {
    it('should deactivate a mapping successfully', async () => {
      const mockMapping = {
        id: 1,
        name: 'Test Mapping',
        is_active: false,
      };

      (mappingService.updateMapping as jest.Mock).mockResolvedValue(
        mockMapping
      );

      const response = await request(app).put('/api/mappings/1/deactivate');

      expect(response.status).toBe(200);
      expect(response.body.mapping.is_active).toBe(false);
      expect(mappingService.updateMapping).toHaveBeenCalledWith(1, 1, {
        is_active: false,
      });
    });

    it('should return 404 if mapping not found', async () => {
      (mappingService.updateMapping as jest.Mock).mockResolvedValue(null);

      const response = await request(app).put('/api/mappings/999/deactivate');

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Mapping not found');
    });

    it('should return 400 for invalid mapping id', async () => {
      const response = await request(app).put(
        '/api/mappings/invalid/deactivate'
      );

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Invalid mapping ID');
    });

    it('should return 500 on service error', async () => {
      (mappingService.updateMapping as jest.Mock).mockRejectedValue(
        new Error('Database error')
      );

      const response = await request(app).put('/api/mappings/1/deactivate');

      expect(response.status).toBe(500);
      expect(response.body.error).toBe(
        'Internal Server Error in deactivating mapping'
      );
    });
  });

  describe('Validation Functions', () => {
    it('should validate mapping request with all required fields', async () => {
      (serviceRegistry.getActionByType as jest.Mock).mockReturnValue({
        type: 'github.push',
      });
      (serviceRegistry.getReactionByType as jest.Mock).mockReturnValue({
        type: 'slack.send_message',
      });
      (serviceRegistry.getService as jest.Mock).mockReturnValue({
        oauth: { enabled: false },
      });
      (mappingService.createMapping as jest.Mock).mockResolvedValue({ id: 1 });
      (
        executionService.ensureExternalWebhooksForMapping as jest.Mock
      ).mockResolvedValue(undefined);

      const response = await request(app)
        .post('/api/mappings')
        .send({
          name: 'Valid Mapping',
          action: {
            type: 'github.push',
            config: { repository: 'test/repo' },
          },
          reactions: [
            {
              type: 'slack.send_message',
              config: { channel: 'general' },
            },
          ],
        });

      expect(response.status).toBe(201);
    });

    it('should reject mapping with empty action config', async () => {
      const response = await request(app)
        .post('/api/mappings')
        .send({
          name: 'Invalid Mapping',
          action: {
            type: 'github.push',
          },
          reactions: [
            {
              type: 'slack.send_message',
              config: {},
            },
          ],
        });

      expect(response.status).toBe(400);
      expect(response.body.details).toContain(
        'Action config is required and must be an object'
      );
    });

    it('should reject mapping with empty reaction config', async () => {
      const response = await request(app)
        .post('/api/mappings')
        .send({
          name: 'Invalid Mapping',
          action: {
            type: 'github.push',
            config: {},
          },
          reactions: [
            {
              type: 'slack.send_message',
            },
          ],
        });

      expect(response.status).toBe(400);
      expect(response.body.details).toContain(
        'Reaction 1: config is required and must be an object'
      );
    });

    it('should reject mapping with invalid reaction type', async () => {
      const response = await request(app)
        .post('/api/mappings')
        .send({
          name: 'Invalid Mapping',
          action: {
            type: 'github.push',
            config: {},
          },
          reactions: [
            {
              config: {},
            },
          ],
        });

      expect(response.status).toBe(400);
      expect(response.body.details).toContain(
        'Reaction 1: type is required and must be a string'
      );
    });
  });
});
