import { Client } from 'pg';
import * as process from 'process';

export interface WaitOptions {
  retries?: number;
  delayMs?: number;
}

export async function waitForPostgres(
  options: WaitOptions = {}
): Promise<void> {
  const retries = options.retries ?? 10;
  const delayMs = options.delayMs ?? 2000;

  const clientConfig = {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : undefined,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  };

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const client = new Client(clientConfig as unknown);
      await client.connect();
      await client.query('SELECT 1');
      await client.end();
      console.log('Postgres is available (attempt', attempt, ')');
      return;
    } catch (err) {
      console.log(
        `Postgres not ready (attempt ${attempt}/${retries}):`,
        (err as Error).message
      );
      if (attempt === retries) {
        throw new Error(
          `Postgres did not become ready after ${retries} attempts`
        );
      }
      await new Promise(res => setTimeout(res, delayMs));
    }
  }
}
