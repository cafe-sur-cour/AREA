import * as dotenv from 'dotenv';
import { AppDataSource } from './src/config/db';
import { saveData } from './src/app';
import express from 'express';
import crypto from 'crypto';
import cookieParser from 'cookie-parser';
import { waitForPostgres } from './src/utils/waitForDb';
import { setupSwagger } from './src/routes/docs/swagger';
import cors from 'cors';
import process from 'process';

import authRoutes from './src/routes/auth/auth';
import userRoutes from './src/routes/user/user';
import { executionService } from './src/services/ExecutionService';
import { serviceLoader } from './src/services/ServiceLoader';

const app = express();
export const JWT_SECRET = crypto.randomBytes(64).toString('hex');
dotenv.config();

const FRONTEND_ORIGIN = process.env.FRONTEND_URL || '';

/* Declare  the cors and allowed routes */
app.use(
  cors({
    origin: FRONTEND_ORIGIN,
    credentials: true,
  })
);

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', FRONTEND_ORIGIN);
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

/* Route definition with API as prefix */
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);

setupSwagger(app);
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
      console.log('Server is running on port 3000');
      console.log('AREA backend server is running on port 3000');
      console.log('Health check available at: http://localhost:3000/health');
    });

    await saveData();
  } catch (err) {
    console.error('Failed to start application:', (err as Error).message);
    process.exit(1);
  }
})();
