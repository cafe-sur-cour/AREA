'use server';

import path from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve(process.cwd(), '../deployment/.env') });

export async function getEnv() {
  return {
    backendPort: process.env.NODE_PORT,
    backendUrl: process.env.NEXT_PUBLIC_API_URL,
    frontendUrl: process.env.FRONTEND_URL,
  };
}
