import { jest } from '@jest/globals';

// Mock the passport module
jest.mock('../../../src/services/services/facebook/passport', () => ({
  initializeFacebookPassport: jest.fn(),
}));

describe('Facebook Service', () => {
  describe('Service Definition', () => {
    it('should have correct service properties', () => {
      const {
        default: facebookService,
      } = require('../../../src/services/services/facebook/index');

      expect(facebookService).toEqual({
        id: 'facebook',
        name: 'Facebook',
        description:
          'Facebook OAuth service for authentication and platform integration',
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
  });

  describe('initialize', () => {
    it('should initialize the Facebook service', async () => {
      const {
        initialize,
      } = require('../../../src/services/services/facebook/index');
      const {
        initializeFacebookPassport,
      } = require('../../../src/services/services/facebook/passport');

      // Mock console.log
      const consoleSpy = jest
        .spyOn(console, 'log')
        .mockImplementation(() => {});

      await initialize();

      expect(consoleSpy).toHaveBeenCalledWith('Initializing Meta service...');
      expect(initializeFacebookPassport).toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalledWith('Meta service initialized');

      consoleSpy.mockRestore();
    });
  });

  describe('cleanup', () => {
    it('should cleanup the Facebook service', async () => {
      const {
        cleanup,
      } = require('../../../src/services/services/facebook/index');

      // Mock console.log
      const consoleSpy = jest
        .spyOn(console, 'log')
        .mockImplementation(() => {});

      await cleanup();

      expect(consoleSpy).toHaveBeenCalledWith('Cleaning up Meta service...');
      expect(consoleSpy).toHaveBeenCalledWith('Facebook service cleaned up');

      consoleSpy.mockRestore();
    });
  });
});
