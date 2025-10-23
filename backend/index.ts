import * as dotenv from 'dotenv';
dotenv.config();

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
import { StringEncryption } from './src/config/EncryptionService';

import userRoutes from './src/routes/user/user';
import apiRoutes, { languageRouter } from './src/routes/api/api';
import aboutRoutes from './src/routes/about/about';
import webhookRoutes from './src/webhooks';
import servicesRoutes from './src/routes/services';
import mappingsRoutes from './src/routes/services/mappings';

import { executionService } from './src/services/ExecutionService';
import { serviceLoader } from './src/services/ServiceLoader';
import { webhookLoader } from './src/webhooks/WebhookLoader';

import AdminRouter from './src/config/adminJs';
import session from 'express-session';

import { Session } from './src/config/entity/Session';
import { TypeormStore } from 'connect-typeorm';

const app = express();
export const JWT_SECRET = process.env.JWT_SECRET || '';

const FRONTEND_ORIGIN = process.env.FRONTEND_URL || '';
const BACKEND_ORIGIN = process.env.BACKEND_URL || '';
const allowedOrigins = [FRONTEND_ORIGIN, BACKEND_ORIGIN];

console.log('🚀 Starting middleware setup...');

app.use((req, res, next) => {
  if (req.path.startsWith('/admin')) return next();
  express.json()(req, res, next);
});

app.use((req, res, next) => {
  if (req.path.startsWith('/admin')) return next();
  express.urlencoded({ extended: true })(req, res, next);
});

app.use(cookieParser());

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
  })
);

app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

const sessionRepo = AppDataSource.getRepository(Session);

const sessionOptions: session.SessionOptions = {
  secret: process.env.SESSION_SECRET || 'super-secret-pass',
  resave: false,
  saveUninitialized: false,
  store: new TypeormStore({ cleanupLimit: 2 }).connect(sessionRepo),
  cookie: {
    maxAge: 1000 * 60 * 60 * 24,
  },
};

app.use(session(sessionOptions));
app.use(passport.initialize());
app.use(passport.session());

setupSwagger(app);
setupSignal();
const encryption = new StringEncryption();
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

    console.log('🔧 Initializing OAuth routes...');
    const authModule = await import('./src/routes/auth/auth');
    authModule.initializeOAuthRoutes();
    const authRoutes = authModule.default;

    console.log('🔧 Setting up AdminJS...');
    const { admin, adminRouter } = await AdminRouter(
      AppDataSource,
      sessionOptions
    );

    app.use(admin.options.rootPath, adminRouter);
    console.log(
      `✅ Admin panel available at http://localhost:8080${admin.options.rootPath}`
    );

    app.use('/api/auth', authRoutes);
    app.use('/api/user', userRoutes);
    app.use('/api/services', servicesRoutes);
    app.use('/api/mappings', mappingsRoutes);
    app.use('/api/info', apiRoutes);
    app.use('/api/language', languageRouter);
    app.use('/about.json', aboutRoutes);
    app.use('/api/webhooks', webhookRoutes);

    app.listen(3000, () => {
      console.log('🚀 Server running on port 3000 (mapped to 8080 via Docker)');
      console.log('📊 Admin panel: http://localhost:8080/admin');
      console.log('🔑 Login with: albane / admin');
    });

    await saveData();
  } catch (err) {
    console.error('❌ Failed to start application:', (err as Error).message);
    console.error(err);
    process.exit(1);
  }
})();

export { encryption };
