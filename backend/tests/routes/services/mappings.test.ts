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
        created_at: '2025-10-23T08:56:44.999Z',
        updated_at: '2025-10-23T08:56:44.999Z',
      };

      (serviceRegistry.getActionByType as jest.Mock).mockReturnValue({
        id: 'github.push',
        name: 'Push Event',
        type: 'github.push',
      });
      (serviceRegistry.getReactionByType as jest.Mock).mockReturnValue({
        id: 'slack.send_message',
        name: 'Send Message',
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
      expect(response.body.mapping).toEqual({
        ...mockMapping,
        action: { ...mockMapping.action, name: 'Push Event' },
        reactions: [{ ...mockMapping.reactions[0], name: 'Send Message' }],
      });
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
        id: 'slack.send_message',
        name: 'Send Message',
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
        id: 'github.push',
        name: 'Push Event',
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
          created_at: '2025-10-23T08:56:44.999Z',
          updated_at: '2025-10-23T08:56:44.999Z',
        },
        {
          id: 2,
          name: 'Mapping 2',
          description: 'Description 2',
          action: { type: 'github.pull_request', config: {} },
          reactions: [{ type: 'discord.send_message', config: {} }],
          is_active: false,
          created_by: 1,
          created_at: '2025-10-23T08:56:44.999Z',
          updated_at: '2025-10-23T08:56:44.999Z',
        },
      ];

      (serviceRegistry.getActionByType as jest.Mock)
        .mockReturnValueOnce({
          id: 'github.push',
          name: 'Push Event',
          type: 'github.push',
        })
        .mockReturnValueOnce({
          id: 'github.pull_request',
          name: 'Pull Request',
          type: 'github.pull_request',
        });
      (serviceRegistry.getReactionByType as jest.Mock)
        .mockReturnValueOnce({
          id: 'slack.send_message',
          name: 'Send Message',
          type: 'slack.send_message',
        })
        .mockReturnValueOnce({
          id: 'discord.send_message',
          name: 'Send Discord Message',
          type: 'discord.send_message',
        });

      (mappingService.getUserMappings as jest.Mock).mockResolvedValue(
        mockMappings
      );

      const response = await request(app).get('/api/mappings');

      expect(response.status).toBe(200);
      expect(response.body.mappings).toHaveLength(2);
      expect(response.body.mappings[0].name).toBe('Mapping 1');
      expect(response.body.mappings[0].action.name).toBe('Push Event');
      expect(response.body.mappings[0].reactions[0].name).toBe('Send Message');
      expect(response.body.mappings[1].action.name).toBe('Pull Request');
      expect(response.body.mappings[1].reactions[0].name).toBe(
        'Send Discord Message'
      );
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
        created_at: '2025-10-23T08:56:44.999Z',
        updated_at: '2025-10-23T08:56:44.999Z',
      };

      (serviceRegistry.getActionByType as jest.Mock).mockReturnValue({
        id: 'github.push',
        name: 'Push Event',
        type: 'github.push',
      });
      (serviceRegistry.getReactionByType as jest.Mock).mockReturnValue({
        id: 'slack.send_message',
        name: 'Send Message',
        type: 'slack.send_message',
      });

      (mappingService.getMappingById as jest.Mock).mockResolvedValue(
        mockMapping
      );

      const response = await request(app).get('/api/mappings/1');

      expect(response.status).toBe(200);
      expect(response.body.mapping.name).toBe('Test Mapping');
      expect(response.body.mapping.action.name).toBe('Push Event');
      expect(response.body.mapping.reactions[0].name).toBe('Send Message');
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
        description: null,
        action: { type: 'github.push', config: {} },
        reactions: [{ type: 'slack.send_message', config: {} }],
        is_active: true,
        created_by: 1,
        created_at: '2025-10-23T08:56:44.999Z',
        updated_at: '2025-10-23T08:56:44.999Z',
      };

      (serviceRegistry.getActionByType as jest.Mock).mockReturnValue({
        id: 'github.push',
        name: 'Push Event',
        type: 'github.push',
      });
      (serviceRegistry.getReactionByType as jest.Mock).mockReturnValue({
        id: 'slack.send_message',
        name: 'Send Message',
        type: 'slack.send_message',
      });

      (mappingService.updateMapping as jest.Mock).mockResolvedValue(
        mockMapping
      );

      const response = await request(app).put('/api/mappings/1/activate');

      expect(response.status).toBe(200);
      expect(response.body.mapping.is_active).toBe(true);
      expect(response.body.mapping.action.name).toBe('Push Event');
      expect(response.body.mapping.reactions[0].name).toBe('Send Message');
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

  describe('PUT /:id', () => {
    it('should update a mapping with valid data', async () => {
      const existingMapping = {
        id: 1,
        name: 'Old Name',
        description: 'Old description',
        action: { type: 'github.push', config: { repository: 'old/repo' } },
        reactions: [{ type: 'slack.send_message', config: { channel: 'old' } }],
        is_active: true,
        created_by: 1,
        created_at: '2025-10-23T08:56:44.999Z',
        updated_at: '2025-10-23T08:56:44.999Z',
      };

      const updatedMapping = {
        ...existingMapping,
        name: 'New Name',
        description: 'New description',
        is_active: false,
      };

      (serviceRegistry.getActionByType as jest.Mock).mockReturnValue({
        id: 'github.push',
        name: 'Push Event',
        type: 'github.push',
      });
      (serviceRegistry.getReactionByType as jest.Mock).mockReturnValue({
        id: 'slack.send_message',
        name: 'Send Message',
        type: 'slack.send_message',
      });
      (serviceRegistry.getService as jest.Mock).mockReturnValue({
        oauth: { enabled: false },
      });

      (mappingService.getMappingById as jest.Mock).mockResolvedValue(
        existingMapping
      );
      (mappingService.updateMapping as jest.Mock).mockResolvedValue(
        updatedMapping
      );
      (
        executionService.ensureExternalWebhooksForMapping as jest.Mock
      ).mockResolvedValue(undefined);

      const response = await request(app).put('/api/mappings/1').send({
        name: 'New Name',
        description: 'New description',
        is_active: false,
      });

      expect(response.status).toBe(200);
      expect(response.body.mapping.name).toBe('New Name');
      expect(response.body.mapping.description).toBe('New description');
      expect(response.body.mapping.is_active).toBe(false);
      expect(response.body.mapping.action.name).toBe('Push Event');
      expect(response.body.mapping.reactions[0].name).toBe('Send Message');
      expect(mappingService.updateMapping).toHaveBeenCalledWith(1, 1, {
        name: 'New Name',
        description: 'New description',
        is_active: false,
      });
    });

    it('should update action and reactions when provided', async () => {
      const existingMapping = {
        id: 1,
        name: 'Test Mapping',
        action: { type: 'github.push', config: { repository: 'old/repo' } },
        reactions: [{ type: 'slack.send_message', config: { channel: 'old' } }],
        is_active: true,
        created_by: 1,
      };

      const updatedMapping = {
        ...existingMapping,
        action: {
          type: 'github.pull_request',
          config: { repository: 'new/repo' },
        },
        reactions: [
          { type: 'discord.send_message', config: { channel: 'new' } },
        ],
      };

      (serviceRegistry.getActionByType as jest.Mock)
        .mockReturnValueOnce({
          id: 'github.pull_request',
          name: 'Pull Request',
          type: 'github.pull_request',
        })
        .mockReturnValueOnce({
          id: 'github.push',
          name: 'Push Event',
          type: 'github.push',
        });
      (serviceRegistry.getReactionByType as jest.Mock)
        .mockReturnValueOnce({
          id: 'discord.send_message',
          name: 'Send Discord Message',
          type: 'discord.send_message',
        })
        .mockReturnValueOnce({
          id: 'slack.send_message',
          name: 'Send Message',
          type: 'slack.send_message',
        });
      (serviceRegistry.getService as jest.Mock).mockReturnValue({
        oauth: { enabled: false },
      });

      (mappingService.getMappingById as jest.Mock).mockResolvedValue(
        existingMapping
      );
      (mappingService.updateMapping as jest.Mock).mockResolvedValue(
        updatedMapping
      );
      (
        executionService.ensureExternalWebhooksForMapping as jest.Mock
      ).mockResolvedValue(undefined);

      const response = await request(app)
        .put('/api/mappings/1')
        .send({
          action: {
            type: 'github.pull_request',
            config: { repository: 'new/repo' },
          },
          reactions: [
            { type: 'discord.send_message', config: { channel: 'new' } },
          ],
        });

      expect(response.status).toBe(200);
      expect(response.body.mapping.action.type).toBe('github.pull_request');
      expect(response.body.mapping.reactions[0].type).toBe(
        'discord.send_message'
      );
      expect(
        executionService.ensureExternalWebhooksForMapping
      ).toHaveBeenCalledWith(updatedMapping, 1);
    });

    it('should return 404 if mapping not found', async () => {
      (mappingService.getMappingById as jest.Mock).mockResolvedValue(null);

      const response = await request(app).put('/api/mappings/999').send({
        name: 'New Name',
      });

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Mapping not found');
    });

    it('should return 400 for invalid mapping id', async () => {
      const response = await request(app).put('/api/mappings/invalid').send({
        name: 'New Name',
      });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Invalid mapping ID');
    });

    it('should return 400 for invalid request data', async () => {
      const existingMapping = {
        id: 1,
        name: 'Test Mapping',
        action: { type: 'github.push', config: {} },
        reactions: [{ type: 'slack.send_message', config: {} }],
        is_active: true,
        created_by: 1,
      };

      (mappingService.getMappingById as jest.Mock).mockResolvedValue(
        existingMapping
      );

      const response = await request(app).put('/api/mappings/1').send({
        name: '', // Invalid: empty string
      });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Invalid request data');
      expect(response.body.details).toContain(
        'Name must be a non-empty string if provided'
      );
    });

    it('should return 404 for invalid action type', async () => {
      const existingMapping = {
        id: 1,
        name: 'Test Mapping',
        action: { type: 'github.push', config: {} },
        reactions: [{ type: 'slack.send_message', config: {} }],
        is_active: true,
        created_by: 1,
      };

      (serviceRegistry.getActionByType as jest.Mock).mockReturnValue(null);
      (serviceRegistry.getReactionByType as jest.Mock).mockReturnValue({
        id: 'slack.send_message',
        name: 'Send Message',
        type: 'slack.send_message',
      });
      (mappingService.getMappingById as jest.Mock).mockResolvedValue(
        existingMapping
      );

      const response = await request(app)
        .put('/api/mappings/1')
        .send({
          action: { type: 'invalid.action', config: {} },
        });

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Invalid action or reaction types');
    });

    it('should return 404 for invalid reaction type', async () => {
      const existingMapping = {
        id: 1,
        name: 'Test Mapping',
        action: { type: 'github.push', config: {} },
        reactions: [{ type: 'slack.send_message', config: {} }],
        is_active: true,
        created_by: 1,
      };

      (serviceRegistry.getActionByType as jest.Mock).mockReturnValue({
        id: 'github.push',
        name: 'Push Event',
        type: 'github.push',
      });
      (serviceRegistry.getReactionByType as jest.Mock).mockReturnValue(null);
      (mappingService.getMappingById as jest.Mock).mockResolvedValue(
        existingMapping
      );

      const response = await request(app)
        .put('/api/mappings/1')
        .send({
          reactions: [{ type: 'invalid.reaction', config: {} }],
        });

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Invalid action or reaction types');
    });

    it('should return 403 for missing service authentication', async () => {
      const existingMapping = {
        id: 1,
        name: 'Test Mapping',
        action: { type: 'github.push', config: {} },
        reactions: [{ type: 'slack.send_message', config: {} }],
        is_active: true,
        created_by: 1,
      };

      (serviceRegistry.getActionByType as jest.Mock).mockReturnValue({
        id: 'github.push',
        name: 'Push Event',
        type: 'github.push',
      });
      (serviceRegistry.getReactionByType as jest.Mock).mockReturnValue({
        id: 'slack.send_message',
        name: 'Send Message',
        type: 'slack.send_message',
      });
      (serviceRegistry.getService as jest.Mock).mockReturnValue({
        oauth: { enabled: true },
      });

      // Mock OAuth service to return no token
      const mockOAuth = {
        getUserToken: jest.fn().mockResolvedValue(null),
      };
      jest.doMock('../../../src/services/services/github/oauth', () => ({
        githubOAuth: mockOAuth,
      }));
      jest.doMock('../../../src/services/services/slack/oauth', () => ({
        slackOAuth: mockOAuth,
      }));

      (mappingService.getMappingById as jest.Mock).mockResolvedValue(
        existingMapping
      );

      const response = await request(app)
        .put('/api/mappings/1')
        .send({
          action: { type: 'github.push', config: { repository: 'test/repo' } },
        });

      expect(response.status).toBe(403);
      expect(response.body.error).toBe('Missing service authentication');
    });

    it('should return 500 on service error', async () => {
      const existingMapping = {
        id: 1,
        name: 'Test Mapping',
        action: { type: 'github.push', config: {} },
        reactions: [{ type: 'slack.send_message', config: {} }],
        is_active: true,
        created_by: 1,
      };

      (mappingService.getMappingById as jest.Mock).mockResolvedValue(
        existingMapping
      );
      (mappingService.updateMapping as jest.Mock).mockRejectedValue(
        new Error('Database error')
      );

      const response = await request(app).put('/api/mappings/1').send({
        name: 'New Name',
      });

      expect(response.status).toBe(500);
      expect(response.body.error).toBe(
        'Internal Server Error in update mapping'
      );
    });

    it('should update only provided fields and keep others unchanged', async () => {
      const existingMapping = {
        id: 1,
        name: 'Old Name',
        description: 'Old description',
        action: { type: 'github.push', config: { repository: 'old/repo' } },
        reactions: [{ type: 'slack.send_message', config: { channel: 'old' } }],
        is_active: true,
        created_by: 1,
        created_at: '2025-10-23T08:56:44.999Z',
        updated_at: '2025-10-23T08:56:44.999Z',
      };

      const updatedMapping = {
        ...existingMapping,
        name: 'New Name',
        // description, action, reactions, is_active should remain the same
      };

      (serviceRegistry.getActionByType as jest.Mock).mockReturnValue({
        id: 'github.push',
        name: 'Push Event',
        type: 'github.push',
      });
      (serviceRegistry.getReactionByType as jest.Mock).mockReturnValue({
        id: 'slack.send_message',
        name: 'Send Message',
        type: 'slack.send_message',
      });
      (serviceRegistry.getService as jest.Mock).mockReturnValue({
        oauth: { enabled: false },
      });

      (mappingService.getMappingById as jest.Mock).mockResolvedValue(
        existingMapping
      );
      (mappingService.updateMapping as jest.Mock).mockResolvedValue(
        updatedMapping
      );

      const response = await request(app).put('/api/mappings/1').send({
        name: 'New Name',
      });

      expect(response.status).toBe(200);
      expect(response.body.mapping.name).toBe('New Name');
      expect(response.body.mapping.description).toBe('Old description'); // unchanged
      expect(response.body.mapping.is_active).toBe(true); // unchanged
      expect(mappingService.updateMapping).toHaveBeenCalledWith(1, 1, {
        name: 'New Name',
      });
    });
  });

  describe('Validation Functions', () => {
    it('should validate mapping request with all required fields', async () => {
      (serviceRegistry.getActionByType as jest.Mock).mockReturnValue({
        id: 'github.push',
        name: 'Push Event',
        type: 'github.push',
      });
      (serviceRegistry.getReactionByType as jest.Mock).mockReturnValue({
        id: 'slack.send_message',
        name: 'Send Message',
        type: 'slack.send_message',
      });
      (serviceRegistry.getService as jest.Mock).mockReturnValue({
        oauth: { enabled: false },
      });
      (mappingService.createMapping as jest.Mock).mockResolvedValue({
        id: 1,
        name: 'Valid Mapping',
        description: null,
        action: { type: 'github.push', config: { repository: 'test/repo' } },
        reactions: [
          { type: 'slack.send_message', config: { channel: 'general' } },
        ],
        is_active: true,
        created_by: 1,
        created_at: '2025-10-23T08:56:44.999Z',
        updated_at: '2025-10-23T08:56:44.999Z',
      });
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
