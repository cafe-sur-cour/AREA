import request from 'supertest';
import express from 'express';
import apiRouter from '../../src/routes/api/api';
import { AppDataSource } from '../../src/config/db';

// Mock the entire db module to prevent environment variable requirements
jest.mock('../../src/config/db', () => ({
  AppDataSource: {
    query: jest.fn(),
  },
}));

const mockAppDataSource = AppDataSource as jest.Mocked<typeof AppDataSource>;

describe('API Routes', () => {
  let app: express.Application;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Setup default mocks
    mockAppDataSource.query.mockResolvedValue([]);

    // Create test app
    app = express();
    app.use(express.json());
    app.use('/api', apiRouter);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/health', () => {
    it('should return OK status', async () => {
      const response = await request(app).get('/api/health');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ status: 'OK' });
      expect(response.headers['content-type']).toMatch(/application\/json/);
    });

    it('should handle multiple concurrent requests', async () => {
      const promises = Array.from({ length: 10 }, () =>
        request(app).get('/api/health')
      );

      const responses = await Promise.all(promises);

      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body).toEqual({ status: 'OK' });
      });
    });

    it('should work with different HTTP methods', async () => {
      // GET should work
      const getResponse = await request(app).get('/api/health');
      expect(getResponse.status).toBe(200);

      // Other methods should not be handled by this route
      const postResponse = await request(app).post('/api/health');
      expect(postResponse.status).toBe(404);

      const putResponse = await request(app).put('/api/health');
      expect(putResponse.status).toBe(404);

      const deleteResponse = await request(app).delete('/api/health');
      expect(deleteResponse.status).toBe(404);
    });

    it('should return consistent response structure', async () => {
      const response = await request(app).get('/api/health');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status');
      expect(typeof response.body.status).toBe('string');
      expect(response.body.status).toBe('OK');
    });

    it('should handle query parameters gracefully', async () => {
      const response = await request(app)
        .get('/api/health')
        .query({ param: 'value' });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ status: 'OK' });
    });

    it('should handle request body gracefully', async () => {
      const response = await request(app)
        .get('/api/health')
        .send({ some: 'data' });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ status: 'OK' });
    });
  });

  describe('GET /api/health-db', () => {
    it('should return database OK when connection is successful', async () => {
      mockAppDataSource.query.mockResolvedValue([{ '1': 1 }]);

      const response = await request(app).get('/api/health-db');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ database: 'OK' });
      expect(mockAppDataSource.query).toHaveBeenCalledWith('SELECT 1');
      expect(mockAppDataSource.query).toHaveBeenCalledTimes(1);
    });

    it('should return database Error when connection fails', async () => {
      const dbError = new Error('Connection refused');
      mockAppDataSource.query.mockRejectedValue(dbError);

      const response = await request(app).get('/api/health-db');

      expect(response.status).toBe(500);
      expect(response.body).toEqual({
        database: 'Error',
        error: 'Connection refused',
      });
      expect(mockAppDataSource.query).toHaveBeenCalledWith('SELECT 1');
      expect(mockAppDataSource.query).toHaveBeenCalledTimes(1);
    });

    it('should handle non-Error objects thrown by query', async () => {
      mockAppDataSource.query.mockRejectedValue('String error');

      const response = await request(app).get('/api/health-db');

      expect(response.status).toBe(500);
      expect(response.body).toEqual({
        database: 'Error',
        error: 'String error',
      });
    });

    it('should handle null/undefined thrown by query', async () => {
      mockAppDataSource.query.mockRejectedValue(null);

      const response = await request(app).get('/api/health-db');

      expect(response.status).toBe(500);
      expect(response.body).toEqual({
        database: 'Error',
        error: 'Unknown error',
      });
    });

    it('should handle empty result from query', async () => {
      mockAppDataSource.query.mockResolvedValue([]);

      const response = await request(app).get('/api/health-db');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ database: 'OK' });
    });

    it('should handle query with different result formats', async () => {
      mockAppDataSource.query.mockResolvedValue([1]);
      const response1 = await request(app).get('/api/health-db');
      expect(response1.status).toBe(200);

      mockAppDataSource.query.mockResolvedValue([{ result: 'success' }]);
      const response2 = await request(app).get('/api/health-db');
      expect(response2.status).toBe(200);

      mockAppDataSource.query.mockResolvedValue('success');
      const response3 = await request(app).get('/api/health-db');
      expect(response3.status).toBe(200);
    });

    it('should handle concurrent database health checks', async () => {
      mockAppDataSource.query.mockResolvedValue([{ '1': 1 }]);

      const promises = Array.from({ length: 5 }, () =>
        request(app).get('/api/health-db')
      );

      const responses = await Promise.all(promises);

      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body).toEqual({ database: 'OK' });
      });

      expect(mockAppDataSource.query).toHaveBeenCalledTimes(5);
    });

    it('should handle database errors during concurrent requests', async () => {
      const dbError = new Error('Connection timeout');
      mockAppDataSource.query.mockRejectedValue(dbError);

      const promises = Array.from({ length: 3 }, () =>
        request(app).get('/api/health-db')
      );

      const responses = await Promise.all(promises);

      responses.forEach(response => {
        expect(response.status).toBe(500);
        expect(response.body).toEqual({
          database: 'Error',
          error: 'Connection timeout',
        });
      });

      expect(mockAppDataSource.query).toHaveBeenCalledTimes(3);
    });

    it('should return correct Content-Type header for success', async () => {
      mockAppDataSource.query.mockResolvedValue([]);

      const response = await request(app).get('/api/health-db');

      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toMatch(/application\/json/);
    });

    it('should return correct Content-Type header for error', async () => {
      mockAppDataSource.query.mockRejectedValue(new Error('DB Error'));

      const response = await request(app).get('/api/health-db');

      expect(response.status).toBe(500);
      expect(response.headers['content-type']).toMatch(/application\/json/);
    });

    it('should handle console.error calls during database errors', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const dbError = new Error('Database connection failed');
      mockAppDataSource.query.mockRejectedValue(dbError);

      const response = await request(app).get('/api/health-db');

      expect(response.status).toBe(500);
      expect(consoleSpy).toHaveBeenCalledWith(
        'Database connection error:',
        dbError
      );
      consoleSpy.mockRestore();
    });

    it('should handle query parameters', async () => {
      mockAppDataSource.query.mockResolvedValue([]);

      const response = await request(app)
        .get('/api/health-db')
        .query({ check: 'deep' });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ database: 'OK' });
    });

    it('should handle request body', async () => {
      mockAppDataSource.query.mockResolvedValue([]);

      const response = await request(app)
        .get('/api/health-db')
        .send({ test: 'data' });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ database: 'OK' });
    });
  });

  describe('Route isolation', () => {
    it('should not interfere with other routes', async () => {
      // Test that health routes don't affect each other
      mockAppDataSource.query.mockResolvedValueOnce([]);
      const healthResponse = await request(app).get('/api/health');
      expect(healthResponse.status).toBe(200);

      const dbResponse = await request(app).get('/api/health-db');
      expect(dbResponse.status).toBe(200);

      // Reset and test with error
      mockAppDataSource.query.mockRejectedValueOnce(new Error('Test error'));
      const dbResponse2 = await request(app).get('/api/health-db');
      expect(dbResponse2.status).toBe(500);

      const healthResponse2 = await request(app).get('/api/health');
      expect(healthResponse2.status).toBe(200);
    });
  });

  describe('Error handling edge cases', () => {
    it('should handle undefined error messages', async () => {
      const error = new Error('');
      mockAppDataSource.query.mockRejectedValue(error);

      const response = await request(app).get('/api/health-db');

      expect(response.status).toBe(500);
      expect(response.body).toEqual({
        database: 'Error',
        error: '',
      });
    });

    it('should handle errors without message property', async () => {
      mockAppDataSource.query.mockRejectedValue({});

      const response = await request(app).get('/api/health-db');

      expect(response.status).toBe(500);
      expect(response.body).toEqual({
        database: 'Error',
        error: '[object Object]',
      });
    });

    it('should handle promise rejections with complex objects', async () => {
      const complexError = {
        code: 'ECONNREFUSED',
        errno: -111,
        syscall: 'connect',
        hostname: 'localhost',
        toString: () => 'Connection refused',
      };
      mockAppDataSource.query.mockRejectedValue(complexError);

      const response = await request(app).get('/api/health-db');

      expect(response.status).toBe(500);
      expect(response.body).toEqual({
        database: 'Error',
        error: 'Connection refused',
      });
    });
  });

  describe('Performance and load testing', () => {
    it('should handle rapid successive requests', async () => {
      mockAppDataSource.query.mockResolvedValue([]);

      for (let i = 0; i < 20; i++) {
        const response = await request(app).get('/api/health-db');
        expect(response.status).toBe(200);
      }

      expect(mockAppDataSource.query).toHaveBeenCalledTimes(20);
    });

    it('should handle mixed health check patterns', async () => {
      const pattern = [true, false, true, true, false]; // true = success, false = error

      for (let i = 0; i < pattern.length; i++) {
        if (pattern[i]) {
          mockAppDataSource.query.mockResolvedValueOnce([]);
        } else {
          mockAppDataSource.query.mockRejectedValueOnce(
            new Error(`Error ${i}`)
          );
        }
      }

      for (let i = 0; i < pattern.length; i++) {
        const response = await request(app).get('/api/health-db');
        if (pattern[i]) {
          expect(response.status).toBe(200);
          expect(response.body).toEqual({ database: 'OK' });
        } else {
          expect(response.status).toBe(500);
          expect(response.body).toEqual({
            database: 'Error',
            error: `Error ${i}`,
          });
        }
      }
    });
  });
});
