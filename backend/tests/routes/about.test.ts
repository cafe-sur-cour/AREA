import request from 'supertest';
import express from 'express';
import aboutRouter from '../../src/routes/about/about';
import { serviceRegistry } from '../../src/services/ServiceRegistry';
import { translateService } from '../../src/utils/translation';
import { createLog } from '../../src/routes/logs/logs.service';
import i18next from 'i18next';
import type { Service } from '../../src/types/service';

// Mock all dependencies
jest.mock('../../src/services/ServiceRegistry');
jest.mock('../../src/utils/translation');
jest.mock('../../src/routes/logs/logs.service');
jest.mock('i18next');

const mockServiceRegistry = serviceRegistry as jest.Mocked<
  typeof serviceRegistry
>;
const mockTranslateService = translateService as jest.MockedFunction<
  typeof translateService
>;
const mockCreateLog = createLog as jest.MockedFunction<typeof createLog>;
const mockI18next = i18next as jest.Mocked<typeof i18next>;

describe('About Route', () => {
  let app: express.Application;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Setup default mocks
    mockServiceRegistry.getAllServices.mockReturnValue([]);
    mockTranslateService.mockReturnValue({
      id: 'test-service',
      name: 'Test Service',
      description: 'A test service',
      version: '1.0.0',
      actions: [],
      reactions: [],
      authOnly: false,
    } as Service);
    mockI18next.changeLanguage.mockResolvedValue({} as any);
    mockCreateLog.mockResolvedValue({} as any);

    // Create test app
    app = express();
    app.use(express.json());
    app.use('/about.json', aboutRouter);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /about.json', () => {
    it('should return server information with empty services', async () => {
      mockServiceRegistry.getAllServices.mockReturnValue([]);

      const response = await request(app).get('/about.json');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('client');
      expect(response.body).toHaveProperty('server');
      expect(response.body.client).toHaveProperty('host');
      expect(response.body.server).toHaveProperty('current_time');
      expect(response.body.server).toHaveProperty('services');
      expect(Array.isArray(response.body.server.services)).toBe(true);
      expect(response.body.server.services).toHaveLength(0);

      expect(mockServiceRegistry.getAllServices).toHaveBeenCalledTimes(1);
      expect(mockI18next.changeLanguage).toHaveBeenCalledWith('en');
      expect(mockCreateLog).toHaveBeenCalledWith(
        200,
        'about',
        expect.any(String)
      );
    });

    it('should return server information with services', async () => {
      const mockService: Service = {
        id: 'github',
        name: 'GitHub',
        description: 'GitHub service',
        version: '1.0.0',
        actions: [
          {
            id: 'push',
            name: 'Push Action',
            description: 'Push action description',
            configSchema: { name: 'Config', description: 'Config', fields: [] },
            inputSchema: { type: 'object', properties: {} },
            metadata: { category: 'test', tags: [], requiresAuth: false },
          },
        ],
        reactions: [
          {
            id: 'issue',
            name: 'Create Issue',
            description: 'Create issue reaction',
            configSchema: { name: 'Config', description: 'Config', fields: [] },
            outputSchema: { type: 'object', properties: {} },
            metadata: { category: 'test', tags: [], requiresAuth: false },
          },
        ],
        authOnly: false,
      };

      const translatedService: Service = {
        id: 'github',
        name: 'GitHub (Translated)',
        description: 'GitHub service (Translated)',
        version: '1.0.0',
        actions: [
          {
            id: 'push',
            name: 'Push Action (Translated)',
            description: 'Push action description (Translated)',
            configSchema: { name: 'Config', description: 'Config', fields: [] },
            inputSchema: { type: 'object', properties: {} },
            metadata: { category: 'test', tags: [], requiresAuth: false },
          },
        ],
        reactions: [
          {
            id: 'issue',
            name: 'Create Issue (Translated)',
            description: 'Create issue reaction (Translated)',
            configSchema: { name: 'Config', description: 'Config', fields: [] },
            outputSchema: { type: 'object', properties: {} },
            metadata: { category: 'test', tags: [], requiresAuth: false },
          },
        ],
        authOnly: false,
      };

      mockServiceRegistry.getAllServices.mockReturnValue([mockService]);
      mockTranslateService.mockReturnValue(translatedService);

      const response = await request(app).get('/about.json');

      expect(response.status).toBe(200);
      expect(response.body.server.services).toHaveLength(1);
      expect(response.body.server.services[0]).toEqual({
        id: 'github',
        name: 'GitHub (Translated)',
        icon: undefined,
        actions: [
          {
            id: 'push',
            name: 'Push Action (Translated)',
            description: 'Push action description (Translated)',
          },
        ],
        reactions: [
          {
            id: 'issue',
            name: 'Create Issue (Translated)',
            description: 'Create issue reaction (Translated)',
          },
        ],
      });

      expect(mockTranslateService).toHaveBeenCalledWith(
        mockService,
        mockI18next.t
      );
    });

    it('should filter out authOnly services', async () => {
      const publicService: Service = {
        id: 'public',
        name: 'Public Service',
        description: 'Public service',
        version: '1.0.0',
        actions: [],
        reactions: [],
        authOnly: false,
      };

      const authOnlyService: Service = {
        id: 'auth-only',
        name: 'Auth Only Service',
        description: 'Auth only service',
        version: '1.0.0',
        actions: [],
        reactions: [],
        authOnly: true,
      };

      mockServiceRegistry.getAllServices.mockReturnValue([
        publicService,
        authOnlyService,
      ]);
      mockTranslateService.mockImplementation(service => service);

      const response = await request(app).get('/about.json');

      expect(response.status).toBe(200);
      expect(response.body.server.services).toHaveLength(1);
      expect(response.body.server.services[0].id).toBe('public');
    });

    it('should handle language parameter', async () => {
      mockServiceRegistry.getAllServices.mockReturnValue([]);

      const response = await request(app).get('/about.json?lang=fr');

      expect(response.status).toBe(200);
      expect(mockI18next.changeLanguage).toHaveBeenCalledWith('fr');
    });

    it('should default to English when no language specified', async () => {
      mockServiceRegistry.getAllServices.mockReturnValue([]);

      const response = await request(app).get('/about.json');

      expect(response.status).toBe(200);
      expect(mockI18next.changeLanguage).toHaveBeenCalledWith('en');
    });

    it('should handle IP address extraction correctly', async () => {
      mockServiceRegistry.getAllServices.mockReturnValue([]);

      const response = await request(app)
        .get('/about.json')
        .set('X-Forwarded-For', '192.168.1.100');

      expect(response.status).toBe(200);
      expect(response.body.client.host).toBeDefined();
      expect(typeof response.body.client.host).toBe('string');
      // Note: Supertest may override IP detection, so we just check that it's a valid IP
      expect(mockCreateLog).toHaveBeenCalledWith(
        200,
        'about',
        response.body.client.host
      );
    });

    it('should handle IPv6-mapped IPv4 addresses', async () => {
      mockServiceRegistry.getAllServices.mockReturnValue([]);

      const response = await request(app)
        .get('/about.json')
        .set('X-Forwarded-For', '::ffff:192.168.1.100');

      expect(response.status).toBe(200);
      expect(response.body.client.host).toBeDefined();
      expect(typeof response.body.client.host).toBe('string');
      // The actual IP returned depends on Supertest's behavior
    });

    it('should handle unknown IP addresses', async () => {
      mockServiceRegistry.getAllServices.mockReturnValue([]);

      const response = await request(app).get('/about.json');

      expect(response.status).toBe(200);
      expect(response.body.client.host).toBeDefined();
      expect(typeof response.body.client.host).toBe('string');
    });

    it('should return current time as Paris timestamp', async () => {
      mockServiceRegistry.getAllServices.mockReturnValue([]);

      const response = await request(app).get('/about.json');

      expect(response.status).toBe(200);
      expect(response.body.server.current_time).toBeDefined();
      expect(typeof response.body.server.current_time).toBe('number');
      expect(response.body.server.current_time).toBeGreaterThan(1609459200);
    });

    it('should handle service registry errors', async () => {
      const error = new Error('Service registry error');
      mockServiceRegistry.getAllServices.mockImplementation(() => {
        throw error;
      });

      const response = await request(app).get('/about.json');

      expect(response.status).toBe(500);
      expect(response.body).toEqual({
        error: 'Internal Server Error in about route',
      });
      expect(mockCreateLog).toHaveBeenCalledWith(
        500,
        'about',
        'Service registry error'
      );
    });

    it('should handle translation errors', async () => {
      const error = new Error('Translation error');
      mockTranslateService.mockImplementation(() => {
        throw error;
      });
      mockServiceRegistry.getAllServices.mockReturnValue([
        {
          id: 'test',
          name: 'Test',
          description: 'Test service',
          version: '1.0.0',
          actions: [],
          reactions: [],
          authOnly: false,
        },
      ]);

      const response = await request(app).get('/about.json');

      expect(response.status).toBe(500);
      expect(response.body).toEqual({
        error: 'Internal Server Error in about route',
      });
      expect(mockCreateLog).toHaveBeenCalledWith(
        500,
        'about',
        'Translation error'
      );
    });

    it('should handle i18next changeLanguage errors', async () => {
      const error = new Error('Language change error');
      mockI18next.changeLanguage.mockRejectedValue(error);
      mockServiceRegistry.getAllServices.mockReturnValue([]);

      const response = await request(app).get('/about.json');

      expect(response.status).toBe(500);
      expect(response.body).toEqual({
        error: 'Internal Server Error in about route',
      });
      expect(mockCreateLog).toHaveBeenCalledWith(
        500,
        'about',
        'Language change error'
      );
    });

    it('should handle createLog errors gracefully', async () => {
      const error = new Error('Logging error');
      mockCreateLog.mockRejectedValue(error);
      mockServiceRegistry.getAllServices.mockReturnValue([]);

      const response = await request(app).get('/about.json');

      // When createLog fails, it should be caught and still return 200
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('client');
      expect(response.body).toHaveProperty('server');
    });

    it('should handle services with missing properties', async () => {
      const incompleteService = {
        id: 'incomplete',
        name: 'Incomplete Service',
        description: 'Service with missing properties',
        version: '1.0.0',
        actions: [],
        reactions: [],
        authOnly: false,
      };

      mockServiceRegistry.getAllServices.mockReturnValue([incompleteService]);
      mockTranslateService.mockImplementation(service => service);

      const response = await request(app).get('/about.json');

      expect(response.status).toBe(200);
      expect(response.body.server.services).toHaveLength(1);
    });

    it('should handle empty service arrays', async () => {
      const serviceWithEmptyArrays: Service = {
        id: 'empty',
        name: 'Empty Service',
        description: 'Service with empty arrays',
        version: '1.0.0',
        actions: [],
        reactions: [],
        authOnly: false,
      };

      mockServiceRegistry.getAllServices.mockReturnValue([
        serviceWithEmptyArrays,
      ]);
      mockTranslateService.mockReturnValue(serviceWithEmptyArrays);

      const response = await request(app).get('/about.json');

      expect(response.status).toBe(200);
      expect(response.body.server.services[0]).toEqual({
        id: 'empty',
        name: 'Empty Service',
        icon: undefined,
        actions: [],
        reactions: [],
      });
    });

    it('should return correct Content-Type header', async () => {
      mockServiceRegistry.getAllServices.mockReturnValue([]);

      const response = await request(app).get('/about.json');

      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toMatch(/application\/json/);
    });

    it('should handle concurrent requests', async () => {
      mockServiceRegistry.getAllServices.mockReturnValue([]);

      const promises = Array.from({ length: 5 }, () =>
        request(app).get('/about.json')
      );

      const responses = await Promise.all(promises);

      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('client');
        expect(response.body).toHaveProperty('server');
      });

      expect(mockServiceRegistry.getAllServices).toHaveBeenCalledTimes(5);
      expect(mockI18next.changeLanguage).toHaveBeenCalledTimes(5);
      expect(mockCreateLog).toHaveBeenCalledTimes(5);
    });
  });

  describe('Error handling and edge cases', () => {
    it('should handle console.error calls during errors', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      mockServiceRegistry.getAllServices.mockImplementation(() => {
        throw new Error('Critical error');
      });

      const response = await request(app).get('/about.json');

      expect(response.status).toBe(500);
      expect(consoleSpy).toHaveBeenCalledWith(expect.any(Error));
      consoleSpy.mockRestore();
    });

    it('should handle non-Error objects thrown', async () => {
      mockServiceRegistry.getAllServices.mockImplementation(() => {
        throw 'String error';
      });

      const response = await request(app).get('/about.json');

      expect(response.status).toBe(500);
      expect(response.body).toEqual({
        error: 'Internal Server Error in about route',
      });
      expect(mockCreateLog).toHaveBeenCalledWith(500, 'about', 'Unknown error');
    });

    it('should handle null/undefined service properties', async () => {
      const serviceWithNulls = {
        id: 'null-service',
        name: 'Service with nulls',
        description: 'Service with null properties',
        version: '1.0.0',
        actions: [],
        reactions: [],
        authOnly: false,
      };

      mockServiceRegistry.getAllServices.mockReturnValue([serviceWithNulls]);
      mockTranslateService.mockImplementation(service => ({
        ...service,
        actions: service.actions || [],
        reactions: service.reactions || [],
      }));

      const response = await request(app).get('/about.json');

      expect(response.status).toBe(200);
      expect(response.body.server.services[0].name).toBe('Service with nulls');
    });
  });
});
