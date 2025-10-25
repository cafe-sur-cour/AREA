import request from 'supertest';
import express from 'express';
import apiRouter, { languageRouter } from '../../src/routes/api/api';
import { AppDataSource } from '../../src/config/db';
import i18next from 'i18next';

// Mock the entire db module to prevent environment variable requirements
jest.mock('../../src/config/db', () => ({
  AppDataSource: {
    query: jest.fn(),
  },
}));

// Mock i18next
jest.mock('i18next', () => ({
  language: 'en',
  changeLanguage: jest.fn(),
}));

const mockAppDataSource = AppDataSource as jest.Mocked<typeof AppDataSource>;
const mockI18next = i18next as jest.Mocked<typeof i18next>;

describe('API Routes', () => {
  let app: express.Application;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Setup default mocks
    mockAppDataSource.query.mockResolvedValue([]);
    mockI18next.changeLanguage.mockResolvedValue();
    mockI18next.language = 'en';

    // Create test app
    app = express();
    app.use(express.json());
    app.use('/api', apiRouter);
    app.use('/api/language', languageRouter);
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

describe('Language Routes', () => {
  let app: express.Application;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Setup default mocks
    mockI18next.changeLanguage.mockResolvedValue();
    mockI18next.language = 'en';

    // Create test app
    app = express();
    app.use(express.json());
    app.use('/api/language', languageRouter);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/language', () => {
    it('should return current language when set to English', async () => {
      mockI18next.language = 'en';

      const response = await request(app).get('/api/language');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ language: 'en' });
      expect(response.headers['content-type']).toMatch(/application\/json/);
    });

    it('should return current language when set to French', async () => {
      mockI18next.language = 'fr';

      const response = await request(app).get('/api/language');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ language: 'fr' });
    });

    it('should return default language when i18next.language is undefined', async () => {
      mockI18next.language = undefined;

      const response = await request(app).get('/api/language');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ language: 'en' });
    });

    it('should handle multiple concurrent requests', async () => {
      mockI18next.language = 'fr';

      const promises = Array.from({ length: 5 }, () =>
        request(app).get('/api/language')
      );

      const responses = await Promise.all(promises);

      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body).toEqual({ language: 'fr' });
      });
    });

    it('should work with different HTTP methods', async () => {
      // GET should work
      const getResponse = await request(app).get('/api/language');
      expect(getResponse.status).toBe(200);

      // POST should work (defined route)
      const postResponse = await request(app)
        .post('/api/language')
        .send({ language: 'en' });
      expect(postResponse.status).toBe(200);

      // Other methods should not be handled by this route
      const putResponse = await request(app).put('/api/language');
      expect(putResponse.status).toBe(404);

      const deleteResponse = await request(app).delete('/api/language');
      expect(deleteResponse.status).toBe(404);
    });

    it('should return consistent response structure', async () => {
      const response = await request(app).get('/api/language');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('language');
      expect(typeof response.body.language).toBe('string');
      expect(['en', 'fr']).toContain(response.body.language);
    });

    it('should handle query parameters gracefully', async () => {
      const response = await request(app)
        .get('/api/language')
        .query({ param: 'value' });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('language');
    });

    it('should handle request body gracefully', async () => {
      const response = await request(app)
        .get('/api/language')
        .send({ some: 'data' });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('language');
    });
  });

  describe('POST /api/language', () => {
    it('should successfully change language to English', async () => {
      const response = await request(app)
        .post('/api/language')
        .send({ language: 'en' });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ language: 'en' });
      expect(mockI18next.changeLanguage).toHaveBeenCalledWith('en');
      expect(mockI18next.changeLanguage).toHaveBeenCalledTimes(1);
    });

    it('should successfully change language to French', async () => {
      const response = await request(app)
        .post('/api/language')
        .send({ language: 'fr' });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ language: 'fr' });
      expect(mockI18next.changeLanguage).toHaveBeenCalledWith('fr');
      expect(mockI18next.changeLanguage).toHaveBeenCalledTimes(1);
    });

    it('should return 400 for invalid language', async () => {
      const response = await request(app)
        .post('/api/language')
        .send({ language: 'invalid' });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        error: 'Invalid language. Must be "en" or "fr"',
      });
      expect(mockI18next.changeLanguage).not.toHaveBeenCalled();
    });

    it('should return 400 when language is missing', async () => {
      const response = await request(app).post('/api/language').send({});

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        error: 'Invalid language. Must be "en" or "fr"',
      });
      expect(mockI18next.changeLanguage).not.toHaveBeenCalled();
    });

    it('should return 400 when language is null', async () => {
      const response = await request(app)
        .post('/api/language')
        .send({ language: null });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        error: 'Invalid language. Must be "en" or "fr"',
      });
      expect(mockI18next.changeLanguage).not.toHaveBeenCalled();
    });

    it('should return 400 when language is not a string', async () => {
      const response = await request(app)
        .post('/api/language')
        .send({ language: 123 });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        error: 'Invalid language. Must be "en" or "fr"',
      });
      expect(mockI18next.changeLanguage).not.toHaveBeenCalled();
    });

    it('should handle i18next changeLanguage errors', async () => {
      const testError = new Error('i18next changeLanguage failed');
      mockI18next.changeLanguage.mockRejectedValue(testError);

      const response = await request(app)
        .post('/api/language')
        .send({ language: 'fr' });

      expect(response.status).toBe(500);
      expect(response.body).toEqual({ error: 'Internal Server Error' });
      expect(mockI18next.changeLanguage).toHaveBeenCalledWith('fr');
      expect(mockI18next.changeLanguage).toHaveBeenCalledTimes(1);
    });

    it('should handle concurrent language change requests', async () => {
      const promises = Array.from({ length: 3 }, () =>
        request(app).post('/api/language').send({ language: 'fr' })
      );

      const responses = await Promise.all(promises);

      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body).toEqual({ language: 'fr' });
      });

      expect(mockI18next.changeLanguage).toHaveBeenCalledTimes(3);
      expect(mockI18next.changeLanguage).toHaveBeenCalledWith('fr');
    });

    it('should return correct Content-Type header', async () => {
      const response = await request(app)
        .post('/api/language')
        .send({ language: 'en' });

      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toMatch(/application\/json/);
    });

    it('should handle query parameters', async () => {
      const response = await request(app)
        .post('/api/language')
        .query({ param: 'value' })
        .send({ language: 'en' });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ language: 'en' });
    });

    it('should handle malformed JSON', async () => {
      const response = await request(app)
        .post('/api/language')
        .set('Content-Type', 'application/json')
        .send('invalid json');

      expect(response.status).toBe(400);
    });
  });

  describe('Route isolation', () => {
    it('should not interfere with other routes', async () => {
      // Test GET and POST independently
      const getResponse = await request(app).get('/api/language');
      expect(getResponse.status).toBe(200);

      const postResponse = await request(app)
        .post('/api/language')
        .send({ language: 'fr' });
      expect(postResponse.status).toBe(200);

      // Test with error
      const errorResponse = await request(app)
        .post('/api/language')
        .send({ language: 'invalid' });
      expect(errorResponse.status).toBe(400);

      const getResponse2 = await request(app).get('/api/language');
      expect(getResponse2.status).toBe(200);
    });
  });

  describe('Error handling edge cases', () => {
    it('should handle undefined error messages from i18next', async () => {
      const error = new Error('');
      mockI18next.changeLanguage.mockRejectedValue(error);

      const response = await request(app)
        .post('/api/language')
        .send({ language: 'fr' });

      expect(response.status).toBe(500);
      expect(response.body).toEqual({ error: 'Internal Server Error' });
    });

    it('should handle non-Error objects thrown by i18next', async () => {
      mockI18next.changeLanguage.mockRejectedValue('String error');

      const response = await request(app)
        .post('/api/language')
        .send({ language: 'fr' });

      expect(response.status).toBe(500);
      expect(response.body).toEqual({ error: 'Internal Server Error' });
    });

    it('should handle complex error objects from i18next', async () => {
      const complexError = {
        code: 'I18N_ERROR',
        message: 'Language change failed',
        details: { lang: 'fr' },
      };
      mockI18next.changeLanguage.mockRejectedValue(complexError);

      const response = await request(app)
        .post('/api/language')
        .send({ language: 'fr' });

      expect(response.status).toBe(500);
      expect(response.body).toEqual({ error: 'Internal Server Error' });
    });
  });

  describe('Performance and load testing', () => {
    it('should handle rapid successive GET requests', async () => {
      for (let i = 0; i < 10; i++) {
        const response = await request(app).get('/api/language');
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('language');
      }
    });

    it('should handle rapid successive POST requests', async () => {
      for (let i = 0; i < 10; i++) {
        const response = await request(app)
          .post('/api/language')
          .send({ language: i % 2 === 0 ? 'en' : 'fr' });
        expect(response.status).toBe(200);
      }

      expect(mockI18next.changeLanguage).toHaveBeenCalledTimes(10);
    });

    it('should handle mixed GET/POST patterns', async () => {
      const pattern = ['GET', 'POST', 'GET', 'POST', 'GET'];

      for (let i = 0; i < pattern.length; i++) {
        if (pattern[i] === 'GET') {
          const response = await request(app).get('/api/language');
          expect(response.status).toBe(200);
        } else {
          const response = await request(app)
            .post('/api/language')
            .send({ language: 'fr' });
          expect(response.status).toBe(200);
        }
      }

      expect(mockI18next.changeLanguage).toHaveBeenCalledTimes(2);
    });
  });
});
