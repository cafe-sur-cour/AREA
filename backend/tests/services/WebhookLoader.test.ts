import { jest } from '@jest/globals';

// Mock fs module
jest.mock('fs', () => ({
  existsSync: jest.fn(),
  readdirSync: jest.fn(),
}));

// Mock path module
jest.mock('path', () => ({
  join: jest.fn(),
  dirname: jest.fn(),
}));

import * as fs from 'fs';
import * as path from 'path';
import { WebhookLoader } from '../../src/webhooks/WebhookLoader';
import type { WebhookHandler, WebhookConfig } from '../../src/types/webhook';

// Mock process.env
const originalEnv = process.env;
let mockEnv: Record<string, string | undefined>;

describe('WebhookLoader', () => {
  let webhookLoader: WebhookLoader;
  let mockFs: jest.Mocked<typeof fs>;
  let mockPath: jest.Mocked<typeof path>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockFs = fs as jest.Mocked<typeof fs>;
    mockPath = path as jest.Mocked<typeof path>;

    // Reset process.env
    mockEnv = { ...originalEnv };
    process.env = mockEnv;

    // Default path mocks
    mockPath.join.mockImplementation((...args) => args.join('/'));
    mockPath.dirname.mockReturnValue('/mock/dir');

    webhookLoader = new WebhookLoader('/mock/services/path');
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('constructor', () => {
    it('should use default path when no path provided', () => {
      const loader = new WebhookLoader();
      expect(loader).toBeInstanceOf(WebhookLoader);
    });

    it('should use provided path', () => {
      const customPath = '/custom/path';
      const loader = new WebhookLoader(customPath);
      expect(loader).toBeInstanceOf(WebhookLoader);
    });
  });

  describe('loadAllWebhooks', () => {
    it('should warn and return when services directory does not exist', async () => {
      const consoleWarnSpy = jest
        .spyOn(console, 'warn')
        .mockImplementation(() => {});
      mockFs.existsSync.mockReturnValue(false);

      await webhookLoader.loadAllWebhooks();

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        'Services directory not found: /mock/services/path'
      );
      expect(mockFs.readdirSync).not.toHaveBeenCalled();

      consoleWarnSpy.mockRestore();
    });

    it('should load webhooks for directories containing webhook folders', async () => {
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readdirSync.mockReturnValue([
        { name: 'service1', isDirectory: () => true },
        { name: 'service2', isDirectory: () => true },
        { name: 'file.txt', isDirectory: () => false },
      ] as any);

      // Mock loadWebhook to avoid actual loading
      const loadWebhookSpy = jest
        .spyOn(webhookLoader as any, 'loadWebhook')
        .mockResolvedValue(undefined);

      await webhookLoader.loadAllWebhooks();

      expect(mockFs.existsSync).toHaveBeenCalledWith('/mock/services/path');
      expect(mockFs.readdirSync).toHaveBeenCalledWith('/mock/services/path', {
        withFileTypes: true,
      });
      expect(mockFs.existsSync).toHaveBeenCalledWith(
        '/mock/services/path/service1/webhook'
      );
      expect(mockFs.existsSync).toHaveBeenCalledWith(
        '/mock/services/path/service2/webhook'
      );
      expect(loadWebhookSpy).toHaveBeenCalledWith('service1');
      expect(loadWebhookSpy).toHaveBeenCalledWith('service2');

      loadWebhookSpy.mockRestore();
    });

    it('should skip directories without webhook folders', async () => {
      mockFs.existsSync
        .mockReturnValueOnce(true) // services path exists
        .mockReturnValueOnce(true) // service1 has webhook
        .mockReturnValueOnce(false); // service2 doesn't have webhook

      mockFs.readdirSync.mockReturnValue([
        { name: 'service1', isDirectory: () => true },
        { name: 'service2', isDirectory: () => true },
      ] as any);

      const loadWebhookSpy = jest
        .spyOn(webhookLoader as any, 'loadWebhook')
        .mockResolvedValue(undefined);

      await webhookLoader.loadAllWebhooks();

      expect(loadWebhookSpy).toHaveBeenCalledWith('service1');
      expect(loadWebhookSpy).toHaveBeenCalledTimes(1);

      loadWebhookSpy.mockRestore();
    });
  });

  describe('loadWebhook', () => {
    const serviceName = 'testservice';

    it('should throw error when webhook directory does not exist', async () => {
      mockFs.existsSync.mockReturnValue(false);

      await expect(webhookLoader.loadWebhook(serviceName)).rejects.toThrow(
        'Webhook directory not found: /mock/services/path/testservice/webhook'
      );
    });

    it('should throw error when neither index.ts nor index.js exists', async () => {
      mockFs.existsSync
        .mockReturnValueOnce(true) // webhook dir exists
        .mockReturnValueOnce(false) // index.ts doesn't exist
        .mockReturnValueOnce(false); // index.js doesn't exist

      await expect(webhookLoader.loadWebhook(serviceName)).rejects.toThrow(
        'Webhook index file not found in: /mock/services/path/testservice/webhook'
      );
    });
  });

  describe('reloadWebhook', () => {
    it('should unload and then load webhook', async () => {
      const serviceName = 'testservice';

      const unloadSpy = jest
        .spyOn(webhookLoader, 'unloadWebhook')
        .mockResolvedValue(undefined);
      const loadSpy = jest
        .spyOn(webhookLoader, 'loadWebhook')
        .mockResolvedValue(undefined);

      await webhookLoader.reloadWebhook(serviceName);

      expect(unloadSpy).toHaveBeenCalledWith(serviceName);
      expect(loadSpy).toHaveBeenCalledWith(serviceName);
    });
  });

  describe('getHandler', () => {
    it('should return handler when exists', () => {
      const serviceName = 'testservice';
      const mockHandler = { service: serviceName, handle: jest.fn() };

      // Manually set handler for testing
      (webhookLoader as any).handlers.set(serviceName, mockHandler);

      const handler = webhookLoader.getHandler(serviceName);
      expect(handler).toBe(mockHandler);
    });

    it('should return undefined when handler does not exist', () => {
      const handler = webhookLoader.getHandler('nonexistent');
      expect(handler).toBeUndefined();
    });
  });

  describe('getAllHandlers', () => {
    it('should return all handlers', () => {
      const handler1 = { service: 'service1', handle: jest.fn() };
      const handler2 = { service: 'service2', handle: jest.fn() };

      (webhookLoader as any).handlers.set('service1', handler1);
      (webhookLoader as any).handlers.set('service2', handler2);

      const handlers = webhookLoader.getAllHandlers();
      expect(handlers).toEqual([handler1, handler2]);
    });

    it('should return empty array when no handlers', () => {
      const handlers = webhookLoader.getAllHandlers();
      expect(handlers).toEqual([]);
    });
  });

  describe('getAvailableWebhooks', () => {
    it('should return empty array when services directory does not exist', () => {
      mockFs.existsSync.mockReturnValue(false);

      const result = webhookLoader.getAvailableWebhooks();
      expect(result).toEqual([]);
    });

    it('should return services with webhook directories', () => {
      mockFs.existsSync
        .mockReturnValueOnce(true) // services path exists
        .mockReturnValueOnce(true) // service1 has webhook
        .mockReturnValueOnce(false) // service2 doesn't have webhook
        .mockReturnValueOnce(true); // service3 has webhook

      mockFs.readdirSync.mockReturnValue([
        { name: 'service1', isDirectory: () => true },
        { name: 'service2', isDirectory: () => true },
        { name: 'service3', isDirectory: () => true },
        { name: 'file.txt', isDirectory: () => false },
      ] as any);

      const result = webhookLoader.getAvailableWebhooks();

      expect(result).toEqual(['service1', 'service3']);
      expect(mockFs.existsSync).toHaveBeenCalledWith('/mock/services/path');
      expect(mockFs.readdirSync).toHaveBeenCalledWith('/mock/services/path', {
        withFileTypes: true,
      });
    });

    it('should filter out non-directories', () => {
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readdirSync.mockReturnValue([
        { name: 'service1', isDirectory: () => true },
        { name: 'file.txt', isDirectory: () => false },
      ] as any);

      const result = webhookLoader.getAvailableWebhooks();

      expect(result).toEqual(['service1']);
    });
  });

  describe('loadWebhookConfig', () => {
    it('should load config with environment variables', () => {
      const serviceName = 'testservice';

      // Set up environment variables
      mockEnv.TESTSERVICE_API_KEY = 'test-key';
      mockEnv.TESTSERVICE_SECRET = 'test-secret';
      mockEnv.OTHER_VAR = 'other-value';

      const config = (webhookLoader as any).loadWebhookConfig(serviceName);

      expect(config).toEqual({
        credentials: {
          api_key: 'test-key',
          secret: 'test-secret',
        },
        settings: {},
        env: mockEnv,
      });
    });

    it('should handle empty environment', () => {
      const serviceName = 'testservice';

      const config = (webhookLoader as any).loadWebhookConfig(serviceName);

      expect(config).toEqual({
        credentials: {},
        settings: {},
        env: mockEnv,
      });
    });

    it('should ignore non-prefixed environment variables', () => {
      const serviceName = 'testservice';

      mockEnv.API_KEY = 'global-key';
      mockEnv.TESTSERVICE_API_KEY = 'service-key';

      const config = (webhookLoader as any).loadWebhookConfig(serviceName);

      expect(config.credentials).toEqual({
        api_key: 'service-key',
      });
    });
  });
});
