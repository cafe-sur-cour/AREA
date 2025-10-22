import { extractPayloadFields } from '../../src/utils/payloadFields';

describe('payloadFields utils', () => {
  describe('extractPayloadFields', () => {
    it('should return empty array when action has no inputSchema', () => {
      const action = {
        id: 'test-action',
        name: 'Test Action',
        description: 'Test action description',
        configSchema: { name: 'config', fields: [] },
        inputSchema: undefined,
      } as any;

      const result = extractPayloadFields(action);
      expect(result).toEqual([]);
    });

    it('should return empty array when inputSchema has no properties', () => {
      const action = {
        id: 'test-action',
        name: 'Test Action',
        description: 'Test action description',
        configSchema: { name: 'config', fields: [] },
        inputSchema: {
          type: 'object',
          properties: {},
        },
      } as any;

      const result = extractPayloadFields(action);
      expect(result).toEqual([]);
    });

    it('should extract simple string field', () => {
      const action = {
        id: 'test-action',
        name: 'Test Action',
        description: 'Test action description',
        configSchema: { name: 'config', fields: [] },
        inputSchema: {
          type: 'object',
          properties: {
            message: {
              type: 'string',
              description: 'The message to send',
              example: 'Hello World',
            },
          },
        },
      } as any;

      const result = extractPayloadFields(action);
      expect(result).toEqual([
        {
          path: 'message',
          type: 'string',
          description: 'The message to send',
          example: 'Hello World',
        },
      ]);
    });

    it('should extract multiple simple fields', () => {
      const action = {
        id: 'test-action',
        name: 'Test Action',
        description: 'Test action description',
        configSchema: { name: 'config', fields: [] },
        inputSchema: {
          type: 'object',
          properties: {
            title: {
              type: 'string',
              description: 'The title',
            },
            count: {
              type: 'number',
              description: 'The count',
            },
            enabled: {
              type: 'boolean',
              description: 'Whether enabled',
            },
          },
        },
      } as any;

      const result = extractPayloadFields(action);
      expect(result).toEqual([
        {
          path: 'title',
          type: 'string',
          description: 'The title',
        },
        {
          path: 'count',
          type: 'number',
          description: 'The count',
        },
        {
          path: 'enabled',
          type: 'boolean',
          description: 'Whether enabled',
        },
      ]);
    });

    it('should extract nested object fields', () => {
      const action = {
        id: 'test-action',
        name: 'Test Action',
        description: 'Test action description',
        configSchema: { name: 'config', fields: [] },
        inputSchema: {
          type: 'object',
          properties: {
            user: {
              type: 'object',
              description: 'User object',
              properties: {
                name: {
                  type: 'string',
                  description: 'User name',
                },
                age: {
                  type: 'number',
                  description: 'User age',
                },
              },
            },
          },
        },
      } as any;

      const result = extractPayloadFields(action);
      expect(result).toEqual([
        {
          path: 'user.name',
          type: 'string',
          description: 'User name',
        },
        {
          path: 'user.age',
          type: 'number',
          description: 'User age',
        },
      ]);
    });

    it('should extract array fields', () => {
      const action = {
        id: 'test-action',
        name: 'Test Action',
        description: 'Test action description',
        configSchema: { name: 'config', fields: [] },
        inputSchema: {
          type: 'object',
          properties: {
            tags: {
              type: 'array',
              items: {
                type: 'string',
                description: 'Tag item',
              },
              description: 'List of tags',
            },
          },
        },
      } as any;

      const result = extractPayloadFields(action);
      expect(result).toEqual([
        {
          path: 'tags',
          type: 'array<string>',
          description: 'List of tags',
          example: '[items]',
        },
      ]);
    });

    it('should extract array of objects with nested properties', () => {
      const action = {
        id: 'test-action',
        name: 'Test Action',
        description: 'Test action description',
        configSchema: { name: 'config', fields: [] },
        inputSchema: {
          type: 'object',
          properties: {
            items: {
              type: 'array',
              items: {
                type: 'object',
                description: 'Item object',
                properties: {
                  id: {
                    type: 'string',
                    description: 'Item ID',
                  },
                  value: {
                    type: 'number',
                    description: 'Item value',
                  },
                },
              },
              description: 'List of items',
            },
          },
        },
      } as any;

      const result = extractPayloadFields(action);
      expect(result).toEqual([
        {
          path: 'items',
          type: 'array<object>',
          description: 'List of items',
          example: '[objects]',
        },
        {
          path: 'items[0].id',
          type: 'string',
          description: 'Item ID',
        },
        {
          path: 'items[0].value',
          type: 'number',
          description: 'Item value',
        },
      ]);
    });

    it('should handle fields without description', () => {
      const action = {
        id: 'test-action',
        name: 'Test Action',
        description: 'Test action description',
        configSchema: { name: 'config', fields: [] },
        inputSchema: {
          type: 'object',
          properties: {
            field1: {
              type: 'string',
              description: 'Field description',
            },
            field2: {
              type: 'number',
              description: 'Has description',
            },
          },
        },
      } as any;

      const result = extractPayloadFields(action);
      expect(result).toEqual([
        {
          path: 'field1',
          type: 'string',
          description: 'Field description',
        },
        {
          path: 'field2',
          type: 'number',
          description: 'Has description',
        },
      ]);
    });

    it('should handle deeply nested structures', () => {
      const action = {
        id: 'test-action',
        name: 'Test Action',
        description: 'Test action description',
        configSchema: { name: 'config', fields: [] },
        inputSchema: {
          type: 'object',
          properties: {
            data: {
              type: 'object',
              description: 'Data object',
              properties: {
                user: {
                  type: 'object',
                  description: 'User object',
                  properties: {
                    profile: {
                      type: 'object',
                      description: 'Profile object',
                      properties: {
                        name: {
                          type: 'string',
                          description: 'User name',
                        },
                        settings: {
                          type: 'object',
                          description: 'Settings object',
                          properties: {
                            theme: {
                              type: 'string',
                              description: 'UI theme',
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      } as any;

      const result = extractPayloadFields(action);
      expect(result).toEqual([
        {
          path: 'data.user.profile.name',
          type: 'string',
          description: 'User name',
        },
        {
          path: 'data.user.profile.settings.theme',
          type: 'string',
          description: 'UI theme',
        },
      ]);
    });

    it('should handle mixed array types', () => {
      const action = {
        id: 'test-action',
        name: 'Test Action',
        description: 'Test action description',
        configSchema: { name: 'config', fields: [] },
        inputSchema: {
          type: 'object',
          properties: {
            mixedArray: {
              type: 'array',
              items: {
                type: 'number',
                description: 'Number item',
              },
            },
            stringArray: {
              type: 'array',
              items: {
                type: 'string',
                description: 'String item',
              },
            },
            objectArray: {
              type: 'array',
              items: {
                type: 'object',
                description: 'Object item',
                properties: {
                  key: {
                    type: 'string',
                    description: 'Key field',
                  },
                },
              },
            },
          },
        },
      } as any;

      const result = extractPayloadFields(action);
      expect(result).toEqual([
        {
          path: 'mixedArray',
          type: 'array<number>',
          description: 'Array of number',
          example: '[items]',
        },
        {
          path: 'stringArray',
          type: 'array<string>',
          description: 'Array of string',
          example: '[items]',
        },
        {
          path: 'objectArray',
          type: 'array<object>',
          description: 'Array of object',
          example: '[objects]',
        },
        {
          path: 'objectArray[0].key',
          type: 'string',
          description: 'Key field',
        },
      ]);
    });

    it('should handle empty arrays', () => {
      const action = {
        id: 'test-action',
        name: 'Test Action',
        description: 'Test action description',
        configSchema: { name: 'config', fields: [] },
        inputSchema: {
          type: 'object',
          properties: {
            emptyArray: {
              type: 'array',
              items: {
                description: 'Empty item',
              },
            },
          },
        },
      } as any;

      const result = extractPayloadFields(action);
      expect(result).toEqual([
        {
          path: 'emptyArray',
          type: 'array<object>',
          description: 'Array of items',
          example: '[items]',
        },
      ]);
    });
  });
});
