import * as dotenv from 'dotenv';
import { AppDataSource } from './src/config/db';
import { saveData } from './src/app';
import express from 'express';
import crypto from "crypto";
import cookieParser from "cookie-parser";
import { waitForPostgres } from './src/utils/waitForDb';
import { setupSwagger } from './src/routes/docs/swagger';

import authRoutes from './src/routes/auth/auth';
import userRoutes from './src/routes/user/user';

const app = express();
export const JWT_SECRET = crypto.randomBytes(64).toString("hex");
dotenv.config();

/* Declare  the cors and allowed routes */


app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());


/* Route definition with API as prefix */
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);

setupSwagger(app);


(async function start() {
  try {
    console.log('Waiting for Postgres to be ready...');
    await waitForPostgres({ retries: 12, delayMs: 2000 });

    await AppDataSource.initialize(); /* Example initilization of elem in table */

    app.listen(3000, () => {
      console.log('Server is running on port 3000');
    });

    await saveData();
  } catch (err) {
    console.error('Failed to start application:', (err as Error).message);
    process.exit(1);
  }
})();
