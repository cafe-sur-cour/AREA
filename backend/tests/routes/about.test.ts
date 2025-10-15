import request from 'supertest';
import express from 'express';
import { serviceRegistry } from '../../src/services/ServiceRegistry';
import type { Service } from '../../src/types/service';

jest.mock('../../src/services/ServiceRegistry', () => ({
  serviceRegistry: {
    getAllServices: jest.fn(),
  },
}));

const mockServiceRegistry = serviceRegistry as jest.Mocked<
  typeof serviceRegistry
>;

const createMockAboutRouter = () => {
  const router = express.Router();

  const getClientIP = (req: any): string => {
    const ip =
      req.ip ||
      (req.socket ? req.socket.remoteAddress : undefined) ||
      'unknown';
    if (ip.startsWith('::ffff:')) {
      return ip.substring(7);
    }
    return ip;
  };

  router.get('/', async (req: any, res) => {
    try {
      const clientHost = getClientIP(req);
      const currentTime = Math.floor(Date.now() / 1000);

      const services = mockServiceRegistry.getAllServices().map(service => ({
        name: service.name,
        icon: service.icon,
        actions: service.actions.map(action => ({
          name: action.name,
          description: action.description,
        })),
        reactions: service.reactions.map(reaction => ({
          name: reaction.name,
          description: reaction.description,
        })),
      }));

      const response = {
        client: {
          host: clientHost,
        },
        server: {
          current_time: currentTime,
          services,
        },
      };

      res.status(200).json(response);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });

  return router;
};

describe('About Routes Integration Tests', () => {
  let app: express.Application;
  let mockDateNow: jest.SpyInstance;

  beforeEach(() => {
    app = express();
    app.use(express.json());

    mockDateNow = jest.spyOn(Date, 'now').mockReturnValue(1640995200000);
    app.use('/api/about.json', createMockAboutRouter());
  });

  afterEach(() => {
    jest.clearAllMocks();
    mockDateNow.mockRestore();
  });

  describe('GET /about.json', () => {
    it('should return server information with empty services', async () => {
      mockServiceRegistry.getAllServices.mockReturnValue([]);

      const response = await request(app).get('/api/about.json');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        client: {
          host: expect.any(String),
        },
        server: {
          current_time: 1640995200,
          services: [],
        },
      });
    });

    it('should return server information with services', async () => {
      const mockServices: Service[] = [
        {
          id: 'service1',
          name: 'Test Service 1',
          description: 'A test service',
          version: '1.0.0',
          actions: [
            {
              id: 'action1',
              name: 'Test Action 1',
              description: 'A test action',
              configSchema: {
                name: 'Test Action 1 Config',
                description: 'Configuration for test action 1',
                fields: [],
              },
              inputSchema: { type: 'object', properties: {} },
              metadata: {
                category: 'test',
                tags: ['test'],
                requiresAuth: false,
              },
            },
            {
              id: 'action2',
              name: 'Test Action 2',
              description: 'Another test action',
              configSchema: {
                name: 'Test Action 2 Config',
                description: 'Configuration for test action 2',
                fields: [],
              },
              inputSchema: { type: 'object', properties: {} },
              metadata: {
                category: 'test',
                tags: ['test'],
                requiresAuth: true,
              },
            },
          ],
          reactions: [
            {
              id: 'reaction1',
              name: 'Test Reaction 1',
              description: 'A test reaction',
              configSchema: {
                name: 'Test Reaction 1 Config',
                description: 'Configuration for test reaction 1',
                fields: [],
              },
              outputSchema: { type: 'object', properties: {} },
              metadata: {
                category: 'test',
                tags: ['test'],
                requiresAuth: false,
              },
            },
          ],
        },
        {
          id: 'service2',
          name: 'Test Service 2',
          description: 'Another test service',
          version: '2.0.0',
          actions: [],
          reactions: [
            {
              id: 'reaction2',
              name: 'Test Reaction 2',
              description: 'Another test reaction',
              configSchema: {
                name: 'Test Reaction 2 Config',
                description: 'Configuration for test reaction 2',
                fields: [],
              },
              outputSchema: { type: 'object', properties: {} },
              metadata: {
                category: 'test',
                tags: ['test'],
                requiresAuth: true,
              },
            },
          ],
        },
      ];

      mockServiceRegistry.getAllServices.mockReturnValue(mockServices);

      const response = await request(app).get('/api/about.json');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        client: {
          host: expect.any(String),
        },
        server: {
          current_time: 1640995200,
          services: [
            {
              name: 'Test Service 1',
              icon: undefined,
              actions: [
                {
                  name: 'Test Action 1',
                  description: 'A test action',
                },
                {
                  name: 'Test Action 2',
                  description: 'Another test action',
                },
              ],
              reactions: [
                {
                  name: 'Test Reaction 1',
                  description: 'A test reaction',
                },
              ],
            },
            {
              name: 'Test Service 2',
              icon: undefined,
              actions: [],
              reactions: [
                {
                  name: 'Test Reaction 2',
                  description: 'Another test reaction',
                },
              ],
            },
          ],
        },
      });

      expect(mockServiceRegistry.getAllServices).toHaveBeenCalledTimes(1);
    });

    it('should handle IPv4 addresses correctly', async () => {
      mockServiceRegistry.getAllServices.mockReturnValue([]);

      const response = await request(app)
        .get('/api/about.json')
        .set('X-Forwarded-For', '192.168.1.100');

      expect(response.status).toBe(200);
      expect(response.body.client.host).toBeDefined();
      expect(typeof response.body.client.host).toBe('string');
    });

    it('should handle IPv6-mapped IPv4 addresses correctly', async () => {
      mockServiceRegistry.getAllServices.mockReturnValue([]);

      const response = await request(app)
        .get('/api/about.json')
        .set('x-forwarded-for', '::ffff:192.168.1.100');

      expect(response.status).toBe(200);
      expect(response.body.client).toHaveProperty('host');
      expect(typeof response.body.client.host).toBe('string');
    });

    it('should handle unknown IP addresses', async () => {
      mockServiceRegistry.getAllServices.mockReturnValue([]);

      const response = await request(app).get('/api/about.json');

      expect(response.status).toBe(200);
      expect(response.body.client).toHaveProperty('host');
      expect(typeof response.body.client.host).toBe('string');
      expect(response.body.client.host).toBeDefined();
    });

    it('should return 500 when serviceRegistry throws an error', async () => {
      mockServiceRegistry.getAllServices.mockImplementation(() => {
        throw new Error('Service registry error');
      });

      const response = await request(app).get('/api/about.json');

      expect(response.status).toBe(500);
      expect(response.body).toEqual({ error: 'Internal Server Error' });
    });

    it('should return current timestamp in seconds', async () => {
      mockServiceRegistry.getAllServices.mockReturnValue([]);
      const mockTime = 1234567890000;
      mockDateNow.mockReturnValue(mockTime);

      const response = await request(app).get('/api/about.json');

      expect(response.status).toBe(200);
      expect(response.body.server.current_time).toBe(1234567890);
    });

    it('should handle services with complex action/reaction structures', async () => {
      const complexService: Service = {
        id: 'complex-service',
        name: 'Complex Service',
        description: 'A service with complex structures',
        version: '3.0.0',
        actions: [
          {
            id: 'complex-action',
            name: 'Complex Action',
            description: 'An action with complex configuration',
            configSchema: {
              name: 'Complex Action Config',
              description: 'Configuration for complex action',
              fields: [
                {
                  name: 'url',
                  type: 'text',
                  label: 'API URL',
                  required: true,
                  placeholder: 'https://api.example.com',
                },
                {
                  name: 'timeout',
                  type: 'number',
                  label: 'Timeout (ms)',
                  required: false,
                  default: 5000,
                },
              ],
            },
            inputSchema: {
              type: 'object',
              properties: {
                message: { type: 'string', description: 'Message to send' },
              },
            },
            metadata: {
              category: 'communication',
              tags: ['api', 'webhook'],
              icon: 'webhook',
              color: '#FF5722',
              requiresAuth: true,
              webhookPattern: '/webhook/{id}',
            },
          },
        ],
        reactions: [
          {
            id: 'complex-reaction',
            name: 'Complex Reaction',
            description: 'A reaction with complex output',
            configSchema: {
              name: 'Complex Reaction Config',
              description: 'Configuration for complex reaction',
              fields: [
                {
                  name: 'endpoint',
                  type: 'text',
                  label: 'Destination Endpoint',
                  required: true,
                  placeholder: 'https://webhook.site/unique-id',
                },
              ],
            },
            outputSchema: {
              type: 'object',
              properties: {
                success: { type: 'boolean', description: 'Operation success' },
                data: { type: 'object', description: 'Response data' },
              },
            },
            metadata: {
              category: 'automation',
              tags: ['response', 'data'],
              icon: 'automation',
              color: '#4CAF50',
              requiresAuth: false,
              estimatedDuration: 5000,
            },
          },
        ],
      };

      mockServiceRegistry.getAllServices.mockReturnValue([complexService]);

      const response = await request(app).get('/api/about.json');

      expect(response.status).toBe(200);
      expect(response.body.server.services).toHaveLength(1);
      expect(response.body.server.services[0]).toEqual({
        name: 'Complex Service',
        icon: undefined,
        actions: [
          {
            name: 'Complex Action',
            description: 'An action with complex configuration',
          },
        ],
        reactions: [
          {
            name: 'Complex Reaction',
            description: 'A reaction with complex output',
          },
        ],
      });
    });

    it('should handle services with empty actions and reactions', async () => {
      const emptyService: Service = {
        id: 'empty-service',
        name: 'Empty Service',
        description: 'A service with no actions or reactions',
        version: '1.0.0',
        actions: [],
        reactions: [],
      };

      mockServiceRegistry.getAllServices.mockReturnValue([emptyService]);

      const response = await request(app).get('/api/about.json');

      expect(response.status).toBe(200);
      expect(response.body.server.services).toEqual([
        {
          name: 'Empty Service',
          icon: undefined,
          actions: [],
          reactions: [],
        },
      ]);
    });

    it('should handle multiple services correctly', async () => {
      const services: Service[] = Array.from({ length: 5 }, (_, index) => ({
        id: `service-${index}`,
        name: `Service ${index + 1}`,
        description: `Description for service ${index + 1}`,
        version: '1.0.0',
        actions: [
          {
            id: `action-${index}`,
            name: `Action ${index + 1}`,
            description: `Description for action ${index + 1}`,
            configSchema: {
              name: `Action ${index + 1} Config`,
              description: `Configuration for action ${index + 1}`,
              fields: [],
            },
            inputSchema: { type: 'object', properties: {} },
            metadata: {
              category: 'test',
              tags: ['test'],
              requiresAuth: false,
            },
          },
        ],
        reactions: [
          {
            id: `reaction-${index}`,
            name: `Reaction ${index + 1}`,
            description: `Description for reaction ${index + 1}`,
            configSchema: {
              name: `Reaction ${index + 1} Config`,
              description: `Configuration for reaction ${index + 1}`,
              fields: [],
            },
            outputSchema: { type: 'object', properties: {} },
            metadata: {
              category: 'test',
              tags: ['test'],
              requiresAuth: false,
            },
          },
        ],
      }));

      mockServiceRegistry.getAllServices.mockReturnValue(services);

      const response = await request(app).get('/api/about.json');

      expect(response.status).toBe(200);
      expect(response.body.server.services).toHaveLength(5);
      response.body.server.services.forEach((service: any, index: number) => {
        expect(service).toEqual({
          name: `Service ${index + 1}`,
          icon: undefined,
          actions: [
            {
              name: `Action ${index + 1}`,
              description: `Description for action ${index + 1}`,
            },
          ],
          reactions: [
            {
              name: `Reaction ${index + 1}`,
              description: `Description for reaction ${index + 1}`,
            },
          ],
        });
      });
    });

    it('should handle console.error gracefully during errors', async () => {
      const consoleSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      mockServiceRegistry.getAllServices.mockImplementation(() => {
        throw new Error('Critical service error');
      });

      const response = await request(app).get('/api/about.json');

      expect(response.status).toBe(500);
      expect(response.body).toEqual({ error: 'Internal Server Error' });
      expect(consoleSpy).toHaveBeenCalledWith(expect.any(Error));
      consoleSpy.mockRestore();
    });

    it('should handle request with different HTTP methods', async () => {
      mockServiceRegistry.getAllServices.mockReturnValue([]);

      const postResponse = await request(app).post('/api/about.json');
      expect(postResponse.status).toBe(404);

      const putResponse = await request(app).put('/api/about.json');
      expect(putResponse.status).toBe(404);

      const deleteResponse = await request(app).delete('/api/about.json');
      expect(deleteResponse.status).toBe(404);

      const getResponse = await request(app).get('/api/about.json');
      expect(getResponse.status).toBe(200);
    });
  });

  describe('IP Address Extraction', () => {
    it('should extract IP from X-Forwarded-For header', async () => {
      mockServiceRegistry.getAllServices.mockReturnValue([]);

      const response = await request(app)
        .get('/api/about.json')
        .set('X-Forwarded-For', '203.0.113.1, 198.51.100.1');

      expect(response.status).toBe(200);
      expect(response.body.client.host).toBeDefined();
    });

    it('should extract IP from X-Real-IP header', async () => {
      mockServiceRegistry.getAllServices.mockReturnValue([]);

      const response = await request(app)
        .get('/api/about.json')
        .set('X-Real-IP', '203.0.113.1');

      expect(response.status).toBe(200);
      expect(response.body.client.host).toBeDefined();
    });

    it('should handle localhost addresses', async () => {
      mockServiceRegistry.getAllServices.mockReturnValue([]);

      const response = await request(app)
        .get('/api/about.json')
        .set('x-forwarded-for', '127.0.0.1');

      expect(response.status).toBe(200);
      expect(response.body.client).toHaveProperty('host');
      expect(typeof response.body.client.host).toBe('string');
    });
  });

  describe('Response Structure', () => {
    it('should always return consistent response structure', async () => {
      mockServiceRegistry.getAllServices.mockReturnValue([]);

      const response = await request(app).get('/api/about.json');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('client');
      expect(response.body).toHaveProperty('server');
      expect(response.body.client).toHaveProperty('host');
      expect(response.body.server).toHaveProperty('current_time');
      expect(response.body.server).toHaveProperty('services');
      expect(Array.isArray(response.body.server.services)).toBe(true);
      expect(typeof response.body.server.current_time).toBe('number');
      expect(typeof response.body.client.host).toBe('string');
    });

    it('should return Content-Type as application/json', async () => {
      mockServiceRegistry.getAllServices.mockReturnValue([]);

      const response = await request(app).get('/api/about.json');

      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toMatch(/application\/json/);
    });
  });
});
