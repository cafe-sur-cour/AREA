import * as dotenv from 'dotenv';
import { AppDataSource } from './src/config/db';
import { saveData } from './src/app';
import express from 'express';
import { waitForPostgres } from './src/utils/waitForDb';
import { executionService } from './src/services/ExecutionService';

const app = express();
dotenv.config();

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

    await AppDataSource.initialize(); /* Example initilization of elem in table */
    await executionService.start();

    app.listen(3000, () => {
      // Temp not define in .env
      console.log('Server is running on port 3000');
    });

    await saveData();
  } catch (err) {
    console.error('Failed to start application:', (err as Error).message);
    process.exit(1);
  }
})();
