import * as dotenv from 'dotenv';
import { AppDataSource } from './src/config/db';
import { saveData } from './src/app';
import express from 'express';
import { waitForPostgres } from './src/utils/waitForDb';
import { executionService } from './src/services/ExecutionService';
import { serviceLoader } from './src/services/ServiceLoader';

const app = express();
dotenv.config();

// Middleware
app.use(express.json());

// Health check endpoint
app.get('/health', (req: express.Request, res: express.Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    services: {
      database: AppDataSource.isInitialized,
      executionService: executionService ? 'running' : 'stopped',
    },
  });
});

// Graceful shutdown handlers
process.on('SIGINT', async () => {
  console.log('Received SIGINT, shutting down gracefully...');
  await executionService.stop();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('Received SIGTERM, shutting down gracefully...');
  await executionService.stop();
  process.exit(0);
});

(async function start() {
  try {
    console.log('Waiting for Postgres to be ready...');
    await waitForPostgres({ retries: 12, delayMs: 2000 });

    await AppDataSource.initialize();
    console.log('Database connection established');

    console.log('Loading services...');
    await serviceLoader.loadAllServices();

    await executionService.start();

    app.listen(3000, () => {
      console.log('AREA backend server is running on port 3000');
      console.log('Health check available at: http://localhost:3000/health');
    });

    await saveData();
  } catch (err) {
    console.error('Failed to start application:', (err as Error).message);
    process.exit(1);
  }
})();
