import { timerActions } from '../../../src/services/services/timer/actions';

describe('Timer Actions', () => {
  it('should export an array of actions', () => {
    expect(Array.isArray(timerActions)).toBe(true);
    expect(timerActions).toHaveLength(2);
  });

  describe('timer.every_day_at_x_hour', () => {
    const action = timerActions.find(a => a.id === 'timer.every_day_at_x_hour');

    it('should be defined with correct id', () => {
      expect(action).toBeDefined();
      expect(action?.id).toBe('timer.every_day_at_x_hour');
    });

    it('should have correct name and description', () => {
      expect(action?.name).toBe('Every Day at X Hour');
      expect(action?.description).toContain('Paris timezone');
    });

    it('should have configSchema defined', () => {
      expect(action?.configSchema).toBeDefined();
      expect(action?.configSchema.name).toBe('Every Day at X Hour');
    });

    it('should have inputSchema with correct properties', () => {
      expect(action?.inputSchema).toBeDefined();
      expect(action?.inputSchema.type).toBe('object');
      expect(action?.inputSchema.properties).toBeDefined();
      expect(action?.inputSchema.properties?.timestamp).toBeDefined();
      expect(action?.inputSchema.properties?.hour).toBeDefined();
      expect(action?.inputSchema.properties?.minute).toBeDefined();
      expect(action?.inputSchema.properties?.day).toBeDefined();
    });

    it('should have correct metadata', () => {
      expect(action?.metadata?.category).toBe('Timer');
      expect(action?.metadata?.tags).toContain('schedule');
      expect(action?.metadata?.tags).toContain('daily');
      expect(action?.metadata?.requiresAuth).toBe(false);
    });
  });

  describe('timer.every_hour_at_intervals', () => {
    const action = timerActions.find(
      a => a.id === 'timer.every_hour_at_intervals'
    );

    it('should be defined with correct id', () => {
      expect(action).toBeDefined();
      expect(action?.id).toBe('timer.every_hour_at_intervals');
    });

    it('should have correct name and description', () => {
      expect(action?.name).toBe('Every Hour at X Minute');
      expect(action?.description).toContain('every hour');
    });

    it('should have configSchema defined', () => {
      expect(action?.configSchema).toBeDefined();
      expect(action?.configSchema.name).toBe('Every Hour at X Minute');
    });

    it('should have inputSchema with correct properties', () => {
      expect(action?.inputSchema).toBeDefined();
      expect(action?.inputSchema.type).toBe('object');
      expect(action?.inputSchema.properties).toBeDefined();
      expect(action?.inputSchema.properties?.timestamp).toBeDefined();
      expect(action?.inputSchema.properties?.minute).toBeDefined();
    });

    it('should have correct metadata', () => {
      expect(action?.metadata?.category).toBe('Timer');
      expect(action?.metadata?.tags).toContain('schedule');
      expect(action?.metadata?.tags).toContain('interval');
      expect(action?.metadata?.requiresAuth).toBe(false);
    });
  });
});
