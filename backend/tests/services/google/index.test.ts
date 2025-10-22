// Mock all dependencies before importing the service
jest.mock('../../../src/services/services/google/oauth', () => ({
  googleOAuth: {
    getUserToken: jest.fn(),
  },
}));

jest.mock('../../../src/services/services/google/passport', () => ({
  initializeGooglePassport: jest.fn(),
}));

jest.mock('../../../src/services/services/google/actions', () => ({
  googleActions: [],
}));

jest.mock('../../../src/services/services/google/reactions', () => ({
  googleReactions: [
    {
      type: 'google.send_email',
      name: 'Send Email',
      description: 'Send an email via Gmail',
    },
    {
      type: 'google.create_calendar_event',
      name: 'Create Calendar Event',
      description: 'Create a calendar event',
    },
    {
      type: 'google.create_document',
      name: 'Create Document',
      description: 'Create a Google Docs document',
    },
  ],
}));

jest.mock('../../../src/services/services/google/executor', () => ({
  googleReactionExecutor: {
    execute: jest.fn(),
  },
}));

import { googleOAuth } from '../../../src/services/services/google/oauth';
import { initializeGooglePassport } from '../../../src/services/services/google/passport';
import { googleActions } from '../../../src/services/services/google/actions';
import { googleReactions } from '../../../src/services/services/google/reactions';
import { googleReactionExecutor } from '../../../src/services/services/google/executor';

describe('Google Service', () => {
  let googleService: any;

  beforeEach(async () => {
    jest.clearAllMocks();

    // Import the service after mocks are set up
    const module = await import('../../../src/services/services/google/index');
    googleService = module.default;
  });

  describe('Service Definition', () => {
    it('should have correct service properties', () => {
      expect(googleService.id).toBe('google');
      expect(googleService.name).toBe('Google');
      expect(googleService.description).toContain(
        'Google services integration'
      );
      expect(googleService.version).toBe('1.0.0');
      expect(googleService.icon).toContain('svg');
      expect(googleService.actions).toBe(googleActions);
      expect(googleService.reactions).toBe(googleReactions);
      expect(googleService.authOnly).toBe(false);
    });

    it('should have OAuth configuration', () => {
      expect(googleService.oauth).toEqual({
        enabled: true,
        supportsLogin: true,
      });
    });

    it('should have reactions defined', () => {
      expect(googleService.reactions).toHaveLength(3);
      expect(googleService.reactions[0].type).toBe('google.send_email');
      expect(googleService.reactions[1].type).toBe(
        'google.create_calendar_event'
      );
      expect(googleService.reactions[2].type).toBe('google.create_document');
    });
  });

  describe('getCredentials', () => {
    it('should return access token when user token exists', async () => {
      const mockToken = {
        token_value: 'test-access-token',
        refresh_token: 'test-refresh-token',
        expires_at: new Date(Date.now() + 3600000),
      };

      (googleOAuth.getUserToken as jest.Mock).mockResolvedValue(mockToken);

      const credentials = await googleService.getCredentials(1);

      expect(googleOAuth.getUserToken).toHaveBeenCalledWith(1);
      expect(credentials).toEqual({
        access_token: 'test-access-token',
      });
    });

    it('should return empty object when no user token exists', async () => {
      (googleOAuth.getUserToken as jest.Mock).mockResolvedValue(null);

      const credentials = await googleService.getCredentials(1);

      expect(googleOAuth.getUserToken).toHaveBeenCalledWith(1);
      expect(credentials).toEqual({});
    });

    it('should handle OAuth errors', async () => {
      (googleOAuth.getUserToken as jest.Mock).mockRejectedValue(
        new Error('Database error')
      );

      await expect(googleService.getCredentials(1)).rejects.toThrow(
        'Database error'
      );
    });
  });

  describe('initialize', () => {
    let consoleSpy: jest.SpyInstance;

    beforeEach(() => {
      consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    });

    afterEach(() => {
      consoleSpy.mockRestore();
    });

    it('should initialize Google passport and log messages', async () => {
      const { initialize } = await import(
        '../../../src/services/services/google/index'
      );

      await initialize();

      expect(consoleSpy).toHaveBeenCalledWith('Initializing Google service...');
      expect(initializeGooglePassport).toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalledWith('Google service initialized');
    });

    it('should handle initialization errors', async () => {
      (initializeGooglePassport as jest.Mock).mockImplementation(() => {
        throw new Error('Passport initialization failed');
      });

      const { initialize } = await import(
        '../../../src/services/services/google/index'
      );

      await expect(initialize()).rejects.toThrow(
        'Passport initialization failed'
      );
    });
  });

  describe('cleanup', () => {
    let consoleSpy: jest.SpyInstance;

    beforeEach(() => {
      consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    });

    afterEach(() => {
      consoleSpy.mockRestore();
    });

    it('should log cleanup messages', async () => {
      const { cleanup } = await import(
        '../../../src/services/services/google/index'
      );

      await cleanup();

      expect(consoleSpy).toHaveBeenCalledWith('Cleaning up Google service...');
      expect(consoleSpy).toHaveBeenCalledWith('Google service cleaned up');
    });
  });

  describe('executor export', () => {
    it('should export the Google reaction executor', async () => {
      const { executor } = await import(
        '../../../src/services/services/google/index'
      );

      expect(executor).toBe(googleReactionExecutor);
    });
  });
});
