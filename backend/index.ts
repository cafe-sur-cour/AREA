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

import AdminRouter from './src/config/adminJs';
import session from 'express-session';

import AdminJS from 'adminjs';
import AdminJSExpress from '@adminjs/express';



const app = express();
export const JWT_SECRET = crypto.randomBytes(64).toString('hex');
dotenv.config();

const FRONTEND_ORIGIN = process.env.FRONTEND_URL || 'http://localhost:8081';
const allowedOrigins = [
  FRONTEND_ORIGIN,
  'http://localhost:8080',
  'http://localhost:8081',
];

console.log('🚀 Starting middleware setup...');

// 1. BODY PARSERS FIRST
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// 2. CORS CONFIGURATION
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

// 3. SESSION MIDDLEWARE (BEFORE PASSPORT AND ADMIN)
app.use(session({
  secret: process.env.SESSION_SECRET || 'change-this-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 1000 * 60 * 60 * 24 // 24 hours
  }
}));

// 4. PASSPORT - WILL BE SKIPPED FOR ADMIN ROUTES
app.use((req, res, next) => {
  // Skip passport entirely for admin routes
  if (req.path.startsWith('/admin')) {
    return next();
  }
  next();
});

app.use(passport.initialize());
app.use(passport.session());

setupSwagger(app);
setupSignal();

// Extend session type to include adminUser
declare module 'express-session' {
  interface SessionData {
    adminUser?: {
      email: string;
      id: number;
      name?: string;
    };
  }
}

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

    // 5. SETUP ADMIN PANEL WITH CUSTOM AUTH MIDDLEWARE
    console.log('🔧 Setting up AdminJS...');
    const { admin, adminRouter } = await AdminRouter(AppDataSource);

    app.use(admin.options.rootPath, adminRouter);
    console.log(`✅ Admin panel available at http://localhost:8080${admin.options.rootPath}`);

    // 6. API ROUTES (PROTECTED BY PASSPORT)
    app.use('/api/auth', authRoutes);
    app.use('/api/user', userRoutes);
    app.use('/api/github', githubRoutes);
    app.use('/api/services', serviceConfigRoutes);
    app.use('/api/info', apiRoutes);
    app.use('/about.json', aboutRoutes);
    app.use('/webhooks', webhookRoutes);

    // Start server
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
