import { setupSignal } from '../../src/utils/signal';

// Mock executionService
jest.mock('../../src/services/ExecutionService', () => ({
  executionService: {
    stop: jest.fn(),
  },
}));

import { executionService } from '../../src/services/ExecutionService';

describe('signal utils', () => {
  let mockExit: jest.SpyInstance;
  let mockLog: jest.SpyInstance;
  let mockOn: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    mockExit = jest.spyOn(process, 'exit').mockImplementation(() => {
      // Don't actually exit, just prevent the test from terminating
      throw new Error('PROCESS_EXIT_CALLED');
    });
    mockLog = jest.spyOn(console, 'log').mockImplementation(() => {});
    mockOn = jest.spyOn(process, 'on').mockImplementation(() => process);
  });

  afterEach(() => {
    mockExit.mockRestore();
    mockLog.mockRestore();
    mockOn.mockRestore();
  });

  describe('setupSignal', () => {
    it('should setup SIGINT handler', async () => {
      setupSignal();

      expect(mockOn).toHaveBeenCalledWith('SIGINT', expect.any(Function));
      expect(mockOn).toHaveBeenCalledWith('SIGTERM', expect.any(Function));

      // Get the SIGINT handler
      const sigintHandler = mockOn.mock.calls.find(
        call => call[0] === 'SIGINT'
      )?.[1] as Function;

      // Call the handler
      await expect(sigintHandler()).rejects.toThrow('PROCESS_EXIT_CALLED');

      expect(mockLog).toHaveBeenCalledWith(
        'Received SIGINT, shutting down gracefully...'
      );
      expect(executionService.stop).toHaveBeenCalled();
    });

    it('should setup SIGTERM handler', async () => {
      setupSignal();

      expect(mockOn).toHaveBeenCalledWith('SIGINT', expect.any(Function));
      expect(mockOn).toHaveBeenCalledWith('SIGTERM', expect.any(Function));

      // Get the SIGTERM handler
      const sigtermHandler = mockOn.mock.calls.find(
        call => call[0] === 'SIGTERM'
      )?.[1] as Function;

      // Call the handler
      await expect(sigtermHandler()).rejects.toThrow('PROCESS_EXIT_CALLED');

      expect(mockLog).toHaveBeenCalledWith(
        'Received SIGTERM, shutting down gracefully...'
      );
      expect(executionService.stop).toHaveBeenCalled();
    });

    it('should handle multiple signal setups', () => {
      setupSignal();
      setupSignal(); // Call again

      expect(mockOn).toHaveBeenCalledTimes(4); // 2 calls per setupSignal
    });

    it('should handle executionService.stop throwing an error', async () => {
      const mockStop = executionService.stop as jest.MockedFunction<
        typeof executionService.stop
      >;
      mockStop.mockRejectedValue(new Error('Stop failed'));

      setupSignal();

      // Get the SIGINT handler
      const sigintHandler = mockOn.mock.calls.find(
        call => call[0] === 'SIGINT'
      )?.[1] as Function;

      // Call the handler - should not throw due to try/catch
      await expect(sigintHandler()).rejects.toThrow('PROCESS_EXIT_CALLED');

      expect(mockLog).toHaveBeenCalledWith(
        'Received SIGINT, shutting down gracefully...'
      );
      expect(executionService.stop).toHaveBeenCalled();
    });
  });
});
