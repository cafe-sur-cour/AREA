import { jest } from '@jest/globals';

// Mock the passport module
jest.mock('../../../src/services/services/microsoft/passport', () => ({
  initializeMicrosoftPassport: jest.fn(),
}));

describe('Microsoft Service', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('Service Definition', () => {
    it('should export a valid service object', async () => {
      const { default: microsoftService } = await import(
        '../../../src/services/services/microsoft/index'
      );

      expect(microsoftService).toEqual({
        id: 'microsoft',
        name: 'Microsoft 365',
        description:
          'Microsoft 365 OAuth service for authentication and Microsoft Graph API integration',
        version: '1.0.0',
        icon: expect.stringContaining('<svg'),
        actions: [],
        reactions: [],
        oauth: {
          enabled: true,
          supportsLogin: true,
        },
        authOnly: true,
      });
    });

    it('should have correct service properties', async () => {
      const { default: microsoftService } = await import(
        '../../../src/services/services/microsoft/index'
      );

      expect(microsoftService.id).toBe('microsoft');
      expect(microsoftService.name).toBe('Microsoft 365');
      expect(microsoftService.version).toBe('1.0.0');
      expect(microsoftService.authOnly).toBe(true);
      expect(microsoftService.actions).toEqual([]);
      expect(microsoftService.reactions).toEqual([]);
      expect(microsoftService.oauth?.enabled).toBe(true);
      expect(microsoftService.oauth?.supportsLogin).toBe(true);
    });

    it('should have a valid SVG icon', async () => {
      const { default: microsoftService } = await import(
        '../../../src/services/services/microsoft/index'
      );

      expect(microsoftService.icon).toContain('<svg');
      expect(microsoftService.icon).toContain('viewBox="0 0 448 512"');
      expect(microsoftService.icon).toContain('fill="#00A4EF"');
    });
  });

  describe('initialize', () => {
    it('should initialize the Microsoft service successfully', async () => {
      const { initialize } = await import(
        '../../../src/services/services/microsoft/index'
      );
      const { initializeMicrosoftPassport } = await import(
        '../../../src/services/services/microsoft/passport'
      );

      await initialize();

      expect(initializeMicrosoftPassport).toHaveBeenCalledTimes(1);
    });

    it('should handle initialization errors gracefully', async () => {
      const { initialize } = await import(
        '../../../src/services/services/microsoft/index'
      );
      const { initializeMicrosoftPassport } = await import(
        '../../../src/services/services/microsoft/passport'
      );

      const mockError = new Error('Passport initialization failed');
      (initializeMicrosoftPassport as jest.Mock).mockImplementation(() => {
        throw mockError;
      });

      // Should throw the error (not catch it)
      await expect(initialize()).rejects.toThrow(
        'Passport initialization failed'
      );
      expect(initializeMicrosoftPassport).toHaveBeenCalledTimes(1);
    });
  });

  describe('cleanup', () => {
    it('should cleanup the Microsoft service successfully', async () => {
      const { cleanup } = await import(
        '../../../src/services/services/microsoft/index'
      );

      await expect(cleanup()).resolves.not.toThrow();
    });
  });
});
