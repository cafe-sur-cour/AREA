import * as cron from 'node-cron';
import { AppDataSource } from '../../../src/config/db';

// Mock dependencies before importing
jest.mock('../../../src/config/db');
jest.mock('node-cron');

import timerService, {
  initialize,
  cleanup,
} from '../../../src/services/services/timer/index';

describe('Timer Service Index', () => {
  let mockCronTask: any;

  beforeEach(() => {
    jest.clearAllMocks();

    mockCronTask = {
      destroy: jest.fn(),
    };

    (cron.schedule as jest.Mock).mockReturnValue(mockCronTask);

    const mockRepo = {
      find: jest.fn().mockResolvedValue([]),
      create: jest.fn(data => data),
      save: jest.fn(),
    };

    (AppDataSource.getRepository as jest.Mock).mockReturnValue(mockRepo);
  });

  describe('Service Definition', () => {
    it('should export a valid service object', () => {
      expect(timerService).toBeDefined();
      expect(timerService.id).toBe('timer');
      expect(timerService.name).toBe('Timer');
      expect(timerService.version).toBe('1.0.0');
    });

    it('should have correct service metadata', () => {
      expect(timerService.description).toContain('timer service');
      expect(timerService.icon).toContain('svg');
      expect(timerService.oauth).toEqual({
        enabled: false,
      });
      expect(timerService.alwaysSubscribed).toBe(true);
    });

    it('should have actions array', () => {
      expect(timerService.actions).toBeDefined();
      expect(Array.isArray(timerService.actions)).toBe(true);
      expect(timerService.actions).toHaveLength(2);
    });

    it('should have reactions array', () => {
      expect(timerService.reactions).toBeDefined();
      expect(Array.isArray(timerService.reactions)).toBe(true);
      expect(timerService.reactions).toHaveLength(0);
    });

    it('should have every_day_at_x_hour action', () => {
      const action = timerService.actions?.find(
        a => a.id === 'timer.every_day_at_x_hour'
      );
      expect(action).toBeDefined();
      expect(action?.name).toBe('Every Day at X Hour');
      expect(action?.metadata?.category).toBe('Timer');
      expect(action?.metadata?.requiresAuth).toBe(false);
    });

    it('should have every_hour_at_intervals action', () => {
      const action = timerService.actions?.find(
        a => a.id === 'timer.every_hour_at_intervals'
      );
      expect(action).toBeDefined();
      expect(action?.name).toBe('Every Hour at X Minute');
      expect(action?.metadata?.category).toBe('Timer');
      expect(action?.metadata?.requiresAuth).toBe(false);
    });
  });

  describe('initialize', () => {
    it('should initialize and start the scheduler', async () => {
      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();

      await initialize();

      expect(consoleLogSpy).toHaveBeenCalledWith(
        'Initializing Timer service...'
      );
      expect(consoleLogSpy).toHaveBeenCalledWith('Starting Timer scheduler...');
      expect(consoleLogSpy).toHaveBeenCalledWith(
        'Timer scheduler started successfully'
      );
      expect(consoleLogSpy).toHaveBeenCalledWith('Timer service initialized');
      expect(cron.schedule).toHaveBeenCalledWith(
        '* * * * *',
        expect.any(Function)
      );

      consoleLogSpy.mockRestore();
    });

    it('should create scheduler instance', async () => {
      await initialize();

      // Verify scheduler was created by checking cron was called
      expect(cron.schedule).toHaveBeenCalled();
    });
  });

  describe('cleanup', () => {
    it('should stop the scheduler when cleaning up', async () => {
      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();

      await initialize();
      await cleanup();

      expect(consoleLogSpy).toHaveBeenCalledWith(
        'Cleaning up Timer service...'
      );
      expect(consoleLogSpy).toHaveBeenCalledWith('Stopping Timer scheduler...');
      expect(consoleLogSpy).toHaveBeenCalledWith('Timer scheduler stopped');
      expect(consoleLogSpy).toHaveBeenCalledWith('Timer service cleaned up');
      expect(mockCronTask.destroy).toHaveBeenCalled();

      consoleLogSpy.mockRestore();
    });

    it('should handle cleanup when scheduler is not running', async () => {
      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();

      await cleanup();

      expect(consoleLogSpy).toHaveBeenCalledWith(
        'Cleaning up Timer service...'
      );
      expect(consoleLogSpy).toHaveBeenCalledWith('Timer service cleaned up');

      consoleLogSpy.mockRestore();
    });

    it('should set scheduler to null after cleanup', async () => {
      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();

      await initialize();
      await cleanup();

      // Try cleanup again to verify scheduler was set to null
      await cleanup();

      // Should handle gracefully without errors
      expect(consoleLogSpy).toHaveBeenCalledWith('Timer service cleaned up');

      consoleLogSpy.mockRestore();
    });
  });

  describe('initialization and cleanup lifecycle', () => {
    it('should support multiple initialize-cleanup cycles', async () => {
      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();

      // First cycle
      await initialize();
      await cleanup();

      // Second cycle
      await initialize();
      await cleanup();

      expect(cron.schedule).toHaveBeenCalledTimes(2);
      expect(mockCronTask.destroy).toHaveBeenCalledTimes(2);

      consoleLogSpy.mockRestore();
    });
  });
});
