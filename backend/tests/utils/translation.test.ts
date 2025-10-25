// Mock i18next
jest.mock('i18next', () => ({
  t: jest.fn(),
  createInstance: jest.fn().mockReturnValue({
    t: jest.fn(),
    changeLanguage: jest.fn(),
    init: jest.fn(),
  }),
}));

import { translateService } from '../../src/utils/translation';
import type { TFunction } from 'i18next';
import { t } from 'i18next';

describe('translation utils', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (t as jest.MockedFunction<any>).mockImplementation(
      (key: string, fallback?: string) => fallback || key
    );
  });

  describe('translateService', () => {
    it('should translate service name and description', () => {
      const service = {
        id: 'github',
        name: 'GitHub',
        description: 'GitHub service',
        version: '1.0.0',
        actions: [],
        reactions: [],
      };

      t.mockReturnValueOnce('Translated GitHub').mockReturnValueOnce(
        'Translated description'
      );

      const result = translateService(service as any, t);

      expect(result.name).toBe('Translated GitHub');
      expect(result.description).toBe('Translated description');
      expect(t).toHaveBeenCalledWith('services.github.name', 'GitHub');
      expect(t).toHaveBeenCalledWith(
        'services.github.description',
        'GitHub service'
      );
    });

    it('should translate actions', () => {
      const service = {
        id: 'github',
        name: 'GitHub',
        description: 'GitHub service',
        version: '1.0.0',
        actions: [
          {
            id: 'create_issue',
            name: 'Create Issue',
            description: 'Creates a new issue',
            configSchema: { name: 'config', fields: [] },
            inputSchema: { type: 'object', properties: {} },
            metadata: { category: 'test', tags: [], requiresAuth: false },
          },
        ],
        reactions: [],
      };

      t.mockReturnValueOnce('GitHub') // service name
        .mockReturnValueOnce('GitHub service') // service description
        .mockReturnValueOnce('Translated Create Issue') // action name
        .mockReturnValueOnce('Translated description'); // action description

      const result = translateService(service as any, t);

      expect(result.actions![0].name).toBe('Translated Create Issue');
      expect(result.actions![0].description).toBe('Translated description');
    });

    it('should translate reactions', () => {
      const service = {
        id: 'slack',
        name: 'Slack',
        description: 'Slack service',
        version: '1.0.0',
        actions: [],
        reactions: [
          {
            id: 'send_message',
            name: 'Send Message',
            description: 'Sends a message',
            configSchema: { name: 'config', fields: [] },
            outputSchema: { type: 'object', properties: {} },
            metadata: { category: 'test', tags: [], requiresAuth: false },
          },
        ],
      };

      t.mockReturnValueOnce('Slack') // service name
        .mockReturnValueOnce('Slack service') // service description
        .mockReturnValueOnce('Translated Send Message') // reaction name
        .mockReturnValueOnce('Translated description'); // reaction description

      const result = translateService(service as any, t);

      expect(result.reactions![0].name).toBe('Translated Send Message');
      expect(result.reactions![0].description).toBe('Translated description');
    });

    it('should handle service without actions or reactions', () => {
      const service = {
        id: 'test',
        name: 'Test',
        description: 'Test service',
        version: '1.0.0',
        actions: [],
        reactions: [],
      };

      const result = translateService(service as any, t);

      expect(result.name).toBe('Test');
      expect(result.description).toBe('Test service');
      expect(result.actions).toEqual([]);
      expect(result.reactions).toEqual([]);
    });

    it('should translate action config schema', () => {
      const service = {
        id: 'github',
        name: 'GitHub',
        description: 'GitHub service',
        version: '1.0.0',
        actions: [
          {
            id: 'create_issue',
            name: 'Create Issue',
            description: 'Creates a new issue',
            configSchema: {
              name: 'config',
              fields: [
                {
                  name: 'repo',
                  label: 'Repository',
                  placeholder: 'Select repository',
                  type: 'string' as any,
                  options: [
                    { value: 'repo1', label: 'Repository 1' },
                    { value: 'repo2', label: 'Repository 2' },
                  ],
                },
              ],
            },
            inputSchema: { type: 'object', properties: {} },
            metadata: { category: 'test', tags: [], requiresAuth: false },
          },
        ],
        reactions: [],
      };

      t.mockReturnValueOnce('GitHub')
        .mockReturnValueOnce('GitHub service')
        .mockReturnValueOnce('Create Issue')
        .mockReturnValueOnce('Creates a new issue')
        .mockReturnValueOnce('Translated Repository')
        .mockReturnValueOnce('Translated placeholder')
        .mockReturnValueOnce('Translated Repository 1')
        .mockReturnValueOnce('Translated Repository 2');

      const result = translateService(service as any, t);

      expect(result.actions![0].configSchema.fields[0].label).toBe(
        'Translated Repository'
      );
      expect(result.actions![0].configSchema.fields[0].placeholder).toBe(
        'Translated placeholder'
      );
      expect(result.actions![0].configSchema.fields[0].options?.[0].label).toBe(
        'Translated Repository 1'
      );
      expect(result.actions![0].configSchema.fields[0].options?.[1].label).toBe(
        'Translated Repository 2'
      );
    });

    it('should translate input and output schemas', () => {
      const service = {
        id: 'test',
        name: 'Test',
        description: 'Test service',
        version: '1.0.0',
        actions: [
          {
            id: 'action1',
            name: 'Action 1',
            description: 'Action description',
            configSchema: { name: 'config', fields: [] },
            inputSchema: {
              type: 'object',
              properties: {
                field1: {
                  type: 'string',
                  description: 'field1.description',
                },
              },
            },
            metadata: { category: 'test', tags: [], requiresAuth: false },
          },
        ],
        reactions: [
          {
            id: 'reaction1',
            name: 'Reaction 1',
            description: 'Reaction description',
            configSchema: { name: 'config', fields: [] },
            outputSchema: {
              type: 'object',
              properties: {
                output1: {
                  type: 'string',
                  description: 'output1.description',
                },
              },
            },
            metadata: { category: 'test', tags: [], requiresAuth: false },
          },
        ],
      };

      // Mock to return translated descriptions
      t.mockImplementation((key: string) => {
        if (key.includes('field1.description'))
          return 'translated field1 description';
        if (key.includes('output1.description'))
          return 'translated output1 description';
        return key; // Return key as fallback for other calls
      });

      const result = translateService(service as any, t);

      expect(result.actions![0].inputSchema.properties.field1.description).toBe(
        'translated field1 description'
      );
      expect(
        result.reactions![0].outputSchema.properties.output1.description
      ).toBe('translated output1 description');
    });

    it('should handle null/undefined schemas', () => {
      const service = {
        id: 'test',
        name: 'Test',
        description: 'Test service',
        version: '1.0.0',
        actions: [
          {
            id: 'action1',
            name: 'Action 1',
            description: 'Action description',
            configSchema: null as any,
            inputSchema: undefined as any,
            metadata: { category: 'test', tags: [], requiresAuth: false },
          },
        ],
        reactions: [
          {
            id: 'reaction1',
            name: 'Reaction 1',
            description: 'Reaction description',
            configSchema: null as any,
            outputSchema: undefined as any,
            metadata: { category: 'test', tags: [], requiresAuth: false },
          },
        ],
      };

      const result = translateService(service as any, t);

      expect(result.actions![0].configSchema).toBeNull();
      expect(result.actions![0].inputSchema).toBeUndefined();
      expect(result.reactions![0].configSchema).toBeNull();
      expect(result.reactions![0].outputSchema).toBeUndefined();
    });
  });
});
