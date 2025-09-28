import * as dotenv from 'dotenv';
import { AppDataSource } from './src/config/db';
import { saveData } from './src/app';
import express from 'express';
import crypto from 'crypto';
import cookieParser from 'cookie-parser';
import { waitForPostgres } from './src/utils/waitForDb';
import { setupSwagger } from './src/routes/docs/swagger';
import { setupSignal } from './src/utils/signal';
import cors from 'cors';
import process from 'process';
import { initI18n } from './src/config/i18n';
import i18next from 'i18next';
import * as i18nextMiddleware from 'i18next-http-middleware';
import passport from 'passport';
import './src/config/passport';

import authRoutes from './src/routes/auth/auth';
import userRoutes from './src/routes/user/user';
import apiRoutes from './src/routes/api/api';
import aboutRoutes from './src/routes/about/about';
import webhookRoutes from './src/webhooks';
import githubRoutes from './src/routes/github/github';
import serviceConfigRoutes from './src/routes/services/configs';

import { executionService } from './src/services/ExecutionService';
import { serviceLoader } from './src/services/ServiceLoader';
import { webhookLoader } from './src/webhooks/WebhookLoader';

const app = express();
export const JWT_SECRET = crypto.randomBytes(64).toString('hex');
dotenv.config();

const FRONTEND_ORIGIN = process.env.FRONTEND_URL || '';

app.use(passport.initialize());

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
app.use('/api/github', githubRoutes);
app.use('/api/services', serviceConfigRoutes);
app.use('/api/info', apiRoutes);
app.use('/about.json', aboutRoutes);
app.use('/webhooks', webhookRoutes);

setupSwagger(app);
setupSignal();

(async function start() {
  try {
    console.log('Initializing i18n...');
    await initI18n();
    app.use(i18nextMiddleware.handle(i18next));
    console.log('i18n initialized');

    console.log('Waiting for Postgres to be ready...');
    await waitForPostgres({ retries: 12, delayMs: 2000 });

    await AppDataSource.initialize();
    console.log('Database connection established');

    console.log('Loading services...');
    await serviceLoader.loadAllServices();
    console.log('Loading webhooks...');
    await webhookLoader.loadAllWebhooks();
    await executionService.start();

    app.listen(3000, () => {});

    await saveData();
  } catch (err) {
    console.error('Failed to start application:', (err as Error).message);
    process.exit(1);
  }
})();
