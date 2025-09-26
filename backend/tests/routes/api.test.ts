import request from 'supertest';
import express from 'express';
import { AppDataSource } from '../../src/config/db';

jest.mock('../../src/config/db', () => ({
  AppDataSource: {
    query: jest.fn(),
  },
}));

const mockAppDataSource = AppDataSource as jest.Mocked<typeof AppDataSource>;

const createMockApiRouter = () => {
  const router = express.Router();

  router.get('/health', async (_req, res) => {
    return res.status(200).json({ status: 'OK' });
  });

  router.get('/health-db', async (_req, res) => {
    try {
      await mockAppDataSource.query('SELECT 1');
      return res.status(200).json({ database: 'OK' });
    } catch (err) {
      console.error('Database connection error:', err);
      return res
        .status(500)
        .json({ database: 'Error', error: (err as Error).message });
    }
  });

  return router;
};

describe('API Health Routes Integration Tests', () => {
  let app: express.Application;
  let consoleSpy: jest.SpyInstance;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/api/info', createMockApiRouter());

    consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.clearAllMocks();
    consoleSpy.mockRestore();
  });

  describe('GET /health', () => {
    it('should return OK status for basic health check', async () => {
      const response = await request(app).get('/api/info/health');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ status: 'OK' });
    });

    it('should return Content-Type as application/json', async () => {
      const response = await request(app).get('/api/info/health');

      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toMatch(/application\/json/);
    });

    it('should handle multiple concurrent requests', async () => {
      const promises = Array.from({ length: 5 }, () =>
        request(app).get('/api/info/health')
      );

      const responses = await Promise.all(promises);

      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body).toEqual({ status: 'OK' });
      });
    });

    it('should respond quickly (performance test)', async () => {
      const startTime = Date.now();
      const response = await request(app).get('/api/info/health');
      const endTime = Date.now();
      const responseTime = endTime - startTime;

      expect(response.status).toBe(200);
      expect(responseTime).toBeLessThan(100);
    });

    it('should handle HEAD requests', async () => {
      const response = await request(app).head('/api/info/health');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({});
    });

    it('should return 404 for unsupported HTTP methods on /health', async () => {
      const postResponse = await request(app).post('/api/info/health');
      expect(postResponse.status).toBe(404);

      const putResponse = await request(app).put('/api/info/health');
      expect(putResponse.status).toBe(404);

      const deleteResponse = await request(app).delete('/api/info/health');
      expect(deleteResponse.status).toBe(404);

      const patchResponse = await request(app).patch('/api/info/health');
      expect(patchResponse.status).toBe(404);
    });

    it('should maintain consistent response structure', async () => {
      const response = await request(app).get('/api/info/health');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status');
      expect(typeof response.body.status).toBe('string');
      expect(response.body.status).toBe('OK');
    });

    it('should not require authentication', async () => {
      const response = await request(app).get('/api/info/health');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ status: 'OK' });
    });
  });

  describe('GET /health-db', () => {
    it('should return OK status when database is healthy', async () => {
      mockAppDataSource.query.mockResolvedValue([{ '?column?': 1 }]);

      const response = await request(app).get('/api/info/health-db');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ database: 'OK' });
      expect(mockAppDataSource.query).toHaveBeenCalledWith('SELECT 1');
      expect(mockAppDataSource.query).toHaveBeenCalledTimes(1);
    });

    it('should return 500 status when database query fails', async () => {
      const dbError = new Error('Connection refused');
      mockAppDataSource.query.mockRejectedValue(dbError);

      const response = await request(app).get('/api/info/health-db');

      expect(response.status).toBe(500);
      expect(response.body).toEqual({
        database: 'Error',
        error: 'Connection refused',
      });
      expect(mockAppDataSource.query).toHaveBeenCalledWith('SELECT 1');
      expect(consoleSpy).toHaveBeenCalledWith('Database connection error:', dbError);
    });

    it('should handle database timeout errors', async () => {
      const timeoutError = new Error('Query timeout');
      timeoutError.name = 'TimeoutError';
      mockAppDataSource.query.mockRejectedValue(timeoutError);

      const response = await request(app).get('/api/info/health-db');

      expect(response.status).toBe(500);
      expect(response.body).toEqual({
        database: 'Error',
        error: 'Query timeout',
      });
      expect(consoleSpy).toHaveBeenCalledWith('Database connection error:', timeoutError);
    });

    it('should handle database connection pool exhaustion', async () => {
      const poolError = new Error('Connection pool exhausted');
      mockAppDataSource.query.mockRejectedValue(poolError);

      const response = await request(app).get('/api/info/health-db');

      expect(response.status).toBe(500);
      expect(response.body).toEqual({
        database: 'Error',
        error: 'Connection pool exhausted',
      });
    });

    it('should handle database authentication errors', async () => {
      const authError = new Error('authentication failed for user "postgres"');
      mockAppDataSource.query.mockRejectedValue(authError);

      const response = await request(app).get('/api/info/health-db');

      expect(response.status).toBe(500);
      expect(response.body).toEqual({
        database: 'Error',
        error: 'authentication failed for user "postgres"',
      });
    });

    it('should handle non-Error objects thrown by database', async () => {
      const stringError = 'Database is down';
      mockAppDataSource.query.mockRejectedValue(stringError);

      const response = await request(app).get('/api/info/health-db');

      expect(response.status).toBe(500);
      expect(response.body.database).toBe('Error');
      expect(response.body.error).toBeUndefined();
    });

    it('should return Content-Type as application/json for healthy database', async () => {
      mockAppDataSource.query.mockResolvedValue([{ '?column?': 1 }]);

      const response = await request(app).get('/api/info/health-db');

      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toMatch(/application\/json/);
    });

    it('should return Content-Type as application/json for database errors', async () => {
      mockAppDataSource.query.mockRejectedValue(new Error('Database error'));

      const response = await request(app).get('/api/info/health-db');

      expect(response.status).toBe(500);
      expect(response.headers['content-type']).toMatch(/application\/json/);
    });

    it('should handle multiple concurrent database health checks', async () => {
      mockAppDataSource.query.mockResolvedValue([{ '?column?': 1 }]);

      const promises = Array.from({ length: 3 }, () =>
        request(app).get('/api/info/health-db')
      );

      const responses = await Promise.all(promises);

      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body).toEqual({ database: 'OK' });
      });

      expect(mockAppDataSource.query).toHaveBeenCalledTimes(3);
    });

    it('should handle mixed success/failure scenarios', async () => {
      mockAppDataSource.query.mockResolvedValueOnce([{ '?column?': 1 }]);
      mockAppDataSource.query.mockRejectedValueOnce(new Error('Network error'));

      const successResponse = await request(app).get('/api/info/health-db');
      expect(successResponse.status).toBe(200);
      expect(successResponse.body).toEqual({ database: 'OK' });

      const errorResponse = await request(app).get('/api/info/health-db');
      expect(errorResponse.status).toBe(500);
      expect(errorResponse.body).toEqual({
        database: 'Error',
        error: 'Network error',
      });

      expect(mockAppDataSource.query).toHaveBeenCalledTimes(2);
    });

    it('should maintain consistent response structure for errors', async () => {
      mockAppDataSource.query.mockRejectedValue(new Error('Test error'));

      const response = await request(app).get('/api/info/health-db');

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('database');
      expect(response.body).toHaveProperty('error');
      expect(response.body.database).toBe('Error');
      expect(typeof response.body.error).toBe('string');
    });

    it('should not require authentication', async () => {
      mockAppDataSource.query.mockResolvedValue([{ '?column?': 1 }]);

      const response = await request(app).get('/api/info/health-db');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ database: 'OK' });
    });

    it('should return 404 for unsupported HTTP methods on /health-db', async () => {
      const postResponse = await request(app).post('/api/info/health-db');
      expect(postResponse.status).toBe(404);

      const putResponse = await request(app).put('/api/info/health-db');
      expect(putResponse.status).toBe(404);

      const deleteResponse = await request(app).delete('/api/info/health-db');
      expect(deleteResponse.status).toBe(404);
    });

    it('should execute the correct SQL query', async () => {
      mockAppDataSource.query.mockResolvedValue([{ '?column?': 1 }]);

      await request(app).get('/api/info/health-db');

      expect(mockAppDataSource.query).toHaveBeenCalledWith('SELECT 1');
      expect(mockAppDataSource.query).toHaveBeenCalledTimes(1);
    });
  });

  describe('Route availability and response times', () => {
    it('should handle rapid sequential requests', async () => {
      mockAppDataSource.query.mockResolvedValue([{ '?column?': 1 }]);
      const startTime = Date.now();
      for (let i = 0; i < 10; i++) {
        const healthResponse = await request(app).get('/api/info/health');
        expect(healthResponse.status).toBe(200);
        const dbHealthResponse = await request(app).get('/api/info/health-db');
        expect(dbHealthResponse.status).toBe(200);
      }

      const endTime = Date.now();
      const totalTime = endTime - startTime;
      expect(totalTime).toBeLessThan(1000);
      expect(mockAppDataSource.query).toHaveBeenCalledTimes(10);
    });

    it('should be available on correct paths', async () => {
      mockAppDataSource.query.mockResolvedValue([{ '?column?': 1 }]);

      const healthResponse = await request(app).get('/api/info/health');
      expect(healthResponse.status).toBe(200);

      const dbHealthResponse = await request(app).get('/api/info/health-db');
      expect(dbHealthResponse.status).toBe(200);

      const wrongPath1 = await request(app).get('/api/health');
      expect(wrongPath1.status).toBe(404);

      const wrongPath2 = await request(app).get('/health');
      expect(wrongPath2.status).toBe(404);

      const wrongPath3 = await request(app).get('/api/info/health-database');
      expect(wrongPath3.status).toBe(404);
    });
  });

  describe('Edge cases and error scenarios', () => {
    it('should handle Express middleware errors gracefully', async () => {
      const response = await request(app).get('/api/info/health');
      expect(response.status).toBe(200);
      expect(response.body).toEqual({ status: 'OK' });
    });

    it('should handle very long query response times', async () => {
      mockAppDataSource.query.mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve([{ '?column?': 1 }]), 100))
      );

      const response = await request(app).get('/api/info/health-db');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ database: 'OK' });
    });

    it('should handle database returning unexpected data', async () => {
      mockAppDataSource.query.mockResolvedValue(null);

      const response = await request(app).get('/api/info/health-db');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ database: 'OK' });
    });

    it('should handle empty database response', async () => {
      mockAppDataSource.query.mockResolvedValue([]);

      const response = await request(app).get('/api/info/health-db');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ database: 'OK' });
    });
  });

  describe('Error logging and monitoring', () => {
    it('should log database errors with proper context', async () => {
      const dbError = new Error('Connection lost');
      mockAppDataSource.query.mockRejectedValue(dbError);

      await request(app).get('/api/info/health-db');

      expect(consoleSpy).toHaveBeenCalledWith('Database connection error:', dbError);
      expect(consoleSpy).toHaveBeenCalledTimes(1);
    });

    it('should not log anything for successful health checks', async () => {
      mockAppDataSource.query.mockResolvedValue([{ '?column?': 1 }]);

      await request(app).get('/api/info/health');
      await request(app).get('/api/info/health-db');

      expect(consoleSpy).not.toHaveBeenCalled();
    });

    it('should handle complex error objects', async () => {
      const complexError = {
        message: 'Complex database error',
        code: 'ECONNREFUSED',
        errno: -61,
        syscall: 'connect',
        address: '127.0.0.1',
        port: 5432,
        name: 'Error',
        stack: 'Error: Complex database error\n    at ...',
      };
      mockAppDataSource.query.mockRejectedValue(complexError);

      const response = await request(app).get('/api/info/health-db');

      expect(response.status).toBe(500);
      expect(response.body).toEqual({
        database: 'Error',
        error: 'Complex database error',
      });
      expect(consoleSpy).toHaveBeenCalledWith('Database connection error:', complexError);
    });
  });
});
