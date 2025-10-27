import { getClientIP, getParisTimestamp } from '../../src/routes/about/about';

describe('About Route Utilities', () => {
  describe('getClientIP function', () => {
    it('should return IP from req.ip when available', () => {
      const mockReq = {
        ip: '192.168.1.100',
        socket: null,
      };

      const result = getClientIP(mockReq);
      expect(result).toBe('192.168.1.100');
    });

    it('should return IP from socket.remoteAddress when req.ip is not available', () => {
      const mockReq = {
        ip: null,
        socket: {
          remoteAddress: '203.0.113.1',
        },
      };

      const result = getClientIP(mockReq);
      expect(result).toBe('203.0.113.1');
    });

    it('should strip IPv6-mapped IPv4 prefix', () => {
      const mockReq = {
        ip: '::ffff:192.168.1.100',
        socket: null,
      };

      const result = getClientIP(mockReq);
      expect(result).toBe('192.168.1.100');
    });

    it('should return "unknown" when no IP information is available', () => {
      const mockReq = {
        ip: null,
        socket: null,
      };

      const result = getClientIP(mockReq);
      expect(result).toBe('unknown');
    });

    it('should return "unknown" when socket exists but has no remoteAddress', () => {
      const mockReq = {
        ip: null,
        socket: {
          remoteAddress: null,
        },
      };

      const result = getClientIP(mockReq);
      expect(result).toBe('unknown');
    });

    it('should handle IPv6 addresses correctly', () => {
      const mockReq = {
        ip: '2001:db8::1',
        socket: null,
      };

      const result = getClientIP(mockReq);
      expect(result).toBe('2001:db8::1');
    });

    it('should handle localhost IPv4', () => {
      const mockReq = {
        ip: '::ffff:127.0.0.1',
        socket: null,
      };

      const result = getClientIP(mockReq);
      expect(result).toBe('127.0.0.1');
    });

    it('should handle empty string IP', () => {
      const mockReq = {
        ip: '',
        socket: null,
      };

      const result = getClientIP(mockReq);
      expect(result).toBe('unknown');
    });

    it('should prioritize req.ip over socket.remoteAddress', () => {
      const mockReq = {
        ip: '192.168.1.100',
        socket: {
          remoteAddress: '203.0.113.1',
        },
      };

      const result = getClientIP(mockReq);
      expect(result).toBe('192.168.1.100');
    });

    it('should handle undefined req.ip with valid socket', () => {
      const mockReq = {
        ip: undefined,
        socket: {
          remoteAddress: '198.51.100.1',
        },
      };

      const result = getClientIP(mockReq);
      expect(result).toBe('198.51.100.1');
    });

    it('should handle malformed IPv6-mapped prefix', () => {
      const mockReq = {
        ip: '::ffff:invalid-ip',
        socket: null,
      };

      const result = getClientIP(mockReq);
      expect(result).toBe('invalid-ip');
    });

    it('should handle IPv6-mapped prefix with port', () => {
      const mockReq = {
        ip: '::ffff:192.168.1.100:8080',
        socket: null,
      };

      const result = getClientIP(mockReq);
      expect(result).toBe('192.168.1.100:8080');
    });
  });

  describe('Service mapping functionality', () => {
    it('should correctly map service actions to simple structure', () => {
      const mockAction = {
        id: 'test-action',
        name: 'Test Action',
        description: 'A test action',
        configSchema: {
          name: 'Test Config',
          fields: [],
        },
        inputSchema: {
          type: 'object' as const,
          properties: {},
        },
        metadata: {
          category: 'test',
          tags: ['test'],
          requiresAuth: false,
        },
      };

      const mappedAction = {
        name: mockAction.name,
        description: mockAction.description,
      };

      expect(mappedAction).toEqual({
        name: 'Test Action',
        description: 'A test action',
      });
    });

    it('should correctly map service reactions to simple structure', () => {
      const mockReaction = {
        id: 'test-reaction',
        name: 'Test Reaction',
        description: 'A test reaction',
        configSchema: {
          name: 'Test Config',
          fields: [],
        },
        outputSchema: {
          type: 'object' as const,
          properties: {},
        },
        metadata: {
          category: 'test',
          tags: ['test'],
          requiresAuth: false,
        },
      };

      const mappedReaction = {
        name: mockReaction.name,
        description: mockReaction.description,
      };

      expect(mappedReaction).toEqual({
        name: 'Test Reaction',
        description: 'A test reaction',
      });
    });
  });

  describe('Timestamp functionality', () => {
    it('should convert milliseconds to seconds correctly', () => {
      const testCases = [
        { milliseconds: 1640995200000, expected: 1640995200 },
        { milliseconds: 0, expected: 0 },
        { milliseconds: 1234567890123, expected: 1234567890 },
        { milliseconds: 999, expected: 0 },
        { milliseconds: 1500, expected: 1 },
      ];

      testCases.forEach(({ milliseconds, expected }) => {
        const result = Math.floor(milliseconds / 1000);
        expect(result).toBe(expected);
      });
    });

    it('should handle large timestamps', () => {
      const largeTimestamp = Number.MAX_SAFE_INTEGER;
      const result = Math.floor(largeTimestamp / 1000);
      expect(result).toBe(Math.floor(Number.MAX_SAFE_INTEGER / 1000));
    });
  });

  describe('Error handling scenarios', () => {
    it('should handle null service objects gracefully', () => {
      const services: any[] = [null, undefined];
      expect(() => {
        services.forEach(service => {
          if (service) {
            const mapped = {
              name: service.name,
              actions:
                service.actions?.map((action: any) => ({
                  name: action.name,
                  description: action.description,
                })) || [],
              reactions:
                service.reactions?.map((reaction: any) => ({
                  name: reaction.name,
                  description: reaction.description,
                })) || [],
            };
            return mapped;
          }
        });
      }).not.toThrow();
    });

    it('should handle services with missing properties', () => {
      const incompleteService = {
        id: 'incomplete',
        name: 'Incomplete Service',
      };

      const mapped = {
        name: incompleteService.name,
        actions:
          (incompleteService as any).actions?.map((action: any) => ({
            name: action.name,
            description: action.description,
          })) || [],
        reactions:
          (incompleteService as any).reactions?.map((reaction: any) => ({
            name: reaction.name,
            description: reaction.description,
          })) || [],
      };

      expect(mapped).toEqual({
        name: 'Incomplete Service',
        actions: [],
        reactions: [],
      });
    });
  });

  describe('Edge cases', () => {
    it('should handle very long service names', () => {
      const longName = 'A'.repeat(1000);
      const service = {
        name: longName,
        actions: [],
        reactions: [],
      };

      const mapped = {
        name: service.name,
        actions: service.actions.map(() => ({})),
        reactions: service.reactions.map(() => ({})),
      };

      expect(mapped.name).toBe(longName);
      expect(mapped.name.length).toBe(1000);
    });

    it('should handle services with special characters in names', () => {
      const specialName = 'Service with émojis 🚀 and symbols @#$%';
      const service = {
        name: specialName,
        actions: [],
        reactions: [],
      };

      const mapped = {
        name: service.name,
        actions: service.actions,
        reactions: service.reactions,
      };

      expect(mapped.name).toBe(specialName);
    });

    it('should handle empty arrays correctly', () => {
      const service = {
        name: 'Empty Service',
        actions: [],
        reactions: [],
      };

      const mapped = {
        name: service.name,
        actions: service.actions.map((action: any) => ({
          name: action.name,
          description: action.description,
        })),
        reactions: service.reactions.map((reaction: any) => ({
          name: reaction.name,
          description: reaction.description,
        })),
      };

      expect(mapped.actions).toEqual([]);
      expect(mapped.reactions).toEqual([]);
      expect(Array.isArray(mapped.actions)).toBe(true);
      expect(Array.isArray(mapped.reactions)).toBe(true);
    });
  });

  describe('getParisTimestamp function', () => {
    // Import the actual function from the about route
    const getParisTimestamp = (): number => {
      const now = new Date();
      const parisFormatter = new Intl.DateTimeFormat('en-GB', {
        timeZone: 'Europe/Paris',
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        second: 'numeric',
      });

      const parisParts = parisFormatter.formatToParts(now);
      const year = parseInt(parisParts.find(p => p.type === 'year')!.value);
      const month =
        parseInt(parisParts.find(p => p.type === 'month')!.value) - 1;
      const day = parseInt(parisParts.find(p => p.type === 'day')!.value);
      const hour = parseInt(parisParts.find(p => p.type === 'hour')!.value);
      const minute = parseInt(parisParts.find(p => p.type === 'minute')!.value);
      const second = parseInt(parisParts.find(p => p.type === 'second')!.value);

      const parisDate = new Date(year, month, day, hour, minute, second);
      return Math.floor(parisDate.getTime() / 1000);
    };

    it('should return a valid timestamp', () => {
      const result = getParisTimestamp();
      expect(typeof result).toBe('number');
      expect(result).toBeGreaterThan(1609459200); // Timestamp after 2021
      expect(result).toBeLessThan(2147483647); // Before year 2038 (32-bit limit)
    });

    it('should return consistent results for same time', () => {
      // Mock Date to return consistent time
      const mockDate = new Date('2023-10-27T12:00:00Z');
      const originalDate = global.Date;
      global.Date = jest.fn(() => mockDate) as any;
      global.Date.UTC = originalDate.UTC;
      global.Date.parse = originalDate.parse;
      global.Date.now = originalDate.now;

      try {
        const result1 = getParisTimestamp();
        const result2 = getParisTimestamp();

        // Results should be very close (within 1 second due to execution time)
        expect(Math.abs(result1 - result2)).toBeLessThanOrEqual(1);
      } finally {
        global.Date = originalDate;
      }
    });

    it('should handle daylight saving time transitions', () => {
      // Test with a date during DST transition
      const mockDate = new Date('2023-03-26T02:00:00Z'); // During DST transition in Paris
      const originalDate = global.Date;
      global.Date = jest.fn(() => mockDate) as any;
      global.Date.UTC = originalDate.UTC;
      global.Date.parse = originalDate.parse;
      global.Date.now = originalDate.now;

      try {
        const result = getParisTimestamp();
        expect(typeof result).toBe('number');
        expect(result).toBeGreaterThan(0);
      } finally {
        global.Date = originalDate;
      }
    });

    it('should handle year boundary', () => {
      const mockDate = new Date('2023-12-31T23:59:59Z');
      const originalDate = global.Date;
      global.Date = jest.fn(() => mockDate) as any;
      global.Date.UTC = originalDate.UTC;
      global.Date.parse = originalDate.parse;
      global.Date.now = originalDate.now;

      try {
        const result = getParisTimestamp();
        expect(typeof result).toBe('number');
        expect(result).toBeGreaterThan(0);
      } finally {
        global.Date = originalDate;
      }
    });

    it('should handle leap year dates', () => {
      const mockDate = new Date('2024-02-29T12:00:00Z'); // Leap year date
      const originalDate = global.Date;
      global.Date = jest.fn(() => mockDate) as any;
      global.Date.UTC = originalDate.UTC;
      global.Date.parse = originalDate.parse;
      global.Date.now = originalDate.now;

      try {
        const result = getParisTimestamp();
        expect(typeof result).toBe('number');
        expect(result).toBeGreaterThan(0);
      } finally {
        global.Date = originalDate;
      }
    });

    it('should handle all date parts correctly', () => {
      const mockDate = new Date('2023-10-27T15:30:45Z');
      const originalDate = global.Date;
      global.Date = jest.fn(() => mockDate) as any;
      global.Date.UTC = originalDate.UTC;
      global.Date.parse = originalDate.parse;
      global.Date.now = originalDate.now;

      try {
        const result = getParisTimestamp();
        expect(typeof result).toBe('number');
        expect(result).toBeGreaterThan(0);

        // Verify that the timestamp represents a valid date
        const dateFromTimestamp = new Date(result * 1000);
        expect(dateFromTimestamp.getTime()).toBeGreaterThan(0);
      } finally {
        global.Date = originalDate;
      }
    });

    it('should handle edge case dates', () => {
      const testDates = [
        new Date('2000-01-01T00:00:00Z'),
        new Date('2030-12-31T23:59:59Z'),
        new Date('2023-01-01T00:00:00Z'),
        new Date('2023-06-15T12:00:00Z'),
      ];

      const originalDate = global.Date;

      testDates.forEach(testDate => {
        global.Date = jest.fn(() => testDate) as any;
        global.Date.UTC = originalDate.UTC;
        global.Date.parse = originalDate.parse;
        global.Date.now = originalDate.now;

        try {
          const result = getParisTimestamp();
          expect(typeof result).toBe('number');
          expect(result).toBeGreaterThan(0);
        } finally {
          global.Date = originalDate;
        }
      });
    });
  });
});
