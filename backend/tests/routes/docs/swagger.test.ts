import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { serviceRegistry } from '../../../src/services/ServiceRegistry';
import type { Express } from 'express';

// Mock dependencies before imports
jest.mock('swagger-jsdoc');
jest.mock('swagger-ui-express');
jest.mock('../../../src/services/ServiceRegistry', () => ({
  serviceRegistry: {
    getAllServices: jest.fn().mockReturnValue([]),
  },
}));

const mockSwaggerJsdoc = swaggerJsdoc as jest.MockedFunction<
  typeof swaggerJsdoc
>;
const mockSwaggerUi = swaggerUi as jest.Mocked<typeof swaggerUi>;
const mockServiceRegistry = serviceRegistry as jest.Mocked<
  typeof serviceRegistry
>;

describe('Swagger Documentation', () => {
  let mockApp: any;

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock Express app
    mockApp = {
      use: jest.fn(),
      get: jest.fn(),
    };

    // Mock swagger UI
    (mockSwaggerUi.serve as any) = ['swagger-serve-middleware'];
    mockSwaggerUi.generateHTML = jest
      .fn()
      .mockReturnValue('<html>Swagger UI</html>');

    // Mock swaggerJsdoc to return a basic spec
    mockSwaggerJsdoc.mockReturnValue({
      openapi: '3.0.0',
      info: {
        title: 'My API',
        version: '1.0.0',
      },
      paths: {},
    });
  });

  describe('setupSwagger', () => {
    it('should mount swagger UI at /api-docs', () => {
      // Reset service registry mock
      mockServiceRegistry.getAllServices.mockReturnValue([]);

      // Re-import to trigger module execution
      jest.isolateModules(() => {
        const { setupSwagger } = require('../../../src/routes/docs/swagger');
        setupSwagger(mockApp as Express);
      });

      expect(mockApp.use).toHaveBeenCalledWith(
        '/api-docs',
        mockSwaggerUi.serve
      );
      expect(mockApp.get).toHaveBeenCalledWith(
        '/api-docs',
        expect.any(Function)
      );
    });

    it('should generate HTML for swagger docs', () => {
      mockServiceRegistry.getAllServices.mockReturnValue([]);

      jest.isolateModules(() => {
        const { setupSwagger } = require('../../../src/routes/docs/swagger');
        setupSwagger(mockApp as Express);
      });

      // Get the callback function passed to app.get
      const getCallback = mockApp.get.mock.calls[0][1];
      const mockReq = {};
      const mockRes = {
        send: jest.fn(),
      };

      getCallback(mockReq, mockRes);

      expect(mockRes.send).toHaveBeenCalled();
    });

    it('should handle services with supportsLogin=true', () => {
      mockServiceRegistry.getAllServices.mockReturnValue([
        {
          id: 'github',
          name: 'GitHub',
          oauth: {
            enabled: true,
            supportsLogin: true,
          },
        },
      ] as any);

      jest.isolateModules(() => {
        const { setupSwagger } = require('../../../src/routes/docs/swagger');
        setupSwagger(mockApp as Express);
      });

      // Get the callback and execute it
      const getCallback = mockApp.get.mock.calls[0][1];
      const mockRes = {
        send: jest.fn(),
      };

      getCallback({}, mockRes);

      // Verify generateHTML was called (paths would be generated inside)
      expect(mockSwaggerUi.generateHTML).toHaveBeenCalled();
    });

    it('should handle services with supportsLogin=false', () => {
      mockServiceRegistry.getAllServices.mockReturnValue([
        {
          id: 'spotify',
          name: 'Spotify',
          oauth: {
            enabled: true,
            supportsLogin: false,
          },
        },
      ] as any);

      jest.isolateModules(() => {
        const { setupSwagger } = require('../../../src/routes/docs/swagger');
        setupSwagger(mockApp as Express);
      });

      const getCallback = mockApp.get.mock.calls[0][1];
      const mockRes = {
        send: jest.fn(),
      };

      getCallback({}, mockRes);

      expect(mockSwaggerUi.generateHTML).toHaveBeenCalled();
    });

    it('should handle disabled services', () => {
      mockServiceRegistry.getAllServices.mockReturnValue([
        {
          id: 'facebook',
          name: 'Facebook',
          oauth: {
            enabled: false,
            supportsLogin: true,
          },
        },
      ] as any);

      jest.isolateModules(() => {
        const { setupSwagger } = require('../../../src/routes/docs/swagger');
        setupSwagger(mockApp as Express);
      });

      const getCallback = mockApp.get.mock.calls[0][1];
      const mockRes = {
        send: jest.fn(),
      };

      getCallback({}, mockRes);

      expect(mockSwaggerUi.generateHTML).toHaveBeenCalled();
    });

    it('should handle multiple services', () => {
      mockServiceRegistry.getAllServices.mockReturnValue([
        {
          id: 'github',
          name: 'GitHub',
          oauth: {
            enabled: true,
            supportsLogin: true,
          },
        },
        {
          id: 'spotify',
          name: 'Spotify',
          oauth: {
            enabled: true,
            supportsLogin: false,
          },
        },
        {
          id: 'google',
          name: 'Google',
          oauth: {
            enabled: true,
            supportsLogin: true,
          },
        },
      ] as any);

      jest.isolateModules(() => {
        const { setupSwagger } = require('../../../src/routes/docs/swagger');
        setupSwagger(mockApp as Express);
      });

      const getCallback = mockApp.get.mock.calls[0][1];
      const mockRes = {
        send: jest.fn(),
      };

      getCallback({}, mockRes);

      expect(mockSwaggerUi.generateHTML).toHaveBeenCalled();
      expect(mockRes.send).toHaveBeenCalled();
    });

    it('should handle empty service registry', () => {
      mockServiceRegistry.getAllServices.mockReturnValue([]);

      jest.isolateModules(() => {
        const { setupSwagger } = require('../../../src/routes/docs/swagger');
        setupSwagger(mockApp as Express);
      });

      expect(mockApp.use).toHaveBeenCalledWith(
        '/api-docs',
        mockSwaggerUi.serve
      );
      expect(mockApp.get).toHaveBeenCalled();
    });

    it('should handle services without oauth property', () => {
      mockServiceRegistry.getAllServices.mockReturnValue([
        {
          id: 'timer',
          name: 'Timer',
          // No oauth property
        },
      ] as any);

      jest.isolateModules(() => {
        const { setupSwagger } = require('../../../src/routes/docs/swagger');
        setupSwagger(mockApp as Express);
      });

      const getCallback = mockApp.get.mock.calls[0][1];
      const mockRes = {
        send: jest.fn(),
      };

      // Should not throw
      expect(() => getCallback({}, mockRes)).not.toThrow();
      expect(mockSwaggerUi.generateHTML).toHaveBeenCalled();
    });
  });
});
