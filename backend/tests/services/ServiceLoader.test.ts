import { ServiceLoader } from '../../src/services/ServiceLoader';
import { serviceRegistry } from '../../src/services/ServiceRegistry';
import { reactionExecutorRegistry } from '../../src/services/ReactionExecutorRegistry';
import * as fs from 'fs';
import * as path from 'path';

jest.mock('fs');
jest.mock('../../src/services/ServiceRegistry');
jest.mock('../../src/services/ReactionExecutorRegistry');

describe('ServiceLoader', () => {
  let serviceLoader: ServiceLoader;
  const mockServicesPath = '/mock/services';

  beforeEach(() => {
    jest.clearAllMocks();
    serviceLoader = new ServiceLoader(mockServicesPath);
  });

  describe('constructor', () => {
    it('should create instance with default path', () => {
      const loader = new ServiceLoader();
      expect(loader).toBeInstanceOf(ServiceLoader);
    });

    it('should create instance with custom path', () => {
      const loader = new ServiceLoader('/custom/path');
      expect(loader).toBeInstanceOf(ServiceLoader);
    });
  });

  describe('loadAllServices', () => {
    it('should load all service directories', async () => {
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.readdirSync as jest.Mock).mockReturnValue([
        { name: 'github', isDirectory: () => true },
        { name: 'slack', isDirectory: () => true },
        { name: 'file.txt', isDirectory: () => false },
      ]);

      const loadServiceSpy = jest
        .spyOn(serviceLoader, 'loadService')
        .mockResolvedValue(undefined);

      await serviceLoader.loadAllServices();

      expect(loadServiceSpy).toHaveBeenCalledTimes(2);
      expect(loadServiceSpy).toHaveBeenCalledWith('github');
      expect(loadServiceSpy).toHaveBeenCalledWith('slack');
    });

    it('should handle non-existent services directory', async () => {
      (fs.existsSync as jest.Mock).mockReturnValue(false);
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();

      await serviceLoader.loadAllServices();

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Services directory not found')
      );

      consoleWarnSpy.mockRestore();
    });
  });

  describe('loadService', () => {
    it('should throw error when service directory not found', async () => {
      (fs.existsSync as jest.Mock).mockReturnValue(false);

      await expect(serviceLoader.loadService('nonExistent')).rejects.toThrow(
        'Service directory not found'
      );
    });

    it('should throw error when index file not found', async () => {
      (fs.existsSync as jest.Mock).mockImplementation((filePath: string) => {
        if (filePath === path.join(mockServicesPath, 'testService'))
          return true;
        return false;
      });

      await expect(serviceLoader.loadService('testService')).rejects.toThrow(
        'Service index file not found'
      );
    });
  });

  describe('unloadService', () => {
    it('should unregister service', async () => {
      await serviceLoader.unloadService('testService');

      expect(serviceRegistry.unregister).toHaveBeenCalledWith('testService');
      expect(reactionExecutorRegistry.unregister).toHaveBeenCalledWith(
        'testService'
      );
    });
  });

  describe('reloadService', () => {
    it('should unload and reload service', async () => {
      const unloadSpy = jest
        .spyOn(serviceLoader, 'unloadService')
        .mockResolvedValue(undefined);
      const loadSpy = jest
        .spyOn(serviceLoader, 'loadService')
        .mockResolvedValue(undefined);

      await serviceLoader.reloadService('testService');

      expect(unloadSpy).toHaveBeenCalledWith('testService');
      expect(loadSpy).toHaveBeenCalledWith('testService');
    });
  });

  describe('getAvailableServices', () => {
    it('should return list of available services', () => {
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.readdirSync as jest.Mock).mockReturnValue([
        { name: 'github', isDirectory: () => true },
        { name: 'slack', isDirectory: () => true },
        { name: 'file.txt', isDirectory: () => false },
      ]);

      const services = serviceLoader.getAvailableServices();

      expect(services).toEqual(['github', 'slack']);
    });

    it('should return empty array when services directory does not exist', () => {
      (fs.existsSync as jest.Mock).mockReturnValue(false);

      const services = serviceLoader.getAvailableServices();

      expect(services).toEqual([]);
    });
  });

  describe('loadServiceConfig', () => {
    it('should load config from environment variables', () => {
      const originalEnv = process.env;
      process.env = {
        ...originalEnv,
        TESTSERVICE_CLIENT_ID: 'test-client-id',
        TESTSERVICE_CLIENT_SECRET: 'test-secret',
        OTHER_VAR: 'should-not-be-included',
      };

      const config = serviceLoader['loadServiceConfig']('testservice');

      expect(config.credentials).toEqual({
        client_id: 'test-client-id',
        client_secret: 'test-secret',
      });
      expect(config.env).toBe(process.env);

      process.env = originalEnv;
    });

    it('should handle service with no environment variables', () => {
      const originalEnv = process.env;
      process.env = { OTHER_VAR: 'value' };

      const config = serviceLoader['loadServiceConfig']('testservice');

      expect(config.credentials).toEqual({});

      process.env = originalEnv;
    });
  });
});
