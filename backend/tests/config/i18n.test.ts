import i18next from 'i18next';
import { initI18n } from '../../src/config/i18n';

// Mock i18next and its plugins
jest.mock('i18next', () => ({
  use: jest.fn().mockReturnThis(),
  init: jest.fn().mockResolvedValue(undefined),
  addResourceBundle: jest.fn(),
}));

jest.mock('i18next-fs-backend', () => jest.fn());
jest.mock('i18next-http-middleware', () => ({
  LanguageDetector: jest.fn(),
}));

// Mock fs and path modules
jest.mock('fs', () => ({
  readdirSync: jest.fn(),
  existsSync: jest.fn(),
  readFileSync: jest.fn(),
}));

jest.mock('path', () => ({
  join: jest.fn(),
}));

// Mock process.cwd for testing
const mockProcessCwd = jest.fn();

Object.defineProperty(process, 'cwd', {
  value: mockProcessCwd,
  writable: true,
});

describe('i18n Configuration', () => {
  let mockI18next: jest.Mocked<typeof i18next>;
  let mockFs: jest.Mocked<typeof import('fs')>;
  let mockPath: jest.Mocked<typeof import('path')>;

  beforeEach(() => {
    jest.clearAllMocks();

    mockI18next = i18next as jest.Mocked<typeof i18next>;
    mockFs = require('fs') as jest.Mocked<typeof import('fs')>;
    mockPath = require('path') as jest.Mocked<typeof import('path')>;

    // Setup default mocks
    mockProcessCwd.mockReturnValue('/mock/project/root');
    mockI18next.init.mockResolvedValue({} as any);
    mockPath.join.mockImplementation((...args) => args.join('/'));
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

  describe('loadServiceTranslations', () => {
    beforeEach(() => {
      // Mock console methods
      jest.spyOn(console, 'warn').mockImplementation();
    });

    it('should load translations for services with existing locale files', async () => {
      // Mock directory structure
      mockFs.readdirSync.mockReturnValue([
        { name: 'github', isDirectory: () => true },
        { name: 'gitlab', isDirectory: () => true },
        { name: 'file.txt', isDirectory: () => false }, // Should be filtered out
      ] as any);

      // Mock file existence and content
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue('{"key": "value"}');

      await initI18n();

      // Should call addResourceBundle for each service and language
      expect(mockI18next.addResourceBundle).toHaveBeenCalledTimes(4); // 2 services × 2 languages
      expect(mockI18next.addResourceBundle).toHaveBeenCalledWith(
        'en',
        'translation',
        { services: { github: { key: 'value' } } },
        true,
        true
      );
      expect(mockI18next.addResourceBundle).toHaveBeenCalledWith(
        'fr',
        'translation',
        { services: { github: { key: 'value' } } },
        true,
        true
      );
    });

    it('should skip services without locale directories', async () => {
      mockFs.readdirSync.mockReturnValue([
        { name: 'github', isDirectory: () => true },
      ] as any);

      // Mock that locale files don't exist
      mockFs.existsSync.mockReturnValue(false);

      await initI18n();

      // Should not call addResourceBundle since no files exist
      expect(mockI18next.addResourceBundle).not.toHaveBeenCalled();
    });

    it('should handle JSON parsing errors gracefully', async () => {
      mockFs.readdirSync.mockReturnValue([
        { name: 'github', isDirectory: () => true },
      ] as any);

      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue('invalid json');

      await initI18n();

      // Should warn about parsing error but not throw
      expect(console.warn).toHaveBeenCalledWith(
        'Failed to load translations for github (en):',
        expect.any(SyntaxError)
      );
      expect(mockI18next.addResourceBundle).not.toHaveBeenCalled();
    });

    it('should handle file read errors gracefully', async () => {
      mockFs.readdirSync.mockReturnValue([
        { name: 'github', isDirectory: () => true },
      ] as any);

      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockImplementation(() => {
        throw new Error('File read error');
      });

      await initI18n();

      expect(console.warn).toHaveBeenCalledWith(
        'Failed to load translations for github (en):',
        expect.any(Error)
      );
      expect(mockI18next.addResourceBundle).not.toHaveBeenCalled();
    });

    it('should handle services directory read errors gracefully', async () => {
      mockFs.readdirSync.mockImplementation(() => {
        throw new Error('Directory read error');
      });

      await initI18n();

      expect(console.warn).toHaveBeenCalledWith(
        'Failed to scan services directory:',
        expect.any(Error)
      );
      expect(mockI18next.addResourceBundle).not.toHaveBeenCalled();
    });

    it('should process multiple services and languages correctly', async () => {
      mockFs.readdirSync.mockReturnValue([
        { name: 'github', isDirectory: () => true },
        { name: 'gitlab', isDirectory: () => true },
      ] as any);

      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue('{"test": "translation"}');

      await initI18n();

      expect(mockI18next.addResourceBundle).toHaveBeenCalledTimes(4); // 2 services × 2 languages

      // Check calls for github
      expect(mockI18next.addResourceBundle).toHaveBeenCalledWith(
        'en',
        'translation',
        { services: { github: { test: 'translation' } } },
        true,
        true
      );
      expect(mockI18next.addResourceBundle).toHaveBeenCalledWith(
        'fr',
        'translation',
        { services: { github: { test: 'translation' } } },
        true,
        true
      );

      // Check calls for gitlab
      expect(mockI18next.addResourceBundle).toHaveBeenCalledWith(
        'en',
        'translation',
        { services: { gitlab: { test: 'translation' } } },
        true,
        true
      );
      expect(mockI18next.addResourceBundle).toHaveBeenCalledWith(
        'fr',
        'translation',
        { services: { gitlab: { test: 'translation' } } },
        true,
        true
      );
    });

    it('should handle mixed scenarios with some files missing', async () => {
      mockFs.readdirSync.mockReturnValue([
        { name: 'github', isDirectory: () => true },
        { name: 'gitlab', isDirectory: () => true },
      ] as any);

      // Mock existsSync to return true for github files, false for gitlab
      mockFs.existsSync.mockImplementation(filePath => {
        return String(filePath).includes('github');
      });

      mockFs.readFileSync.mockReturnValue('{"github": "translation"}');

      await initI18n();

      // Should only load github translations
      expect(mockI18next.addResourceBundle).toHaveBeenCalledTimes(2); // Only github, 2 languages
      expect(mockI18next.addResourceBundle).toHaveBeenCalledWith(
        'en',
        'translation',
        { services: { github: { github: 'translation' } } },
        true,
        true
      );
      expect(mockI18next.addResourceBundle).toHaveBeenCalledWith(
        'fr',
        'translation',
        { services: { github: { github: 'translation' } } },
        true,
        true
      );
    });
  });
});
