import {
  interpolatePayload,
  interpolateString,
} from '../../src/utils/payloadInterpolation';

describe('payloadInterpolation utils', () => {
  describe('interpolateString', () => {
    it('should return template unchanged when no placeholders', () => {
      const template = 'Hello World';
      const context = { user: { name: 'John' } };

      const result = interpolateString(template, context);
      expect(result).toBe('Hello World');
    });

    it('should interpolate simple placeholder', () => {
      const template = 'Hello {{user.name}}';
      const context = { user: { name: 'John' } };

      const result = interpolateString(template, context);
      expect(result).toBe('Hello John');
    });

    it('should interpolate multiple placeholders', () => {
      const template = '{{greeting}} {{user.name}}!';
      const context = { greeting: 'Hi', user: { name: 'John' } };

      const result = interpolateString(template, context);
      expect(result).toBe('Hi John!');
    });

    it('should handle nested object paths', () => {
      const template = 'User: {{user.profile.name}} from {{user.profile.city}}';
      const context = {
        user: {
          profile: {
            name: 'John',
            city: 'Paris',
          },
        },
      };

      const result = interpolateString(template, context);
      expect(result).toBe('User: John from Paris');
    });

    it('should handle array access notation (not supported)', () => {
      const template = 'First item: {{items[0]}}';
      const context = { items: ['apple', 'banana'] };

      const result = interpolateString(template, context);
      expect(result).toBe('First item: {{items[0]}}'); // Array access not supported
    });

    it('should return original placeholder when path not found', () => {
      const template = 'Hello {{user.missing}}';
      const context = { user: { name: 'John' } };

      const result = interpolateString(template, context);
      expect(result).toBe('Hello {{user.missing}}');
    });

    it('should handle empty context', () => {
      const template = 'Hello {{user.name}}';
      const context = {};

      const result = interpolateString(template, context);
      expect(result).toBe('Hello {{user.name}}');
    });

    it('should handle whitespace in placeholders', () => {
      const template = 'Hello {{ user.name }}';
      const context = { user: { name: 'John' } };

      const result = interpolateString(template, context);
      expect(result).toBe('Hello John');
    });

    it('should handle malformed placeholders', () => {
      const template = 'Hello {{user.name';
      const context = { user: { name: 'John' } };

      const result = interpolateString(template, context);
      expect(result).toBe('Hello {{user.name');
    });
  });

  describe('interpolatePayload', () => {
    it('should interpolate string values in object', () => {
      const config = {
        message: 'Hello {{action.payload.user.name}}',
        count: 5,
        enabled: true,
      };
      const actionPayload = { user: { name: 'John' } };

      const result = interpolatePayload(config, actionPayload);
      expect(result).toEqual({
        message: 'Hello John',
        count: 5,
        enabled: true,
      });
    });

    it('should handle nested objects', () => {
      const config = {
        user: {
          greeting: 'Hi {{action.payload.user.name}}',
          profile: {
            displayName:
              '{{action.payload.user.profile.name}} ({{action.payload.user.profile.age}})',
          },
        },
      };
      const actionPayload = {
        user: {
          name: 'John',
          profile: {
            name: 'Johnny',
            age: 30,
          },
        },
      };

      const result = interpolatePayload(config, actionPayload);
      expect(result).toEqual({
        user: {
          greeting: 'Hi John',
          profile: {
            displayName: 'Johnny (30)',
          },
        },
      });
    });

    it('should handle arrays (transformed to objects with numeric keys)', () => {
      const config = {
        messages: ['Hello {{user.name}}', 'Welcome to {{location}}'],
      };
      const actionPayload = { user: { name: 'John' }, location: 'Paris' };

      const result = interpolatePayload(config, actionPayload);
      expect(result).toEqual({
        messages: {
          '0': 'Hello {{user.name}}', // Arrays are not interpolated, just converted to objects
          '1': 'Welcome to {{location}}',
        },
      });
    });

    it('should handle non-string values (arrays become objects)', () => {
      const config = {
        number: 42,
        boolean: true,
        null: null,
        array: [1, 2, 3],
        object: { key: 'value' },
      };
      const actionPayload = { user: { name: 'John' } };

      const result = interpolatePayload(config, actionPayload);
      expect(result).toEqual({
        number: 42,
        boolean: true,
        null: null,
        array: { '0': 1, '1': 2, '2': 3 }, // Arrays are converted to objects
        object: { key: 'value' },
      });
    });

    it('should handle empty objects', () => {
      const config = {};
      const actionPayload = { user: { name: 'John' } };

      const result = interpolatePayload(config, actionPayload);
      expect(result).toEqual({});
    });
  });
});
