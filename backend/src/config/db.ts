import 'reflect-metadata';
import { config } from 'dotenv';
import { DataSource } from 'typeorm';
import * as process from 'process';

import { User } from './entity/User';
import { UserOAuthProvider } from './entity/UserOAuthProvider';
import { UserToken } from './entity/UserToken';
import { UserSessions } from './entity/UserSessions';
import { UserActivityLogs } from './entity/UserActivityLogs';
import { UserServiceConfigs } from './entity/UserServiceConfigs';
import { UserServiceSubscriptions } from './entity/UserServiceSubscriptions';
import { ExternalWebhooks } from './entity/ExternalWebhooks';
import { WebhookConfigs } from './entity/WebhookConfigs';
import { WebhookEvents } from './entity/WebhookEvents';
import { WebhookFailures } from './entity/WebhookFailures';
import { WebhookReactions } from './entity/WebhookReactions';
import { WebhookStats } from './entity/WebhookStats';
import { Session } from './entity/Session';
import { Logger } from './entity/Logger';
// Load environment variables from .env file
config();

function getEnvVar(name: string): string {
  const value = process.env[name];
  if (typeof value !== 'string') {
    throw new Error(
      `Environment variable ${name} is required but was not provided.`
    );
  }
  return value;
}

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: getEnvVar('DB_HOST'),
  port: parseInt(getEnvVar('DB_PORT'), 10),
  username: getEnvVar('DB_USER'),
  password: getEnvVar('DB_PASSWORD'),
  database: getEnvVar('DB_NAME'),
  synchronize: true /* true for dev only; auto creates tables */,
  logging: false,
  entities: [
    User,
    UserOAuthProvider,
    UserToken,
    UserSessions,
    UserActivityLogs,
    UserServiceConfigs,
    UserServiceSubscriptions,
    ExternalWebhooks,
    WebhookConfigs,
    WebhookEvents,
    WebhookFailures,
    WebhookReactions,
    WebhookStats,
    Session,
    Logger,
  ],
  migrations: [],
  subscribers: [],
});
