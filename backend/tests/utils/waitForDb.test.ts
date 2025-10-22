import { waitForPostgres, WaitOptions } from '../../src/utils/waitForDb';

// Mock pg Client
const mockClient = {
  connect: jest.fn(),
  query: jest.fn(),
  end: jest.fn(),
};

jest.mock('pg', () => ({
  Client: jest.fn().mockImplementation(() => mockClient),
}));

import { Client } from 'pg';

describe('waitForDb utils', () => {
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    jest.clearAllMocks();
    originalEnv = process.env;

    // Setup environment variables
    process.env = {
      ...originalEnv,
      DB_HOST: 'localhost',
      DB_PORT: '5432',
      DB_USER: 'testuser',
      DB_PASSWORD: 'testpass',
      DB_NAME: 'testdb',
    };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('waitForPostgres', () => {
    it('should connect successfully on first attempt', async () => {
      mockClient.connect.mockResolvedValue(undefined);
      mockClient.query.mockResolvedValue(undefined);
      mockClient.end.mockResolvedValue(undefined);

      const consoleSpy = jest
        .spyOn(console, 'log')
        .mockImplementation(() => {});

      await waitForPostgres({ retries: 3, delayMs: 100 });

      expect(Client).toHaveBeenCalledWith({
        host: 'localhost',
        port: 5432,
        user: 'testuser',
        password: 'testpass',
        database: 'testdb',
      });
      expect(mockClient.connect).toHaveBeenCalledTimes(1);
      expect(mockClient.query).toHaveBeenCalledWith('SELECT 1');
      expect(mockClient.end).toHaveBeenCalledTimes(1);
      expect(consoleSpy).toHaveBeenCalledWith(
        'Postgres is available (attempt',
        1,
        ')'
      );

      consoleSpy.mockRestore();
    });

    it('should retry on connection failure and succeed', async () => {
      mockClient.connect
        .mockRejectedValueOnce(new Error('Connection failed'))
        .mockRejectedValueOnce(new Error('Connection failed'))
        .mockResolvedValueOnce(undefined);
      mockClient.query.mockResolvedValue(undefined);
      mockClient.end.mockResolvedValue(undefined);

      const consoleSpy = jest
        .spyOn(console, 'log')
        .mockImplementation(() => {});

      await waitForPostgres({ retries: 5, delayMs: 10 });

      expect(mockClient.connect).toHaveBeenCalledTimes(3);
      expect(mockClient.query).toHaveBeenCalledTimes(1);
      expect(mockClient.end).toHaveBeenCalledTimes(1);
      expect(consoleSpy).toHaveBeenCalledWith(
        'Postgres is available (attempt',
        3,
        ')'
      );

      consoleSpy.mockRestore();
    });

    it('should fail after all retries exhausted', async () => {
      const connectionError = new Error('Connection refused');
      mockClient.connect.mockRejectedValue(connectionError);

      const consoleSpy = jest
        .spyOn(console, 'log')
        .mockImplementation(() => {});

      await expect(
        waitForPostgres({ retries: 2, delayMs: 10 })
      ).rejects.toThrow('Postgres did not become ready after 2 attempts');

      expect(mockClient.connect).toHaveBeenCalledTimes(2);
      expect(mockClient.query).not.toHaveBeenCalled();
      expect(mockClient.end).not.toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    it('should use default options when not provided', async () => {
      mockClient.connect.mockResolvedValue(undefined);
      mockClient.query.mockResolvedValue(undefined);
      mockClient.end.mockResolvedValue(undefined);

      const consoleSpy = jest
        .spyOn(console, 'log')
        .mockImplementation(() => {});

      await waitForPostgres();

      expect(mockClient.connect).toHaveBeenCalledTimes(1);
      expect(consoleSpy).toHaveBeenCalledWith(
        'Postgres is available (attempt',
        1,
        ')'
      );

      consoleSpy.mockRestore();
    });

    it('should handle query failure', async () => {
      mockClient.connect.mockResolvedValue(undefined);
      mockClient.query.mockRejectedValue(new Error('Query failed'));
      mockClient.end.mockResolvedValue(undefined);

      const consoleSpy = jest
        .spyOn(console, 'log')
        .mockImplementation(() => {});

      await expect(
        waitForPostgres({ retries: 1, delayMs: 10 })
      ).rejects.toThrow('Postgres did not become ready after 1 attempts');

      expect(mockClient.connect).toHaveBeenCalledTimes(1);
      expect(mockClient.query).toHaveBeenCalledTimes(1);
      expect(mockClient.end).not.toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    it('should handle environment variables correctly', async () => {
      // Test with missing DB_PORT (should be undefined)
      delete process.env.DB_PORT;

      mockClient.connect.mockResolvedValue(undefined);
      mockClient.query.mockResolvedValue(undefined);
      mockClient.end.mockResolvedValue(undefined);

      await waitForPostgres({ retries: 1, delayMs: 10 });

      expect(Client).toHaveBeenCalledWith({
        host: 'localhost',
        port: undefined,
        user: 'testuser',
        password: 'testpass',
        database: 'testdb',
      });
    });

    it('should log connection attempts and failures', async () => {
      const connectionError = new Error('Connection timeout');
      mockClient.connect
        .mockRejectedValueOnce(connectionError)
        .mockResolvedValueOnce(undefined);
      mockClient.query.mockResolvedValue(undefined);
      mockClient.end.mockResolvedValue(undefined);

      const consoleSpy = jest
        .spyOn(console, 'log')
        .mockImplementation(() => {});

      await waitForPostgres({ retries: 2, delayMs: 10 });

      expect(consoleSpy).toHaveBeenCalledWith(
        'Postgres not ready (attempt 1/2):',
        'Connection timeout'
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        'Postgres is available (attempt',
        2,
        ')'
      );

      consoleSpy.mockRestore();
    });
  });
});
