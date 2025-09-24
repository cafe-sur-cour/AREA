import * as dotenv from 'dotenv';
import { AppDataSource } from './src/config/db';
import { saveData } from './src/app';
import express from 'express';
import crypto from 'crypto';
import cookieParser from 'cookie-parser';
import { waitForPostgres } from './src/utils/waitForDb';
import { setupSwagger } from './src/routes/docs/swagger';
import { setupSignal } from './src/utils/signal';

import authRoutes from './src/routes/auth/auth';
import userRoutes from './src/routes/user/user';
import apiRoutes from './src/routes/api/api';

import { executionService } from './src/services/ExecutionService';
import { serviceLoader } from './src/services/ServiceLoader';

const app = express();
export const JWT_SECRET = crypto.randomBytes(64).toString('hex');
dotenv.config();

/* Declare  the cors and allowed routes */

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

/* Route definition with API as prefix */
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/info', apiRoutes);

setupSwagger(app);
setupSignal();

(async function start() {
  try {
    console.log('Waiting for Postgres to be ready...');
    await waitForPostgres({ retries: 12, delayMs: 2000 });

    await AppDataSource.initialize();
    console.log('Database connection established');

    console.log('Loading services...');
    await serviceLoader.loadAllServices();
    await executionService.start();

    app.listen(3000, () => {});

    await saveData();
  } catch (err) {
    console.error('Failed to start application:', (err as Error).message);
    process.exit(1);
  }
})();
