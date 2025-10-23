import { executionService } from '../services/ExecutionService';

export function setupSignal() {
  process.on('SIGINT', async () => {
    console.log('Received SIGINT, shutting down gracefully...');
    try {
      await executionService.stop();
    } catch (error) {
      console.error('Error during shutdown:', error);
    }
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    console.log('Received SIGTERM, shutting down gracefully...');
    try {
      await executionService.stop();
    } catch (error) {
      console.error('Error during shutdown:', error);
    }
    process.exit(0);
  });
}
