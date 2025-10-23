import i18next from 'i18next';
import { initI18n } from '../../src/config/i18n';

// Mock i18next and its plugins
jest.mock('i18next', () => ({
  use: jest.fn().mockReturnThis(),
  init: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('i18next-fs-backend', () => jest.fn());
jest.mock('i18next-http-middleware', () => ({
  LanguageDetector: jest.fn(),
}));

// Mock process.cwd for testing
const mockProcessCwd = jest.fn();

Object.defineProperty(process, 'cwd', {
  value: mockProcessCwd,
  writable: true,
});

describe('i18n Configuration', () => {
  let mockI18next: jest.Mocked<typeof i18next>;

  beforeEach(() => {
    jest.clearAllMocks();

    mockI18next = i18next as jest.Mocked<typeof i18next>;

    // Setup default mocks
    mockProcessCwd.mockReturnValue('/mock/project/root');
    mockI18next.init.mockResolvedValue({} as any);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('initI18n', () => {
    it('should initialize i18next with correct configuration', async () => {
      mockProcessCwd.mockReturnValue('/mock/project/root');

      await initI18n();

      expect(mockI18next.use).toHaveBeenCalledTimes(2); // Backend and LanguageDetector
      expect(mockI18next.init).toHaveBeenCalledWith({
        fallbackLng: 'en',
        lng: 'en',
        supportedLngs: ['en', 'fr'],
        preload: ['en', 'fr'],
        backend: {
          loadPath: '/mock/project/root/locales/{{lng}}.json',
        },
        detection: {
          order: ['header', 'querystring', 'cookie'],
          lookupHeader: 'accept-language',
          lookupQuerystring: 'lang',
          lookupCookie: 'i18next',
        },
        interpolation: {
          escapeValue: false,
        },
      });
    });

    it('should construct correct locales path', async () => {
      mockProcessCwd.mockReturnValue('/mock/project/root');

      await initI18n();

      expect(mockProcessCwd).toHaveBeenCalled();
      expect(mockI18next.init).toHaveBeenCalledWith(
        expect.objectContaining({
          backend: {
            loadPath: '/mock/project/root/locales/{{lng}}.json',
          },
        })
      );
    });

    it('should handle initialization errors gracefully', async () => {
      const testError = new Error('i18n initialization failed');
      mockI18next.init.mockRejectedValue(testError);

      await expect(initI18n()).rejects.toThrow('i18n initialization failed');

      expect(mockI18next.init).toHaveBeenCalled();
    });

    it('should configure language detection options correctly', async () => {
      await initI18n();

      const initConfig = mockI18next.init.mock.calls[0][0];

      expect(initConfig.detection).toEqual({
        order: ['header', 'querystring', 'cookie'],
        lookupHeader: 'accept-language',
        lookupQuerystring: 'lang',
        lookupCookie: 'i18next',
      });
    });

    it('should configure backend options correctly', async () => {
      mockProcessCwd.mockReturnValue('/project/root');

      await initI18n();

      const initConfig = mockI18next.init.mock.calls[0][0];

      expect(initConfig.backend).toEqual({
        loadPath: '/project/root/locales/{{lng}}.json',
      });
    });

    it('should configure interpolation options correctly', async () => {
      await initI18n();

      const initConfig = mockI18next.init.mock.calls[0][0];

      expect(initConfig.interpolation).toEqual({
        escapeValue: false,
      });
    });

    it('should support English and French languages', async () => {
      await initI18n();

      const initConfig = mockI18next.init.mock.calls[0][0];

      expect(initConfig.supportedLngs).toEqual(['en', 'fr']);
      expect(initConfig.preload).toEqual(['en', 'fr']);
      expect(initConfig.fallbackLng).toBe('en');
      expect(initConfig.lng).toBe('en');
    });

    it('should use Backend and LanguageDetector plugins', async () => {
      await initI18n();

      expect(mockI18next.use).toHaveBeenCalledTimes(2);
      // The first call should be for Backend, second for LanguageDetector
    });
  });

  describe('default export', () => {
    it('should export the i18next instance', () => {
      const { default: exportedI18next } = require('../../src/config/i18n');
      expect(exportedI18next).toBe(i18next);
    });
  });
});
