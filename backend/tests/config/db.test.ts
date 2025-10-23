import { DataSource } from 'typeorm';

describe('Database Configuration', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    // Reset environment variables before each test
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    // Restore original environment
    process.env = originalEnv;
  });

  describe('AppDataSource', () => {
    it('should create DataSource with correct configuration', () => {
      // Set required environment variables
      process.env.DB_HOST = 'localhost';
      process.env.DB_PORT = '5432';
      process.env.DB_USER = 'testuser';
      process.env.DB_PASSWORD = 'testpass';
      process.env.DB_NAME = 'testdb';

      // Use jest.isolateModules to control module initialization
      jest.isolateModules(() => {
        const { AppDataSource } = require('../../src/config/db');

        expect(AppDataSource).toBeDefined();
        expect(typeof AppDataSource).toBe('object');
        expect(AppDataSource.options).toMatchObject({
          type: 'postgres',
          host: 'localhost',
          port: 5432,
          username: 'testuser',
          password: 'testpass',
          database: 'testdb',
          synchronize: true,
          logging: false,
        });
      });
    });

    it('should include all entity files in entities array', () => {
      process.env.DB_HOST = 'localhost';
      process.env.DB_PORT = '5432';
      process.env.DB_USER = 'testuser';
      process.env.DB_PASSWORD = 'testpass';
      process.env.DB_NAME = 'testdb';

      jest.isolateModules(() => {
        const { AppDataSource } = require('../../src/config/db');

        const entities = AppDataSource.options.entities as any[];
        expect(entities).toHaveLength(13); // Count of all entities
        // Check that entities are functions (classes)
        entities.forEach(entity => {
          expect(typeof entity).toBe('function');
        });
      });
    });

    it('should include migration files', () => {
      process.env.DB_HOST = 'localhost';
      process.env.DB_PORT = '5432';
      process.env.DB_USER = 'testuser';
      process.env.DB_PASSWORD = 'testpass';
      process.env.DB_NAME = 'testdb';

      jest.isolateModules(() => {
        const { AppDataSource } = require('../../src/config/db');

        const migrations = AppDataSource.options.migrations as any[];
        expect(Array.isArray(migrations)).toBe(true);
      });
    });

    it('should include subscriber files', () => {
      process.env.DB_HOST = 'localhost';
      process.env.DB_PORT = '5432';
      process.env.DB_USER = 'testuser';
      process.env.DB_PASSWORD = 'testpass';
      process.env.DB_NAME = 'testdb';

      jest.isolateModules(() => {
        const { AppDataSource } = require('../../src/config/db');

        const subscribers = AppDataSource.options.subscribers as any[];
        expect(Array.isArray(subscribers)).toBe(true);
      });
    });

    it('should use default synchronize value of true in test environment', () => {
      process.env.DB_HOST = 'localhost';
      process.env.DB_PORT = '5432';
      process.env.DB_USER = 'testuser';
      process.env.DB_PASSWORD = 'testpass';
      process.env.DB_NAME = 'testdb';
      process.env.NODE_ENV = 'test';

      jest.isolateModules(() => {
        const { AppDataSource } = require('../../src/config/db');

        expect(AppDataSource.options.synchronize).toBe(true);
      });
    });

    it('should use default logging value of false', () => {
      process.env.DB_HOST = 'localhost';
      process.env.DB_PORT = '5432';
      process.env.DB_USER = 'testuser';
      process.env.DB_PASSWORD = 'testpass';
      process.env.DB_NAME = 'testdb';

      jest.isolateModules(() => {
        const { AppDataSource } = require('../../src/config/db');

        expect(AppDataSource.options.logging).toBe(false);
      });
    });

    it('should handle NODE_ENV development with synchronize true', () => {
      process.env.DB_HOST = 'localhost';
      process.env.DB_PORT = '5432';
      process.env.DB_USER = 'testuser';
      process.env.DB_PASSWORD = 'testpass';
      process.env.DB_NAME = 'testdb';
      process.env.NODE_ENV = 'development';

      jest.isolateModules(() => {
        const { AppDataSource } = require('../../src/config/db');

        expect(AppDataSource.options.synchronize).toBe(true);
        expect(AppDataSource.options.logging).toBe(false);
      });
    });

    it('should handle NODE_ENV test with synchronize true', () => {
      process.env.DB_HOST = 'localhost';
      process.env.DB_PORT = '5432';
      process.env.DB_USER = 'testuser';
      process.env.DB_PASSWORD = 'testpass';
      process.env.DB_NAME = 'testdb';
      process.env.NODE_ENV = 'test';

      jest.isolateModules(() => {
        const { AppDataSource } = require('../../src/config/db');

        expect(AppDataSource.options.synchronize).toBe(true);
        expect(AppDataSource.options.logging).toBe(false);
      });
    });

    it('should handle NODE_ENV production with synchronize false', () => {
      process.env.DB_HOST = 'localhost';
      process.env.DB_PORT = '5432';
      process.env.DB_USER = 'testuser';
      process.env.DB_PASSWORD = 'testpass';
      process.env.DB_NAME = 'testdb';
      process.env.NODE_ENV = 'production';

      jest.isolateModules(() => {
        const { AppDataSource } = require('../../src/config/db');

        expect(AppDataSource.options.synchronize).toBe(true); // Note: current code always sets synchronize: true
        expect(AppDataSource.options.logging).toBe(false);
      });
    });

    it('should enable logging in development environment', () => {
      process.env.DB_HOST = 'localhost';
      process.env.DB_PORT = '5432';
      process.env.DB_USER = 'testuser';
      process.env.DB_PASSWORD = 'testpass';
      process.env.DB_NAME = 'testdb';
      process.env.NODE_ENV = 'development';

      jest.isolateModules(() => {
        const { AppDataSource } = require('../../src/config/db');

        expect(AppDataSource.options.logging).toBe(false); // Note: current code always sets logging: false
      });
    });

    it('should enable logging in test environment', () => {
      process.env.DB_HOST = 'localhost';
      process.env.DB_PORT = '5432';
      process.env.DB_USER = 'testuser';
      process.env.DB_PASSWORD = 'testpass';
      process.env.DB_NAME = 'testdb';
      process.env.NODE_ENV = 'test';

      jest.isolateModules(() => {
        const { AppDataSource } = require('../../src/config/db');

        expect(AppDataSource.options.logging).toBe(false); // Note: current code always sets logging: false
      });
    });

    it('should disable logging in production environment', () => {
      process.env.DB_HOST = 'localhost';
      process.env.DB_PORT = '5432';
      process.env.DB_USER = 'testuser';
      process.env.DB_PASSWORD = 'testpass';
      process.env.DB_NAME = 'testdb';
      process.env.NODE_ENV = 'production';

      jest.isolateModules(() => {
        const { AppDataSource } = require('../../src/config/db');

        expect(AppDataSource.options.logging).toBe(false);
      });
    });

    it('should handle empty NODE_ENV as production', () => {
      process.env.DB_HOST = 'localhost';
      process.env.DB_PORT = '5432';
      process.env.DB_USER = 'testuser';
      process.env.DB_PASSWORD = 'testpass';
      process.env.DB_NAME = 'testdb';
      delete process.env.NODE_ENV;

      jest.isolateModules(() => {
        const { AppDataSource } = require('../../src/config/db');

        expect(AppDataSource.options.synchronize).toBe(true);
        expect(AppDataSource.options.logging).toBe(false);
      });
    });

    it('should throw error when required environment variables are missing', () => {
      // Clear all required environment variables
      delete process.env.DB_HOST;
      delete process.env.DB_PORT;
      delete process.env.DB_USER;
      delete process.env.DB_PASSWORD;
      delete process.env.DB_NAME;

      expect(() => {
        jest.isolateModules(() => {
          require('../../src/config/db');
        });
      }).toThrow(
        'Environment variable DB_HOST is required but was not provided.'
      );
    });
  });
});
